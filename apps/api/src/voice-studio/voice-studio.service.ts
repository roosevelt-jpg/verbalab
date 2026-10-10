import { HttpStatus, Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { PrismaService } from '../prisma/prisma.service';
import { NeuralTtsService } from '../neural-tts/neural-tts.service';
import { ApiException } from '../common/errors/api-exception';
import { voiceStudioEngineCatalog } from './voice-studio.catalog';
import { compileSsmlLite } from './ssml-lite';
import { applyPronunciationLexicon } from './pronunciation-lexicon';

export type StudioAuth = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

export type TimelineClip = {
  id?: string;
  text?: string;
  ssml?: string;
  voice?: string;
  language?: string;
  pauseMsAfter?: number;
};

@Injectable()
export class VoiceStudioService {
  constructor(
    private readonly audio: AudioService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly prisma: PrismaService,
    private readonly neuralTts: NeuralTtsService,
  ) {}

  engine() {
    return voiceStudioEngineCatalog();
  }

  async analytics(organizationId: string) {
    const summary = await this.usage.summary(organizationId);
    const since = new Date(summary.periodStart);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { startsWith: 'voice_studio.' },
        createdAt: { gte: since },
      },
      select: { action: true },
      take: 1000,
    });
    const byAction: Record<string, number> = {};
    for (const event of events) {
      byAction[event.action] = (byAction[event.action] ?? 0) + 1;
    }
    return {
      periodStart: summary.periodStart,
      tts: summary.tts,
      studioActions: events.length,
      byAction,
      product: 'Lugemi Voice Studio',
      note: 'Studio action counts from audit. Full Voice Analytics lives in the Voice Analytics hub.',
      docs: '/docs/VOICE_STUDIO.md',
    };
  }

  async library(auth: StudioAuth) {
    const voices = await this.neuralTts.listVoices(
      {},
      { organizationId: auth.organizationId, workspaceId: auth.workspaceId },
    );
    return {
      voices: voices.data,
      count: voices.data.length,
      note: 'Voice Library = Neural TTS catalog + approved workspace clones.',
      docs: '/docs/VOICE_STUDIO.md',
    };
  }

  compileSsml(ssml: string) {
    return compileSsmlLite(ssml);
  }

  async listPronunciation(auth: StudioAuth) {
    const rows = await this.prisma.voiceStudioLexeme.findMany({
      where: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      orderBy: { grapheme: 'asc' },
    });
    return {
      lexemes: rows.map((r) => ({
        id: r.id,
        grapheme: r.grapheme,
        alias: r.alias,
        language: r.language,
        notes: r.notes,
      })),
      note: 'Grapheme→alias before TTS. Not pronunciation assessment.',
    };
  }

  async upsertPronunciation(
    auth: StudioAuth,
    body: { grapheme?: string; alias?: string; language?: string; notes?: string; id?: string },
  ) {
    const grapheme = body.grapheme?.trim();
    const alias = body.alias?.trim();
    if (!grapheme || !alias) {
      throw new ApiException(
        'validation_error',
        'grapheme and alias are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const row = body.id
      ? await this.prisma.voiceStudioLexeme.update({
          where: { id: body.id },
          data: {
            grapheme,
            alias,
            language: body.language?.trim() || null,
            notes: body.notes?.trim() || '',
          },
        })
      : await this.prisma.voiceStudioLexeme.upsert({
          where: {
            workspaceId_grapheme: {
              workspaceId: auth.workspaceId,
              grapheme,
            },
          },
          create: {
            organizationId: auth.organizationId,
            workspaceId: auth.workspaceId,
            grapheme,
            alias,
            language: body.language?.trim() || null,
            notes: body.notes?.trim() || '',
          },
          update: {
            alias,
            language: body.language?.trim() || null,
            notes: body.notes?.trim() || '',
          },
        });

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.pronunciation_upsert',
      route: 'POST /v1/voice-studio/pronunciation',
      ip: auth.ip,
      metadata: { id: row.id, grapheme: row.grapheme },
    });

    return {
      id: row.id,
      grapheme: row.grapheme,
      alias: row.alias,
      language: row.language,
      notes: row.notes,
    };
  }

  async deletePronunciation(auth: StudioAuth, id: string) {
    const existing = await this.prisma.voiceStudioLexeme.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Lexeme not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.voiceStudioLexeme.delete({ where: { id } });
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.pronunciation_delete',
      route: 'DELETE /v1/voice-studio/pronunciation/:id',
      ip: auth.ip,
      metadata: { id },
    });
    return { deleted: true, id };
  }

  async listProfiles(auth: StudioAuth) {
    const rows = await this.prisma.voiceStudioProfile.findMany({
      where: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      profiles: rows.map((r) => ({
        id: r.id,
        name: r.name,
        voice: r.voice,
        language: r.language,
        notes: r.notes,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async upsertProfile(
    auth: StudioAuth,
    body: { id?: string; name?: string; voice?: string; language?: string; notes?: string },
  ) {
    const name = body.name?.trim();
    const voice = body.voice?.trim();
    if (!name || !voice) {
      throw new ApiException(
        'validation_error',
        'name and voice are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const row = body.id
      ? await this.prisma.voiceStudioProfile.update({
          where: { id: body.id },
          data: {
            name,
            voice,
            language: body.language?.trim() || null,
            notes: body.notes?.trim() || '',
          },
        })
      : await this.prisma.voiceStudioProfile.create({
          data: {
            organizationId: auth.organizationId,
            workspaceId: auth.workspaceId,
            name,
            voice,
            language: body.language?.trim() || null,
            notes: body.notes?.trim() || '',
          },
        });

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.profile_upsert',
      route: 'POST /v1/voice-studio/profiles',
      ip: auth.ip,
      metadata: { id: row.id, voice: row.voice },
    });

    return {
      id: row.id,
      name: row.name,
      voice: row.voice,
      language: row.language,
      notes: row.notes,
    };
  }

  async deleteProfile(auth: StudioAuth, id: string) {
    const existing = await this.prisma.voiceStudioProfile.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Profile not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.voiceStudioProfile.delete({ where: { id } });
    return { deleted: true, id };
  }

  async listProjects(auth: StudioAuth) {
    const rows = await this.prisma.voiceStudioProject.findMany({
      where: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      projects: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        timeline: r.timeline,
        updatedAt: r.updatedAt.toISOString(),
      })),
      note: 'Timeline is a linear clip list — not a DAW.',
    };
  }

  async upsertProject(
    auth: StudioAuth,
    body: {
      id?: string;
      name?: string;
      description?: string;
      timeline?: TimelineClip[];
    },
  ) {
    const name = body.name?.trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const timeline = Array.isArray(body.timeline) ? body.timeline : [];
    const row = body.id
      ? await this.prisma.voiceStudioProject.update({
          where: { id: body.id },
          data: {
            name,
            description: body.description?.trim() || '',
            timeline,
          },
        })
      : await this.prisma.voiceStudioProject.create({
          data: {
            organizationId: auth.organizationId,
            workspaceId: auth.workspaceId,
            name,
            description: body.description?.trim() || '',
            timeline,
          },
        });

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.project_upsert',
      route: 'POST /v1/voice-studio/projects',
      ip: auth.ip,
      metadata: { id: row.id, clips: timeline.length },
    });

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      timeline: row.timeline,
    };
  }

  async deleteProject(auth: StudioAuth, id: string) {
    const existing = await this.prisma.voiceStudioProject.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Project not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.voiceStudioProject.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async loadLexemes(auth: StudioAuth) {
    return this.prisma.voiceStudioLexeme.findMany({
      where: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
  }

  private async prepareText(
    auth: StudioAuth,
    input: { text?: string; ssml?: string },
  ): Promise<{ renderedText: string; ssmlPlan: ReturnType<typeof compileSsmlLite> | null }> {
    let base = '';
    let ssmlPlan: ReturnType<typeof compileSsmlLite> | null = null;
    if (typeof input.ssml === 'string' && input.ssml.trim()) {
      ssmlPlan = compileSsmlLite(input.ssml);
      base = ssmlPlan.plainText;
    } else if (typeof input.text === 'string') {
      base = input.text;
    } else {
      throw new ApiException(
        'validation_error',
        'text or ssml is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const lexemes = await this.loadLexemes(auth);
    const renderedText = applyPronunciationLexicon(base, lexemes);
    return { renderedText, ssmlPlan };
  }

  async preview(auth: StudioAuth, body: {
    text?: string;
    ssml?: string;
    voice?: string;
    language?: string;
    format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
  }) {
    const voice = body.voice?.trim();
    if (!voice) {
      throw new ApiException('validation_error', 'voice is required', HttpStatus.BAD_REQUEST);
    }
    const { renderedText, ssmlPlan } = await this.prepareText(auth, body);
    const result = await this.audio.speak({
      text: renderedText,
      voice,
      language: body.language,
      format: body.format,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.preview',
      route: 'POST /v1/voice-studio/preview',
      ip: auth.ip,
      metadata: {
        voice: result.voice,
        characters: result.characters,
        usedSsml: Boolean(ssmlPlan),
      },
    });

    return {
      ...result,
      renderedText,
      ssmlPlan,
      mode: 'preview',
    };
  }

  async generate(auth: StudioAuth, body: {
    text?: string;
    ssml?: string;
    voice?: string;
    language?: string;
    format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
  }) {
    const out = await this.preview(auth, body);
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.generate',
      route: 'POST /v1/voice-studio/generate',
      ip: auth.ip,
      metadata: { voice: out.voice, characters: out.characters },
    });
    return { ...out, mode: 'generate' };
  }

  async testVoice(auth: StudioAuth, body: { voice?: string; language?: string }) {
    const voice = body.voice?.trim();
    if (!voice) {
      throw new ApiException('validation_error', 'voice is required', HttpStatus.BAD_REQUEST);
    }
    const text = 'Voice Studio test. Karibu Lugemi.';
    const result = await this.audio.speak({
      text,
      voice,
      language: body.language,
      format: 'mp3',
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.test',
      route: 'POST /v1/voice-studio/test',
      ip: auth.ip,
      metadata: { voice: result.voice },
    });
    return { ...result, renderedText: text, mode: 'test' };
  }

  async compare(
    auth: StudioAuth,
    body: {
      text?: string;
      ssml?: string;
      voices?: string[];
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    const voices = (body.voices ?? []).map((v) => v.trim()).filter(Boolean);
    if (voices.length < 2) {
      throw new ApiException(
        'validation_error',
        'voices must include at least two voice ids',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (voices.length > 6) {
      throw new ApiException(
        'validation_error',
        'compare supports at most 6 voices',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { renderedText, ssmlPlan } = await this.prepareText(auth, body);
    const clips = [];
    for (const voice of voices) {
      const result = await this.audio.speak({
        text: renderedText,
        voice,
        language: body.language,
        format: body.format ?? 'mp3',
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        ip: auth.ip,
      });
      clips.push({
        voice: result.voice,
        provider: result.provider,
        mimeType: result.mimeType,
        format: result.format,
        characters: result.characters,
        watermarkApplied: result.watermarkApplied,
        audioBase64: result.audio.toString('base64'),
      });
    }

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.compare',
      route: 'POST /v1/voice-studio/compare',
      ip: auth.ip,
      metadata: { voices, characters: [...renderedText].length },
    });

    return {
      renderedText,
      ssmlPlan,
      clips,
      note: 'Side-by-side clips for A/B listening — not spectral diff tooling.',
    };
  }

  async renderTimeline(
    auth: StudioAuth,
    body: {
      clips?: TimelineClip[];
      projectId?: string;
      defaultVoice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    let clips = body.clips;
    if ((!clips || !clips.length) && body.projectId) {
      const project = await this.prisma.voiceStudioProject.findFirst({
        where: {
          id: body.projectId,
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
        },
      });
      if (!project) {
        throw new ApiException('not_found', 'Project not found', HttpStatus.NOT_FOUND);
      }
      clips = project.timeline as TimelineClip[];
    }
    if (!Array.isArray(clips) || clips.length === 0) {
      throw new ApiException(
        'validation_error',
        'clips or projectId with timeline is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (clips.length > 40) {
      throw new ApiException(
        'validation_error',
        'timeline supports at most 40 clips',
        HttpStatus.BAD_REQUEST,
      );
    }

    const defaultVoice = body.defaultVoice?.trim() || 'alloy';
    const format = body.format ?? 'mp3';
    const lexemes = await this.loadLexemes(auth);
    const rendered: Array<{
      index: number;
      voice: string;
      text: string;
      pauseMsAfter: number;
      provider: string;
      bytes: number;
      audioBase64: string;
      watermarkApplied: boolean;
    }> = [];
    const buffers: Buffer[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]!;
      let text = '';
      if (clip.ssml?.trim()) {
        text = compileSsmlLite(clip.ssml).plainText;
      } else if (clip.text?.trim()) {
        text = clip.text.trim();
      } else {
        throw new ApiException(
          'validation_error',
          `clip[${i}] requires text or ssml`,
          HttpStatus.BAD_REQUEST,
        );
      }
      text = applyPronunciationLexicon(text, lexemes);
      const voice = clip.voice?.trim() || defaultVoice;
      const result = await this.audio.speak({
        text,
        voice,
        language: clip.language || body.language,
        format,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        ip: auth.ip,
      });
      buffers.push(result.audio);
      rendered.push({
        index: i,
        voice: result.voice,
        text,
        pauseMsAfter: Math.max(0, Number(clip.pauseMsAfter) || 0),
        provider: result.provider,
        bytes: result.audio.length,
        audioBase64: result.audio.toString('base64'),
        watermarkApplied: result.watermarkApplied,
      });
    }

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.timeline_render',
      route: 'POST /v1/voice-studio/timeline/render',
      ip: auth.ip,
      metadata: { clips: clips.length, format },
    });

    return {
      clips: rendered,
      audioBase64: Buffer.concat(buffers).toString('base64'),
      mimeType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
      format,
      note:
        'Linear ordered speak clips concatenated. pauseMsAfter is metadata only (silence not inserted without a DAW/ffmpeg path). Not nonlinear NLE.',
    };
  }
}
