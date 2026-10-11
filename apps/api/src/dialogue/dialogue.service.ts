import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';

export type DialogueTurn = {
  speaker: string;
  text: string;
  voice: string;
  language?: string;
};

/** Concatenate PCM WAV buffers (mono 16-bit) with optional silence gaps. */
function concatWavBuffers(parts: Buffer[], gapMs = 280): Buffer {
  if (parts.length === 0) {
    throw new ApiException('provider_error', 'No dialogue audio produced', HttpStatus.BAD_GATEWAY);
  }
  const decoded = parts.map(decodeWav);
  const sampleRate = decoded[0]!.sampleRate;
  for (const d of decoded) {
    if (d.sampleRate !== sampleRate || d.channels !== 1 || d.bitsPerSample !== 16) {
      throw new ApiException(
        'provider_error',
        'Dialogue turns must share mono 16-bit PCM sample rate',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
  const gapSamples = Math.floor((sampleRate * gapMs) / 1000);
  const gap = Buffer.alloc(gapSamples * 2);
  const chunks: Buffer[] = [];
  let totalData = 0;
  decoded.forEach((d, i) => {
    chunks.push(d.pcm);
    totalData += d.pcm.length;
    if (i < decoded.length - 1) {
      chunks.push(gap);
      totalData += gap.length;
    }
  });
  const out = Buffer.alloc(44 + totalData);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + totalData, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(totalData, 40);
  let offset = 44;
  for (const c of chunks) {
    c.copy(out, offset);
    offset += c.length;
  }
  return out;
}

function decodeWav(buf: Buffer): {
  pcm: Buffer;
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
} {
  if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') {
    throw new ApiException('provider_error', 'Expected WAV audio for dialogue merge', HttpStatus.BAD_GATEWAY);
  }
  const channels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'data') {
      return {
        pcm: buf.subarray(offset + 8, offset + 8 + size),
        sampleRate,
        channels,
        bitsPerSample,
      };
    }
    offset += 8 + size + (size % 2);
  }
  throw new ApiException('provider_error', 'WAV data chunk missing', HttpStatus.BAD_GATEWAY);
}

@Injectable()
export class DialogueService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  async synthesize(input: {
    turns: DialogueTurn[];
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    if (!Array.isArray(input.turns) || input.turns.length === 0) {
      throw new ApiException('validation_error', 'turns must be a non-empty array', HttpStatus.BAD_REQUEST);
    }
    if (input.turns.length > 24) {
      throw new ApiException('validation_error', 'turns exceeds maximum of 24', HttpStatus.BAD_REQUEST);
    }

    const chars = input.turns.reduce((n, t) => n + [...(t.text ?? '')].length, 0);
    await this.billing.assertProductQuota(input.organizationId, 'tts', chars);

    const wavParts: Buffer[] = [];
    const timeline: Array<{
      speaker: string;
      voice: string;
      text: string;
      language: string;
      characters: number;
      provider: string;
    }> = [];

    for (const turn of input.turns) {
      const text = typeof turn.text === 'string' ? turn.text.trim() : '';
      const voice = typeof turn.voice === 'string' ? turn.voice.trim() : '';
      const speaker = typeof turn.speaker === 'string' ? turn.speaker.trim() : 'Speaker';
      if (!text || !voice) {
        throw new ApiException(
          'validation_error',
          'each turn requires speaker, text, and voice',
          HttpStatus.BAD_REQUEST,
        );
      }
      const out = await this.gateway.synthesize({
        text,
        voice,
        language: turn.language,
        format: 'wav',
        requireIntelligible: true,
      });
      wavParts.push(out.audio);
      timeline.push({
        speaker,
        voice: out.voice,
        text,
        language: turn.language ?? 'auto',
        characters: out.characters,
        provider: out.provider,
      });
    }

    const audio = concatWavBuffers(wavParts);
    await this.usage.recordTts({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      characters: chars,
      provider: 'lugemi_dialogue',
    });

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'dialogue.synthesized',
      route: 'POST /v1/dialogue/synthesize',
      ip: input.ip,
      apiKeyPrefix,
      metadata: { turns: timeline.length, characters: chars },
    });

    return {
      audio,
      mimeType: 'audio/wav',
      format: 'wav' as const,
      characters: chars,
      turns: timeline,
      provider: 'lugemi_dialogue',
    };
  }
}
