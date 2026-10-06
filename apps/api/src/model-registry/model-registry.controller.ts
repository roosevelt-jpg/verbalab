import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ModelRegistryService } from './model-registry.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/model-registry')
export class ModelRegistryController {
  constructor(private readonly registry: ModelRegistryService) {}

  @Get('engine')
  engine {
    return this.registry.engine;
  }

  @Get('capabilities')
  capabilities {
    return this.registry.capabilities;
  }

  @Get('cards')
  cards {
    return this.registry.cards;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.registry.overview(session);
  }

  @Get('versions')
  @UseGuards(ClerkAuthGuard)
  listVersions(@CurrentSession session: SessionContext) {
    return this.registry.listVersions(session);
  }

  @Post('versions')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createVersion(
    @CurrentSession session: SessionContext,
    @Body
    body: { modelSlug?: string; version?: string; notes?: string; submit?: boolean },
  ) {
    return this.registry.createVersion(session, body);
  }

  @Post('versions/:id/approve')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  approve(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.registry.approveVersion(session, id);
  }

  @Post('versions/:id/reject')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentSession session: SessionContext,
    @Param('id') id: string,
    @Body body: { notes?: string },
  ) {
    return this.registry.rejectVersion(session, id, body);
  }

  @Post('versions/:id/rollback')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  rollback(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.registry.rollbackVersion(session, id);
  }

  @Get('deployments')
  @UseGuards(ClerkAuthGuard)
  listDeployments(@CurrentSession session: SessionContext) {
    return this.registry.listDeployments(session);
  }

  @Post('deployments')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createDeployment(
    @CurrentSession session: SessionContext,
    @Body
    body: {
      versionId?: string;
      strategy?: string;
      canaryPercent?: number;
      notes?: string;
    },
  ) {
    return this.registry.createDeployment(session, body);
  }

  @Get('monitoring')
  @UseGuards(ClerkAuthGuard)
  monitoring(@CurrentSession session: SessionContext) {
    return this.registry.monitoring(session);
  }
}
