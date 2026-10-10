import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { KnowledgeFabricService } from './knowledge-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/knowledge-fabric')
export class KnowledgeFabricController {
  constructor(private readonly fabric: KnowledgeFabricService) {}

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
  route(@Body() body: { kinds?: string[] }) {
    return this.fabric.route({ kinds: body.kinds });
  }

  @Post('distribute')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  distribute(
    @Req() req: AuthedReq,
    @Body()
    body: {
      kinds?: string[];
      targetWorkspaceIds?: string[];
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    return this.fabric.distribute({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      kinds: body.kinds,
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
      kinds?: string[];
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    return this.fabric.sync({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      targetWorkspaceId: body.targetWorkspaceId,
      kinds: body.kinds,
      publishEvent: body.publishEvent,
      topic: body.topic,
    });
  }

  @Post('federate')
  @HttpCode(HttpStatus.OK)
  federate(@Body() body: { kinds?: string[] }) {
    return this.fabric.federate({ kinds: body.kinds });
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
