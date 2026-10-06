import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/prompts')
@UseGuards(ClerkAuthGuard)
export class PromptsController {
  constructor(private readonly prompts: PromptsService) {}

  @Get
  list(@CurrentSession session: SessionContext) {
    return this.prompts.list(session.organizationId, session.workspaceId);
  }

  @Get(':key/versions')
  versions(@CurrentSession session: SessionContext, @Param('key') key: string) {
    return this.prompts.listVersions({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      key,
    });
  }

  @Post(':key/versions')
  @HttpCode(HttpStatus.CREATED)
  createVersion(
    @CurrentSession session: SessionContext,
    @Param('key') key: string,
    @Body body: { body?: string; note?: string; activate?: boolean },
  ) {
    return this.prompts.createVersion({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      key,
      body: body.body ?? '',
      note: body.note,
      activate: body.activate,
      userId: session.userId,
      role: session.role,
    });
  }

  @Post(':key/activate')
  activate(
    @CurrentSession session: SessionContext,
    @Param('key') key: string,
    @Body body: { version?: number },
  ) {
    return this.prompts.activate({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      key,
      version: Number(body.version),
      userId: session.userId,
      role: session.role,
    });
  }

  @Post(':key/fallback')
  fallback(@CurrentSession session: SessionContext, @Param('key') key: string) {
    return this.prompts.clearActive({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      key,
      userId: session.userId,
      role: session.role,
    });
  }
}
