import { Query, Resolver } from '@nestjs/graphql';
import { VoiceEnhancementService } from '../voice-enhancement/voice-enhancement.service';
import {
  GqlVoiceEnhancementCapability,
  GqlVoiceEnhancementEngine,
  GqlVoiceEnhancementProfile,
} from './gql.types';

@Resolver
export class VoiceEnhancementGraphqlResolver {
  constructor(private readonly enhancement: VoiceEnhancementService) {}

  @Query( => GqlVoiceEnhancementEngine, { name: 'voiceEnhancementEngine' })
  voiceEnhancementEngine: GqlVoiceEnhancementEngine {
    const catalog = this.enhancement.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlVoiceEnhancementCapability[],
      spectralMlDenoise: catalog.architecture.spectralMlDenoise,
      liveAec: catalog.architecture.liveAec,
    };
  }

  @Query( => [GqlVoiceEnhancementProfile], { name: 'voiceEnhancementProfiles' })
  voiceEnhancementProfiles: GqlVoiceEnhancementProfile[] {
    return this.enhancement.profiles.profiles.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
    }));
  }
}
