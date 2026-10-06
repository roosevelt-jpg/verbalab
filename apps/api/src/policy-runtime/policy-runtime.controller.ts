import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PolicyRuntimeService } from './policy-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/policy-runtime')
export class PolicyRuntimeController {
  constructor(private readonly runtime: PolicyRuntimeService) {}

  @Get('engine')
  engine {
    return this.runtime.engine;
  }

  @Get('kinds')
  kinds {
    return this.runtime.kinds;
  }

  @Get('policies')
  @UseGuards(TranslateAuthGuard)
  list(@Req req: AuthedReq) {
    return this.runtime.listPolicies({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('policies/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req req: AuthedReq, @Param('id') id: string) {
    return this.runtime.getPolicy({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('policies')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req req: AuthedReq,
    @Body
    body: {
      name?: string;
      kind?: string;
      effect?: string;
      actions?: string[];
      targets?: string[];
      region?: string;
      enabled?: boolean;
    },
  ) {
    return this.runtime.createPolicy({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('policies/:id/enabled')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  setEnabled(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { enabled?: boolean },
  ) {
    return this.runtime.setEnabled({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      enabled: body.enabled,
    });
  }

  @Post('evaluate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  evaluate(
    @Req req: AuthedReq,
    @Body
    body: {
      runtime?: string;
      subjectId?: string;
      action?: string;
      permissions?: string[];
    },
  ) {
    return this.runtime.evaluate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.runtime.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.runtime.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
