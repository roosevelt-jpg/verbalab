import { Query, Resolver } from '@nestjs/graphql';
import { VoiceCloningService } from '../voice-cloning/voice-cloning.service';
import { GqlVoiceCloningCapability, GqlVoiceCloningEngine } from './gql.types';

@Resolver
export class VoiceCloningGraphqlResolver {
  constructor(private readonly cloning: VoiceCloningService) {}

  @Query( => GqlVoiceCloningEngine, { name: 'voiceCloningEngine' })
  voiceCloningEngine: GqlVoiceCloningEngine {
    const catalog = this.cloning.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlVoiceCloningCapability[],
      consentRequired: catalog.trust.consentRequired,
      watermarkRequired: catalog.trust.watermarkRequired,
    };
  }
}
