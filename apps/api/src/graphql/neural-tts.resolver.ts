import { Args, Query, Resolver } from '@nestjs/graphql';
import { NeuralTtsService } from '../neural-tts/neural-tts.service';
import { GqlNeuralTtsCapability, GqlNeuralTtsEngine, GqlNeuralTtsVoice } from './gql.types';

@Resolver
export class NeuralTtsGraphqlResolver {
  constructor(private readonly tts: NeuralTtsService) {}

  @Query( => GqlNeuralTtsEngine, { name: 'neuralTtsEngine' })
  neuralTtsEngine: GqlNeuralTtsEngine {
    const catalog = this.tts.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlNeuralTtsCapability[],
    };
  }

  @Query( => [GqlNeuralTtsVoice], { name: 'neuralTtsVoices' })
  async neuralTtsVoices(
    @Args('gender', { type:  => String, nullable: true }) gender?: string,
    @Args('language', { type:  => String, nullable: true }) language?: string,
  ): Promise<GqlNeuralTtsVoice[]> {
    const result = await this.tts.listVoices({ gender, language });
    return result.data.map((v) => ({
      id: v.id,
      name: v.name,
      gender: v.gender,
      languages: v.languages,
      provider: v.provider,
      personality: v.personality,
      ageGroup: v.ageGroup,
      dialect: v.dialect,
      accent: v.accent,
      category: v.category,
    }));
  }
}
