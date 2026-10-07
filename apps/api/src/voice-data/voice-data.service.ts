import { randomBytes } from 'crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import {
  findDialect,
  VOICE_DATA_CONSENT_TEXT,
  VOICE_DATA_CONSENT_VERSION,
  VOICE_DATA_DIALECTS,
} from './voice-data.constants';
import { VoiceDataStorage } from './voice-data.storage';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MIN_DURATION_MS = 500;
const MAX_DURATION_MS = 30_000;
const RECORDING_STATUSES = ['pending', 'approved', 'rejected'] as const;
type RecordingStatus = (typeof RECORDING_STATUSES)[number];

const recordingSelect = {
  id: true,
  speakerId: true,
  promptId: true,
  text: true,
  status: true,
  mimeType: true,
  durationMs: true,
  sizeBytes: true,
  createdAt: true,
} as const;

function notFound(what: string): ApiException {
  return new ApiException('not_found', `${what} not found`, HttpStatus.NOT_FOUND);
}

function badRequest(message: string): ApiException {
  return new ApiException('validation_error', message, HttpStatus.BAD_REQUEST);
}

function optionalText(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

function audioExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('aac') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg')) return 'mp3';
  return 'bin';
}

export type CreateSpeakerInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  dialect?: unknown;
  gender?: unknown;
  ageRange?: unknown;
  hometown?: unknown;
  notes?: unknown;
};

@Injectable()
export class VoiceDataService {
  private readonly logger = new Logger(VoiceDataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VoiceDataStorage,
  ) {}

  dialects() {
    return VOICE_DATA_DIALECTS;
  }

  // ---------- admin ----------

  async overview() {
    const [speakers, prompts, recordings, approvedDurations] = await Promise.all([
      this.prisma.voiceDataSpeaker.groupBy({ by: ['dialect'], _count: { _all: true } }),
      this.prisma.voiceDataPrompt.groupBy({ by: ['dialect'], where: { active: true }, _count: { _all: true } }),
      this.prisma.voiceDataRecording.groupBy({ by: ['speakerId', 'status'], _count: { _all: true } }),
      this.prisma.voiceDataRecording.groupBy({
        by: ['speakerId'],
        where: { status: 'approved' },
        _sum: { durationMs: true },
      }),
    ]);
    const speakerDialects = new Map(
      (await this.prisma.voiceDataSpeaker.findMany({ select: { id: true, dialect: true } })).map((s) => [
        s.id,
        s.dialect,
      ]),
    );
    const byDialect = new Map<
      string,
      { speakers: number; prompts: number; pending: number; approved: number; rejected: number; approvedMs: number }
    >();
    const row = (dialect: string) => {
      let entry = byDialect.get(dialect);
      if (!entry) {
        entry = { speakers: 0, prompts: 0, pending: 0, approved: 0, rejected: 0, approvedMs: 0 };
        byDialect.set(dialect, entry);
      }
      return entry;
    };
    for (const s of speakers) row(s.dialect).speakers = s._count._all;
    for (const p of prompts) row(p.dialect).prompts = p._count._all;
    for (const r of recordings) {
      const dialect = speakerDialects.get(r.speakerId);
      if (!dialect) continue;
      const entry = row(dialect);
      if (r.status === 'approved' || r.status === 'pending' || r.status === 'rejected') {
        entry[r.status] += r._count._all;
      }
    }
    for (const d of approvedDurations) {
      const dialect = speakerDialects.get(d.speakerId);
      if (dialect) row(dialect).approvedMs += d._sum.durationMs ?? 0;
    }
    return {
      storage: this.storage.enabled() ? 'object_storage' : 'database',
      dialects: [...byDialect.entries()].map(([code, stats]) => ({
        code,
        name: findDialect(code)?.name ?? code,
        ...stats,
      })),
    };
  }

  async listSpeakers(dialect?: string) {
    const speakers = await this.prisma.voiceDataSpeaker.findMany({
      where: dialect ? { dialect } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const ids = speakers.map((s) => s.id);
    const [counts, durations] = await Promise.all([
      this.prisma.voiceDataRecording.groupBy({
        by: ['speakerId', 'status'],
        where: { speakerId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.voiceDataRecording.groupBy({
        by: ['speakerId'],
        where: { speakerId: { in: ids }, status: { not: 'rejected' } },
        _sum: { durationMs: true },
      }),
    ]);
    return speakers.map((s) => {
      const mine = counts.filter((c) => c.speakerId === s.id);
      const count = (status: string) => mine.find((c) => c.status === status)?._count._all ?? 0;
      return {
        ...s,
        dialectName: findDialect(s.dialect)?.name ?? s.dialect,
        recordings: { pending: count('pending'), approved: count('approved'), rejected: count('rejected') },
        recordedMs: durations.find((d) => d.speakerId === s.id)?._sum.durationMs ?? 0,
      };
    });
  }

  async createSpeaker(input: CreateSpeakerInput) {
    const name = optionalText(input.name, 120);
    if (!name) throw badRequest('name is required');
    const dialect = typeof input.dialect === 'string' ? findDialect(input.dialect) : undefined;
    if (!dialect) throw badRequest('dialect must be one of the supported dialect codes');
    return this.prisma.voiceDataSpeaker.create({
      data: {
        token: randomBytes(24).toString('base64url'),
        name,
        email: optionalText(input.email, 200),
        phone: optionalText(input.phone, 40),
        languageCode: dialect.languageCode,
        dialect: dialect.code,
        gender: optionalText(input.gender, 20),
        ageRange: optionalText(input.ageRange, 20),
        hometown: optionalText(input.hometown, 120),
        notes: optionalText(input.notes, 1000),
      },
    });
  }

  /** Erases the speaker and every recording (withdrawal + deletion request). */
  async deleteSpeaker(id: string) {
    const speaker = await this.prisma.voiceDataSpeaker.findUnique({ where: { id } });
    if (!speaker) throw notFound('Speaker');
    const stored = await this.prisma.voiceDataRecording.findMany({
      where: { speakerId: id, storageKey: { not: null } },
      select: { storageKey: true },
    });
    for (const r of stored) {
      await this.storage.remove(r.storageKey!).catch((error: unknown) => {
        this.logger.warn(`voice-data: failed to delete ${r.storageKey}: ${String(error)}`);
      });
    }
    await this.prisma.voiceDataSpeaker.delete({ where: { id } });
    return { deleted: true, recordings: stored.length };
  }

  async listPrompts(dialect: string) {
    const prompts = await this.prisma.voiceDataPrompt.findMany({
      where: { dialect },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { recordings: true, feedback: true } } },
    });
    return prompts.map(({ _count, ...p }) => ({ ...p, recordings: _count.recordings, feedback: _count.feedback }));
  }

  async addPrompts(input: { dialect?: unknown; category?: unknown; lines?: unknown }) {
    const dialect = typeof input.dialect === 'string' ? findDialect(input.dialect) : undefined;
    if (!dialect) throw badRequest('dialect must be one of the supported dialect codes');
    if (!Array.isArray(input.lines)) throw badRequest('lines must be an array of sentences');
    const category = optionalText(input.category, 40) ?? 'general';
    const wanted = [
      ...new Set(
        input.lines
          .filter((l): l is string => typeof l === 'string')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && l.length <= 400),
      ),
    ];
    if (wanted.length > 2000) throw badRequest('Add at most 2000 sentences at a time');
    const existing = new Set(
      (
        await this.prisma.voiceDataPrompt.findMany({
          where: { dialect: dialect.code, text: { in: wanted } },
          select: { text: true },
        })
      ).map((p) => p.text),
    );
    const fresh = wanted.filter((t) => !existing.has(t));
    if (fresh.length) {
      await this.prisma.voiceDataPrompt.createMany({
        data: fresh.map((text) => ({ dialect: dialect.code, category, text })),
      });
    }
    return { added: fresh.length, skipped: wanted.length - fresh.length };
  }

  async setPromptActive(id: string, active: unknown) {
    if (typeof active !== 'boolean') throw badRequest('active must be true or false');
    const prompt = await this.prisma.voiceDataPrompt.findUnique({ where: { id } });
    if (!prompt) throw notFound('Prompt');
    return this.prisma.voiceDataPrompt.update({ where: { id }, data: { active } });
  }

  listRecordings(filters: { speakerId?: string; dialect?: string; status?: string }) {
    return this.prisma.voiceDataRecording.findMany({
      where: {
        speakerId: filters.speakerId || undefined,
        status: filters.status || undefined,
        speaker: filters.dialect ? { dialect: filters.dialect } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { ...recordingSelect, speaker: { select: { name: true, dialect: true } } },
    });
  }

  async recordingAudio(id: string): Promise<{ data: Buffer; mimeType: string }> {
    const rec = await this.prisma.voiceDataRecording.findUnique({
      where: { id },
      select: { data: true, storageKey: true, mimeType: true },
    });
    if (!rec) throw notFound('Recording');
    const data = rec.storageKey ? await this.storage.get(rec.storageKey) : Buffer.from(rec.data ?? []);
    return { data, mimeType: rec.mimeType };
  }

  async setRecordingStatus(id: string, status: unknown) {
    if (typeof status !== 'string' || !RECORDING_STATUSES.includes(status as RecordingStatus)) {
      throw badRequest(`status must be one of ${RECORDING_STATUSES.join(', ')}`);
    }
    const rec = await this.prisma.voiceDataRecording.findUnique({ where: { id }, select: { id: true } });
    if (!rec) throw notFound('Recording');
    return this.prisma.voiceDataRecording.update({ where: { id }, data: { status }, select: recordingSelect });
  }

  listFeedback(dialect: string) {
    return this.prisma.voiceDataPromptFeedback.findMany({
      where: { prompt: { dialect } },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { prompt: { select: { text: true } }, speaker: { select: { name: true } } },
    });
  }

  /** JSONL training manifest: approved clips from speakers who have not withdrawn. */
  async exportManifest(dialect: string): Promise<string> {
    const rows = await this.prisma.voiceDataRecording.findMany({
      where: { status: 'approved', speaker: { dialect, withdrawnAt: null } },
      orderBy: { createdAt: 'asc' },
      select: {
        ...recordingSelect,
        speaker: { select: { id: true, gender: true, ageRange: true, hometown: true, dialect: true } },
      },
    });
    return rows
      .map((r) =>
        JSON.stringify({
          id: r.id,
          audio: `/v1/admin/voice-data/recordings/${r.id}/audio`,
          mime_type: r.mimeType,
          duration_ms: r.durationMs,
          text: r.text,
          speaker_id: r.speaker.id,
          dialect: r.speaker.dialect,
          gender: r.speaker.gender,
          age_range: r.speaker.ageRange,
          hometown: r.speaker.hometown,
        }),
      )
      .join('\n');
  }

  // ---------- recorder session (secret link) ----------

  private async speakerByToken(token: string) {
    const speaker = await this.prisma.voiceDataSpeaker.findUnique({ where: { token } });
    if (!speaker) throw notFound('Recording link');
    return speaker;
  }

  async session(token: string) {
    const speaker = await this.speakerByToken(token);
    const dialect = findDialect(speaker.dialect);
    const [done, flagged, totalPrompts, recordedMs] = await Promise.all([
      this.prisma.voiceDataRecording.findMany({
        where: { speakerId: speaker.id, status: { not: 'rejected' }, promptId: { not: null } },
        select: { promptId: true },
      }),
      this.prisma.voiceDataPromptFeedback.findMany({ where: { speakerId: speaker.id }, select: { promptId: true } }),
      this.prisma.voiceDataPrompt.count({ where: { dialect: speaker.dialect, active: true } }),
      this.prisma.voiceDataRecording.aggregate({
        where: { speakerId: speaker.id, status: { not: 'rejected' } },
        _sum: { durationMs: true },
      }),
    ]);
    const handled = [...done.map((d) => d.promptId!), ...flagged.map((f) => f.promptId)];
    const prompts = await this.prisma.voiceDataPrompt.findMany({
      where: { dialect: speaker.dialect, active: true, id: { notIn: handled } },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { id: true, text: true, category: true },
    });
    return {
      speaker: {
        name: speaker.name,
        dialect: speaker.dialect,
        dialectName: dialect?.name ?? speaker.dialect,
        consented: Boolean(speaker.consentAt) && speaker.consentVersion === VOICE_DATA_CONSENT_VERSION,
        withdrawn: Boolean(speaker.withdrawnAt),
      },
      consent: { version: VOICE_DATA_CONSENT_VERSION, paragraphs: VOICE_DATA_CONSENT_TEXT },
      progress: {
        recorded: done.length,
        skipped: flagged.length,
        totalPrompts,
        recordedMs: recordedMs._sum.durationMs ?? 0,
      },
      prompts,
    };
  }

  async consent(
    token: string,
    body: { fullName?: unknown; adult?: unknown; nativeSpeaker?: unknown; agree?: unknown },
    meta: { ip?: string; userAgent?: string },
  ) {
    const speaker = await this.speakerByToken(token);
    if (speaker.withdrawnAt) throw badRequest('This recording link has been withdrawn');
    const fullName = optionalText(body.fullName, 120);
    if (!fullName) throw badRequest('Type your full name to sign');
    if (body.adult !== true || body.nativeSpeaker !== true || body.agree !== true) {
      throw badRequest('All three confirmations are required');
    }
    await this.prisma.voiceDataSpeaker.update({
      where: { id: speaker.id },
      data: {
        consentVersion: VOICE_DATA_CONSENT_VERSION,
        consentName: fullName,
        consentAt: new Date(),
        consentIp: meta.ip?.slice(0, 80) ?? null,
        consentUserAgent: meta.userAgent?.slice(0, 300) ?? null,
      },
    });
    return { consented: true };
  }

  private async activeSpeaker(token: string) {
    const speaker = await this.speakerByToken(token);
    if (speaker.withdrawnAt) throw badRequest('This recording link has been withdrawn');
    if (!speaker.consentAt || speaker.consentVersion !== VOICE_DATA_CONSENT_VERSION) {
      throw new ApiException('consent_required', 'Please read and sign the consent first', HttpStatus.FORBIDDEN);
    }
    return speaker;
  }

  async addRecording(
    token: string,
    file: Express.Multer.File | undefined,
    body: { promptId?: unknown; durationMs?: unknown },
  ) {
    const speaker = await this.activeSpeaker(token);
    if (!file?.buffer?.length) throw badRequest('Audio file is required');
    if (file.size > MAX_AUDIO_BYTES) throw badRequest('Recording is too large');
    const mimeType = (file.mimetype || '').split(';')[0]!.trim().toLowerCase();
    if (!mimeType.startsWith('audio/') && mimeType !== 'video/webm') throw badRequest('Upload must be audio');
    const durationMs = Math.round(Number(body.durationMs));
    if (!Number.isFinite(durationMs) || durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS) {
      throw badRequest('Recordings must be between half a second and 30 seconds');
    }
    const promptId = typeof body.promptId === 'string' ? body.promptId : '';
    const prompt = await this.prisma.voiceDataPrompt.findUnique({ where: { id: promptId } });
    if (!prompt || !prompt.active || prompt.dialect !== speaker.dialect) throw badRequest('Unknown sentence');

    const previous = await this.prisma.voiceDataRecording.findMany({
      where: { speakerId: speaker.id, promptId: prompt.id },
      select: { id: true, storageKey: true },
    });

    const audioMime = mimeType === 'video/webm' ? 'audio/webm' : mimeType;
    const created = await this.prisma.voiceDataRecording.create({
      data: {
        speakerId: speaker.id,
        promptId: prompt.id,
        text: prompt.text,
        mimeType: audioMime,
        durationMs,
        sizeBytes: file.size,
        data: this.storage.enabled() ? null : new Uint8Array(file.buffer),
      },
      select: { id: true },
    });
    if (this.storage.enabled()) {
      const key = `voice-data/${speaker.dialect}/${speaker.id}/${created.id}.${audioExtension(audioMime)}`;
      try {
        await this.storage.put(key, file.buffer, audioMime);
      } catch (error) {
        await this.prisma.voiceDataRecording.delete({ where: { id: created.id } });
        throw new ApiException(
          'storage_error',
          error instanceof Error ? error.message : 'Could not store recording',
          HttpStatus.BAD_GATEWAY,
        );
      }
      await this.prisma.voiceDataRecording.update({ where: { id: created.id }, data: { storageKey: key } });
    }

    for (const old of previous) {
      if (old.storageKey) await this.storage.remove(old.storageKey).catch(() => undefined);
      await this.prisma.voiceDataRecording.delete({ where: { id: old.id } });
    }
    return { id: created.id };
  }

  async feedback(token: string, body: { promptId?: unknown; suggestion?: unknown }) {
    const speaker = await this.activeSpeaker(token);
    const suggestion = optionalText(body.suggestion, 600);
    if (!suggestion) throw badRequest('Write how you would naturally say it');
    const promptId = typeof body.promptId === 'string' ? body.promptId : '';
    const prompt = await this.prisma.voiceDataPrompt.findUnique({ where: { id: promptId } });
    if (!prompt || prompt.dialect !== speaker.dialect) throw badRequest('Unknown sentence');
    await this.prisma.voiceDataPromptFeedback.upsert({
      where: { speakerId_promptId: { speakerId: speaker.id, promptId: prompt.id } },
      create: { speakerId: speaker.id, promptId: prompt.id, suggestion },
      update: { suggestion },
    });
    return { saved: true };
  }

  async withdraw(token: string) {
    const speaker = await this.speakerByToken(token);
    if (!speaker.withdrawnAt) {
      await this.prisma.voiceDataSpeaker.update({ where: { id: speaker.id }, data: { withdrawnAt: new Date() } });
    }
    return { withdrawn: true };
  }
}
