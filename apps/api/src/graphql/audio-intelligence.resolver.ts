import { Query, Resolver } from '@nestjs/graphql';
import { AudioIntelligenceService } from '../audio-intelligence/audio-intelligence.service';
import { GqlAudioCapability, GqlAudioEngine } from './gql.types';

@Resolver()
export class AudioIntelligenceGraphqlResolver {
  constructor(private readonly audioIntel: AudioIntelligenceService) {}

  @Query(() => GqlAudioEngine, { name: 'audioEngine' })
  audioEngine(): GqlAudioEngine {
    const catalog = this.audioIntel.engine();
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlAudioCapability[],
    };
  }
}
