import { Query, Resolver } from '@nestjs/graphql';
import { VoiceBiometricsService } from '../voice-biometrics/voice-biometrics.service';
import {
  GqlVoiceBiometricsCapability,
  GqlVoiceBiometricsEngine,
} from './gql.types';

@Resolver()
export class VoiceBiometricsGraphqlResolver {
  constructor(private readonly biometrics: VoiceBiometricsService) {}

  @Query(() => GqlVoiceBiometricsEngine, { name: 'voiceBiometricsEngine' })
  voiceBiometricsEngine(): GqlVoiceBiometricsEngine {
    const catalog = this.biometrics.engine();
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlVoiceBiometricsCapability[],
      nistCertified: catalog.architecture.nistCertified,
      padCertified: catalog.architecture.padCertified,
    };
  }
}
