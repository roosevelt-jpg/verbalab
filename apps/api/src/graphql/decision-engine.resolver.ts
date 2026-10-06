import { Query, Resolver } from '@nestjs/graphql';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';
import { GqlDecisionEngine } from './gql.types';

@Resolver
export class DecisionEngineGraphqlResolver {
  constructor(private readonly decisions: DecisionEngineService) {}

  @Query( => GqlDecisionEngine, { name: 'decisionEngine' })
  decisionEngine: GqlDecisionEngine {
    const c = this.decisions.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      enterpriseBrms: c.honesty.enterpriseBrms,
      droolsPegaParity: c.honesty.droolsPegaParity,
      lightRules: c.honesty.lightRules,
    };
  }
}
