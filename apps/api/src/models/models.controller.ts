import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ModelsService } from './models.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/models')
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  /** Public Models Engine catalog — honesty + links (not MLflow). */
  @Get('engine')
  engine() {
    return this.models.engine();
  }

  /** Public live matrix — which adapters are ready per feature. */
  @Get('live')
  live() {
    return this.models.liveMatrix();
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  list(@Query('feature') feature?: string) {
    if (feature) this.models.assertFeature(feature);
    return this.models.list(feature);
  }

  @Get(':idOrSlug')
  @UseGuards(ClerkAuthGuard)
  get(@Param('idOrSlug') idOrSlug: string) {
    return this.models.get(idOrSlug);
  }

  @Post(':idOrSlug/external-url')
  @UseGuards(ClerkAuthGuard, PlatformAdminGuard)
  setExternalUrl(
    @Param('idOrSlug') idOrSlug: string,
    @Body() body: { externalUrl?: string | null; notes?: string },
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
  ) {
    return this.models.setExternalUrl({
      idOrSlug,
      externalUrl: body.externalUrl ?? null,
      notes: body.notes,
      organizationId: session.organizationId,
      actorUserId: session.userId,
      ip: req.ip,
    });
  }

  @Post(':idOrSlug/status')
  @UseGuards(ClerkAuthGuard, PlatformAdminGuard)
  setStatus(
    @Param('idOrSlug') idOrSlug: string,
    @Body() body: { status?: 'ready' | 'retired' | 'draft' },
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
  ) {
    return this.models.setStatus({
      idOrSlug,
      status: body.status ?? 'ready',
      organizationId: session.organizationId,
      actorUserId: session.userId,
      ip: req.ip,
    });
  }
}
