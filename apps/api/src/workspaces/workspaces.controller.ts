import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { WorkspacesService } from './workspaces.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/workspaces')
@UseGuards(ClerkAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get
  list(@CurrentSession session: SessionContext) {
    return this.workspaces.list(session.organizationId, session.workspaceId);
  }

  @Post
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentSession session: SessionContext,
    @Body
    body: { name?: string; defaultSourceLang?: string; defaultTargetLang?: string },
    @Req req: Request,
  ) {
    return this.workspaces.create({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      name: body.name ?? '',
      defaultSourceLang: body.defaultSourceLang,
      defaultTargetLang: body.defaultTargetLang,
      ip: req.ip,
    });
  }

  @Get(':id')
  get(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.workspaces.get(session.organizationId, id, session.workspaceId);
  }

  @Patch(':id')
  update(
    @CurrentSession session: SessionContext,
    @Param('id') id: string,
    @Body
    body: { name?: string; defaultSourceLang?: string; defaultTargetLang?: string },
    @Req req: Request,
  ) {
    return this.workspaces.update({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      id,
      name: body.name,
      defaultSourceLang: body.defaultSourceLang,
      defaultTargetLang: body.defaultTargetLang,
      ip: req.ip,
      currentWorkspaceId: session.workspaceId,
    });
  }
}
