import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DecisionEngineService } from './decision-engine.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/decision-engine')
export class DecisionEngineController {
  constructor(private readonly decisions: DecisionEngineService) {}

  @Get('engine')
  engine() {
    return this.decisions.engine();
  }

  @Get('kinds')
  kinds() {
    return this.decisions.kinds();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.decisions.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.decisions.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('decide')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  decide(
    @Req() req: AuthedReq,
    @Body()
    body: {
      kind?: string;
      query?: string;
      family?: string;
      quality?: string;
      signalStrength?: number;
      matched?: boolean;
    },
  ) {
    return this.decisions.decide({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      kind: body.kind,
      query: body.query,
      family: body.family,
      quality: body.quality,
      signalStrength: body.signalStrength,
      matched: body.matched,
    });
  }
}
