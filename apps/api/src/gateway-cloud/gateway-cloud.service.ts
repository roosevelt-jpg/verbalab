import { Injectable } from '@nestjs/common';
import { ModelsService } from '../models/models.service';
import { HealthService } from '../health/health.service';
import { gatewayCapabilities, gatewayProviderCatalog } from './gateway-providers.catalog';
import { ownTtsConfigured } from '../gateway/own-tts.adapter';

@Injectable()
export class GatewayCloudService {
  constructor(
    private readonly models: ModelsService,
    private readonly health: HealthService,
  ) {}

  providers() {
    return {
      providers: gatewayProviderCatalog(),
      capabilities: gatewayCapabilities(),
      docs: '/docs/AI_GATEWAY_CLOUD.md',
    };
  }

  async overview() {
    const [live, providers] = await Promise.all([
      this.models.liveMatrix(),
      Promise.resolve(this.providers()),
    ]);

    return {
      health: this.health.getStatus(),
      configured: {
        openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
        googleTranslate: Boolean(process.env.GOOGLE_TRANSLATE_API_KEY?.trim()),
        googleVision: Boolean(
          process.env.GOOGLE_VISION_API_KEY?.trim() || process.env.GOOGLE_TRANSLATE_API_KEY?.trim(),
        ),
        openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
        ownTts: ownTtsConfigured(),
        vendorClone: Boolean(
          process.env.VENDOR_VOICE_CLONE_API_KEY?.trim() || process.env.ELEVENLABS_API_KEY?.trim(),
        ),
      },
      liveModels: live,
      ...providers,
      links: {
        models: '/models',
        finetunes: '/finetunes',
        audio: '/audio',
        chat: '/chat',
        health: '/health',
      },
      volume: {
        closes: 'Volume 1 Part A',
        note: 'Foundations complete: strategy, blueprint, Engineering OS, cloud/identity/developer/enterprise, AI gateway.',
      },
    };
  }
}
