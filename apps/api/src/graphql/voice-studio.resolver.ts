import { Query, Resolver } from '@nestjs/graphql';
import { VoiceStudioService } from '../voice-studio/voice-studio.service';
import {
  GqlVoiceStudioCapability,
  GqlVoiceStudioEngine,
} from './gql.types';

@Resolver
export class VoiceStudioGraphqlResolver {
  constructor(private readonly studio: VoiceStudioService) {}

  @Query( => GqlVoiceStudioEngine, { name: 'voiceStudioEngine' })
  voiceStudioEngine: GqlVoiceStudioEngine {
    const catalog = this.studio.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlVoiceStudioCapability[],
      nonlinearDaw: catalog.architecture.nonlinearDaw,
    };
  }
}
