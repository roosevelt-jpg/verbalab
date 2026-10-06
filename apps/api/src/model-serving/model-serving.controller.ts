import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ModelServingService } from './model-serving.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/model-serving')
export class ModelServingController {
  constructor(private readonly serving: ModelServingService) {}

  @Get('engine')
  engine() {
    return this.serving.engine();
  }

  @Get('kinds')
  kinds() {
    return this.serving.kinds();
  }

  @Get('modes')
  modes() {
    return this.serving.modes();
  }

  @Get('ceilings')
  ceilings() {
    return this.serving.ceilings();
  }

  @Get('endpoints')
  endpoints(@Query('kind') kind?: string) {
    return this.serving.endpoints(kind);
  }

  @Get('deployments')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req() req: AuthedReq,
    @Query('status') status?: string,
    @Query('kind') kind?: string,
  ) {
    return this.serving.listDeployments({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      status,
      kind,
    });
  }

  @Post('deployments')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  deploy(
    @Req() req: AuthedReq,
    @Body()
    body: {
      kind?: string;
      modelSlug?: string;
      version?: string;
      strategy?: string;
      trafficPercent?: number;
      slot?: string;
      label?: string;
    },
  ) {
    return this.serving.deploy({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('deployments/:id/traffic')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  traffic(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { trafficPercent?: number },
  ) {
    return this.serving.setTraffic({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      trafficPercent: body.trafficPercent,
    });
  }

  @Post('deployments/:id/promote')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  promote(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.serving.promote({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('deployments/:id/rollback')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  rollback(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.serving.rollback({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('deployments/:id/release')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  release(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.serving.release({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('deployments/:id/redeploy')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  redeploy(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { version?: string; trafficPercent?: number },
  ) {
    return this.serving.redeployVersion({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      version: body.version,
      trafficPercent: body.trafficPercent,
    });
  }

  @Get('health')
  @UseGuards(TranslateAuthGuard)
  health(@Req() req: AuthedReq) {
    return this.serving.health({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.serving.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.serving.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
