import { Query, Resolver } from '@nestjs/graphql';
import { SpeechRecognitionService } from '../speech-recognition/speech-recognition.service';
import { GqlSpeechCapability, GqlSpeechEngine, GqlSpeechVocabPack } from './gql.types';

@Resolver
export class SpeechRecognitionGraphqlResolver {
  constructor(private readonly speech: SpeechRecognitionService) {}

  @Query( => GqlSpeechEngine, { name: 'speechEngine' })
  speechEngine: GqlSpeechEngine {
    const catalog = this.speech.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlSpeechCapability[],
    };
  }

  @Query( => [GqlSpeechVocabPack], { name: 'speechVocabularyPacks' })
  speechVocabularyPacks: GqlSpeechVocabPack[] {
    return this.speech.listIndustryPacks.packs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      phrases: p.phrases,
    }));
  }
}
