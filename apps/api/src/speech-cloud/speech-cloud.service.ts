import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  speechArchitectureNotes,
  speechProductCatalog,
} from './speech-products.catalog';

@Injectable()
export class SpeechCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  products() {
    return {
      products: speechProductCatalog(),
      architecture: speechArchitectureNotes(),
      docs: '/docs/SPEECH_CLOUD.md',
    };
  }

  async overview(session: SessionContext) {
    const [usageSummary, voiceCloneCount] = await Promise.all([
      this.usage.summary(session.organizationId),
      this.prisma.voiceClone.count({
        where: { organizationId: session.organizationId },
      }),
    ]);

    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        stt: usageSummary.stt,
        tts: usageSummary.tts,
      },
      workspace: {
        voiceClones: voiceCloneCount,
      },
      products: speechProductCatalog(),
      architecture: speechArchitectureNotes(),
      deferred: {
        streamingStt: false,
        speakerIntelligence: false,
        emotionAi: false,
        acousticSer: true,
        audioIntelligence: false,
        echoCancellation: true,
        pronunciationAi: false,
        forcedAlignmentPhonemes: true,
        wakeWord: false,
        onDeviceWakeDnn: true,
        callIntelligence: false,
        realtimeCcaas: true,
        audioEnhancement: false,
        speechAnalytics: false,
        werEvalLab: true,
        liveMicWebSocket: true,
        neuralDiarization: true,
        nistBiometrics: true,
        regionalAccentModels: true,
      },
      links: {
        speech: '/speech',
        recognition: '/speech-recognition',
        speakers: '/speaker-intelligence',
        audio: '/audio',
        interpret: '/interpret',
        voice: '/voice',
        accents: '/accents',
        accentIntelligence: '/accent-intelligence',
        emotion: '/emotion-intelligence',
        audioIntelligence: '/audio-intelligence',
        pronunciation: '/pronunciation-intelligence',
        wakeWord: '/wake-word',
        callIntelligence: '/call-intelligence',
        speechAnalytics: '/speech-analytics',
        usage: '/usage',
        billing: '/billing',
        analytics: '/analytics',
        graphql: '/graphql',
        playground: '/playground',
      },
      docs: '/docs/SPEECH_CLOUD.md',
    };
  }
}
