import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { VoiceClonesService } from './voice-clones.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { audioMaxBytes } from '../audio/audio-limits';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';

@Controller('v1/voice-clones')
@UseGuards(ClerkAuthGuard)
export class VoiceClonesController {
  constructor(private readonly clones: VoiceClonesService) {}

  @Get()
  list(@CurrentSession() session: SessionContext) {
    return this.clones.list(session.organizationId, session.workspaceId);
  }

  @Get(':id')
  get(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.clones.get(session.organizationId, session.workspaceId, id);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('samples', 5, {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  create(
    @CurrentSession() session: SessionContext,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body()
    body: {
      name?: string;
      consentAttested?: string | boolean;
      consentNotes?: string;
    },
    @Req() req: Request,
  ) {
    const attested =
      body.consentAttested === true ||
      body.consentAttested === 'true' ||
      body.consentAttested === '1';
    return this.clones.create({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      name: body.name ?? '',
      consentAttested: attested,
      consentNotes: body.consentNotes ?? '',
      files: files ?? [],
      ip: req.ip,
    });
  }

  @Post(':id/review')
  review(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body() body: { decision?: 'approved' | 'rejected'; reviewNotes?: string },
    @Req() req: Request,
  ) {
    if (body.decision !== 'approved' && body.decision !== 'rejected') {
      throw new ApiException(
        'validation_error',
        'decision must be approved or rejected',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.clones.review({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      id,
      decision: body.decision,
      reviewNotes: body.reviewNotes,
      ip: req.ip,
    });
  }

  @Post(':id/disable')
  disable(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: Request,
  ) {
    return this.clones.disable({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      id,
      reason: body.reason,
      ip: req.ip,
    });
  }
}
