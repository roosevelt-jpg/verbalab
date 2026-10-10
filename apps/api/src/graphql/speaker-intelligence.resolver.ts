import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { SpeakerIntelligenceService } from '../speaker-intelligence/speaker-intelligence.service';
import { GqlSpeakerCapability, GqlSpeakerEngine, GqlSpeakerProfile } from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver()
export class SpeakerIntelligenceGraphqlResolver {
  constructor(private readonly speakers: SpeakerIntelligenceService) {}

  @Query(() => GqlSpeakerEngine, { name: 'speakerEngine' })
  speakerEngine(): GqlSpeakerEngine {
    const catalog = this.speakers.engine();
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlSpeakerCapability[],
    };
  }

  @Query(() => [GqlSpeakerProfile], { name: 'speakerProfiles' })
  @UseGuards(TranslateAuthGuard)
  async speakerProfiles(@Context('req') req: GqlReq): Promise<GqlSpeakerProfile[]> {
    const auth = req.translateAuth!;
    const res = await this.speakers.listProfiles(auth.organizationId, auth.workspaceId);
    return res.data.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      status: p.status,
      enrolled: p.enrolled,
      enrollmentCount: p.enrollmentCount,
    }));
  }

  @Mutation(() => GqlSpeakerProfile, { name: 'createSpeakerProfile' })
  @UseGuards(TranslateAuthGuard)
  async createSpeakerProfile(
    @Args('displayName') displayName: string,
    @Args('externalRef', { type: () => String, nullable: true }) externalRef: string | undefined,
    @Context('req') req: GqlReq,
  ): Promise<GqlSpeakerProfile> {
    const auth = req.translateAuth!;
    const p = await this.speakers.createProfile({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      displayName,
      externalRef,
      userId: req.sessionAuth?.userId,
    });
    return {
      id: p.id,
      displayName: p.displayName,
      status: p.status,
      enrolled: p.enrolled,
      enrollmentCount: p.enrollmentCount,
    };
  }
}
