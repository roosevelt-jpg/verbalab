import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { VerticalGlossariesService } from './vertical-glossaries.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/vertical-glossaries')
@UseGuards(ClerkAuthGuard)
export class VerticalGlossariesController {
  constructor(private readonly verticals: VerticalGlossariesService) {}

  @Get()
  list(@CurrentSession() session: SessionContext) {
    return this.verticals.list(session.organizationId, session.workspaceId);
  }

  @Get('installs')
  installs(@CurrentSession() session: SessionContext) {
    return this.verticals.listInstalls(session.organizationId, session.workspaceId);
  }

  @Get(':id')
  get(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.verticals.get(session.organizationId, session.workspaceId, id);
  }

  @Post(':id/install')
  install(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.verticals.install({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      packId: id,
      userId: session.userId,
      role: session.role,
      ip: req.ip,
    });
  }
}
