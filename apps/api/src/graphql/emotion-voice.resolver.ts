import { Query, Resolver } from '@nestjs/graphql';
import { EmotionVoiceService } from '../emotion-voice/emotion-voice.service';
import {
  GqlEmotionVoiceCapability,
  GqlEmotionVoiceEngine,
  GqlEmotionVoiceProfile,
} from './gql.types';

@Resolver
export class EmotionVoiceGraphqlResolver {
  constructor(private readonly emotionVoice: EmotionVoiceService) {}

  @Query( => GqlEmotionVoiceEngine, { name: 'emotionVoiceEngine' })
  emotionVoiceEngine: GqlEmotionVoiceEngine {
    const catalog = this.emotionVoice.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlEmotionVoiceCapability[],
      trainedExpressiveModel: catalog.architecture.trainedExpressiveModel,
    };
  }

  @Query( => [GqlEmotionVoiceProfile], { name: 'emotionVoiceProfiles' })
  emotionVoiceProfiles: GqlEmotionVoiceProfile[] {
    return this.emotionVoice.profiles.profiles.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      preferredVoice: p.preferredVoice,
    }));
  }
}
