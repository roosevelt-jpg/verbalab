import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { GlossaryService } from './glossary.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { Request } from 'express';

@Controller('v1/glossary/terms')
@UseGuards(ClerkAuthGuard)
export class GlossaryController {
  constructor(private readonly glossary: GlossaryService) {}

  @Get
  list(
    @CurrentSession session: SessionContext,
    @Query('source') source?: string,
    @Query('target') target?: string,
  ) {
    return this.glossary.list(session.organizationId, session.workspaceId, { source, target });
  }

  @Post
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentSession session: SessionContext,
    @Req req: Request,
    @Body
    body: {
      sourceLang?: string;
      targetLang?: string;
      sourceTerm?: string;
      targetTerm?: string;
      caseSensitive?: boolean;
      wholeWord?: boolean;
    },
  ) {
    return this.glossary.create({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      sourceLang: body.sourceLang ?? '',
      targetLang: body.targetLang ?? '',
      sourceTerm: body.sourceTerm ?? '',
      targetTerm: body.targetTerm ?? '',
      caseSensitive: body.caseSensitive,
      wholeWord: body.wholeWord,
      ip: clientIp(req),
    });
  }

  @Patch(':id')
  update(
    @CurrentSession session: SessionContext,
    @Req req: Request,
    @Param('id') id: string,
    @Body
    body: {
      sourceTerm?: string;
      targetTerm?: string;
      caseSensitive?: boolean;
      wholeWord?: boolean;
    },
  ) {
    return this.glossary.update(session.organizationId, id, {
      ...body,
      userId: session.userId,
      ip: clientIp(req),
    });
  }

  @Delete(':id')
  remove(
    @CurrentSession session: SessionContext,
    @Req req: Request,
    @Param('id') id: string,
  ) {
    if (!id) {
      throw new ApiException('validation_error', 'id is required', HttpStatus.BAD_REQUEST);
    }
    return this.glossary.remove(session.organizationId, id, {
      userId: session.userId,
      ip: clientIp(req),
    });
  }
}
