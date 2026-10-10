import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PromptIntelligenceService } from './prompt-intelligence.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/prompt-intelligence')
export class PromptIntelligenceController {
  constructor(private readonly promptIntel: PromptIntelligenceService) {}

  @Get('engine')
  engine() {
    return this.promptIntel.engine();
  }

  @Get('keys')
  keys() {
    return this.promptIntel.keys();
  }

  @Get('registry')
  @UseGuards(TranslateAuthGuard)
  registry(@Req() req: AuthedReq) {
    return this.promptIntel.registry(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('marketplace')
  @UseGuards(TranslateAuthGuard)
  marketplace(@Req() req: AuthedReq) {
    return this.promptIntel.marketplace(req.translateAuth.organizationId);
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.promptIntel.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.promptIntel.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  preview(
    @Req() req: AuthedReq,
    @Body() body: { key?: string; body?: string; version?: number },
  ) {
    return this.promptIntel.preview({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      key: body.key,
      body: body.body,
      version: body.version,
    });
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  evaluate(
    @Req() req: AuthedReq,
    @Body() body: { key?: string; body?: string; version?: number },
  ) {
    return this.promptIntel.evaluate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      key: body.key,
      body: body.body,
      version: body.version,
    });
  }

  @Post('security-scan')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  securityScan(
    @Req() req: AuthedReq,
    @Body() body: { key?: string; body?: string; version?: number },
  ) {
    return this.promptIntel.securityScan({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      key: body.key,
      body: body.body,
      version: body.version,
    });
  }
}
