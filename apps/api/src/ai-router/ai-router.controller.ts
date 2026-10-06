import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AiRouterService } from './ai-router.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/ai-router')
export class AiRouterController {
  constructor(private readonly router: AiRouterService) {}

  @Get('engine')
  engine {
    return this.router.engine;
  }

  @Get('features')
  features {
    return this.router.features;
  }

  @Get('providers')
  providers {
    return this.router.providers;
  }

  @Get('policies')
  @UseGuards(TranslateAuthGuard)
  getPolicy(@Req req: AuthedReq) {
    return this.router.getPolicy({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Put('policies')
  @UseGuards(TranslateAuthGuard)
  upsertPolicy(
    @Req req: AuthedReq,
    @Body
    body: {
      optimize?: string;
      maxRetries?: number;
      preferRegion?: string;
      allowFallback?: boolean;
      preferConfiguredOnly?: boolean;
      streamingPreferred?: boolean;
      preferProvider?: string | null;
    },
  ) {
    return this.router.upsertPolicy({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('resolve')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  resolve(
    @Req req: AuthedReq,
    @Body
    body: {
      feature?: string;
      optimize?: string;
      preferProvider?: string;
      preferRegion?: string;
      allowFallback?: boolean;
      streaming?: boolean;
      dryRun?: boolean;
    },
  ) {
    return this.router.resolve({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('decisions')
  @UseGuards(TranslateAuthGuard)
  decisions(@Req req: AuthedReq, @Query('feature') feature?: string) {
    return this.router.listDecisions({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      feature,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.router.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.router.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
