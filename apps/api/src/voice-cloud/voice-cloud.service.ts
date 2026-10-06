import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  voiceArchitectureNotes,
  voiceProductCatalog,
} from './voice-products.catalog';

@Injectable()
export class VoiceCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  products() {
    return {
      products: voiceProductCatalog(),
      architecture: voiceArchitectureNotes(),
      docs: '/docs/VOICE_CLOUD.md',
    };
  }

  async overview(session: SessionContext) {
    const [usageSummary, voiceCloneCount, speakerProfileCount] = await Promise.all([
      this.usage.summary(session.organizationId),
      this.prisma.voiceClone.count({
        where: { organizationId: session.organizationId },
      }),
      this.prisma.speakerProfile.count({
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
        tts: usageSummary.tts,
      },
      workspace: {
        voiceClones: voiceCloneCount,
        speakerProfiles: speakerProfileCount,
      },
      products: voiceProductCatalog(),
      architecture: voiceArchitectureNotes(),
      deferred: {
        neuralTtsProductization: false,
        streamingTts: true,
        professionalVoiceCloning: true, // same vendor path; multi-hour pro training still deferred
        emotionVoiceSynthesis: false,
        trainedExpressiveTts: true,
        voiceConversion: true,
        voiceRestoration: false,
        audioMastering: true,
        spectralEnhancement: true,
        liveAec: true,
        krispParity: true,
        nistVoiceBiometrics: true,
        antiSpoofLiveness: false,
        certifiedPad: true,
        voiceMarketplace: false,
        celebrityVoiceSkus: true,
        crossTenantCloneSynthesis: true,
        voiceAnalyticsProduct: false,
        biVoiceDashboard: true,
        ssmlTimelineStudio: false,
        nonlinearDaw: true,
      },
      links: {
        voiceCloud: '/voice-cloud',
        neuralTts: '/neural-tts',
        voiceCloning: '/voice-cloning',
        emotionVoice: '/emotion-voice',
        voiceStudio: '/voice-studio',
        voiceEnhancement: '/voice-enhancement',
        voiceBiometrics: '/voice-biometrics',
        voiceMarketplace: '/voice-marketplace',
        voiceAnalytics: '/voice-analytics',
        audio: '/audio',
        voiceClones: '/voice-cloning',
        speakers: '/speaker-intelligence',
        audioIntelligence: '/audio-intelligence',
        voiceFaq: '/voice',
        interpret: '/interpret',
        speech: '/speech',
        marketplace: '/marketplace',
        usage: '/usage',
        billing: '/billing',
        analytics: '/analytics',
        graphql: '/graphql',
        playground: '/playground',
      },
      docs: '/docs/VOICE_CLOUD.md',
    };
  }
}
