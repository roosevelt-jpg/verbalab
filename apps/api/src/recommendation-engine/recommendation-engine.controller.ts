import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RecommendationEngineService } from './recommendation-engine.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/recommendation-engine')
export class RecommendationEngineController {
  constructor(private readonly recommendations: RecommendationEngineService) {}

  @Get('engine')
  engine() {
    return this.recommendations.engine();
  }

  @Get('kinds')
  kinds() {
    return this.recommendations.kinds();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.recommendations.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.recommendations.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  recommend(
    @Req() req: AuthedReq,
    @Body()
    body: {
      kind?: string;
      query?: string;
      language?: string;
      k?: number;
      retrieveMemory?: boolean;
      useVectors?: boolean;
    },
  ) {
    return this.recommendations.recommend({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      kind: body.kind,
      query: body.query,
      language: body.language,
      k: body.k,
      retrieveMemory: body.retrieveMemory,
      useVectors: body.useVectors,
    });
  }
}
