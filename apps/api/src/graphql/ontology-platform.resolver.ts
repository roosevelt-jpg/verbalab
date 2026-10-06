import { Query, Resolver } from '@nestjs/graphql';
import { OntologyPlatformService } from '../ontology-platform/ontology-platform.service';
import { GqlOntologyEngine } from './gql.types';

@Resolver
export class OntologyPlatformGraphqlResolver {
  constructor(private readonly ontology: OntologyPlatformService) {}

  @Query( => GqlOntologyEngine, { name: 'ontologyEngine' })
  ontologyEngine: GqlOntologyEngine {
    const c = this.ontology.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      owlOs: c.honesty.owlOs,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      extendsVl184: c.honesty.extendsVl184,
    };
  }
}
