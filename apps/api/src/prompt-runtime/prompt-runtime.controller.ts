import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PromptRuntimeService } from './prompt-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/prompt-runtime')
export class PromptRuntimeController {
  constructor(private readonly runtime: PromptRuntimeService) {}

  @Get('engine')
  engine() {
    return this.runtime.engine();
  }

  @Get('keys')
  keys() {
    return this.runtime.keys();
  }

  @Get('routes')
  routes() {
    return {
      routes: this.runtime.engine().routes,
      honesty: { promptMeshOs: false },
      note: 'Sandbox feature→key map — not a prompt mesh OS.',
    };
  }

  @Get('registry')
  @UseGuards(TranslateAuthGuard)
  registry(@Req() req: AuthedReq) {
    return this.runtime.registry({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('templates')
  @UseGuards(TranslateAuthGuard)
  templates(@Req() req: AuthedReq) {
    return this.runtime.templates({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('versions')
  @UseGuards(TranslateAuthGuard)
  versions(@Req() req: AuthedReq, @Query('key') key?: string) {
    return this.runtime.versions({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      key,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.runtime.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.runtime.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Post('route')
  @HttpCode(HttpStatus.OK)
  route(@Body() body: { feature?: string }) {
    return this.runtime.route(body);
  }

  @Post('render')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  render(
    @Req() req: AuthedReq,
    @Body()
    body: {
      key?: string;
      body?: string;
      version?: number;
      variables?: Record<string, string>;
    },
  ) {
    return this.runtime.render({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('validate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  validate(
    @Req() req: AuthedReq,
    @Body()
    body: {
      key?: string;
      body?: string;
      version?: number;
      variables?: Record<string, string>;
    },
  ) {
    return this.runtime.validate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('security-scan')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  securityScan(
    @Req() req: AuthedReq,
    @Body() body: { key?: string; body?: string; version?: number },
  ) {
    return this.runtime.securityScan({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('optimize')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  optimize(
    @Req() req: AuthedReq,
    @Body() body: { key?: string; body?: string; version?: number; maxChars?: number },
  ) {
    return this.runtime.optimize({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('execute')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  execute(
    @Req() req: AuthedReq,
    @Body()
    body: {
      key?: string;
      feature?: string;
      body?: string;
      version?: number;
      variables?: Record<string, string>;
      useCache?: boolean;
      skipSecurity?: boolean;
    },
  ) {
    return this.runtime.execute({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }
}
