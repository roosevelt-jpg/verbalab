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
import { PromptFabricService } from './prompt-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/prompt-fabric')
export class PromptFabricController {
  constructor(private readonly fabric: PromptFabricService) {}

  @Get('products')
  products() {
    return this.fabric.products();
  }

  @Get('engine')
  engine() {
    return this.fabric.products();
  }

  @Get('routes')
  routes() {
    return this.fabric.routes();
  }

  @Post('route')
  @HttpCode(HttpStatus.OK)
  route(@Body() body: { kinds?: string[]; feature?: string }) {
    return this.fabric.route({ kinds: body.kinds, feature: body.feature });
  }

  @Get('versions')
  @UseGuards(TranslateAuthGuard)
  versions(@Req() req: AuthedReq, @Query('key') key?: string) {
    return this.fabric.versions(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      },
      key,
    );
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
    return this.fabric.validate(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      },
      body,
    );
  }

  @Get('policies')
  policies() {
    return this.fabric.policies();
  }

  @Post('distribute')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  distribute(
    @Req() req: AuthedReq,
    @Body()
    body: {
      keys?: string[];
      targetWorkspaceIds?: string[];
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    return this.fabric.distribute({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      keys: body.keys,
      targetWorkspaceIds: body.targetWorkspaceIds,
      publishEvent: body.publishEvent,
      topic: body.topic,
    });
  }

  @Post('sync')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  sync(
    @Req() req: AuthedReq,
    @Body()
    body: {
      targetWorkspaceId: string;
      keys?: string[];
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    return this.fabric.sync({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      targetWorkspaceId: body.targetWorkspaceId,
      keys: body.keys,
      publishEvent: body.publishEvent,
      topic: body.topic,
    });
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.fabric.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.fabric.monitoring();
  }
}
