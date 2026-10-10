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
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { audioMaxBytes } from '../audio/audio-limits';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';

@Controller('v1/voice-clones')
export class VoiceClonesController {
  constructor(private readonly clones: VoiceClonesService) {}

  @Get()
  @UseGuards(TranslateAuthGuard)
  list(@Req() req: Request & { translateAuth: TranslateAuthContext }) {
    return this.clones.list(req.translateAuth.organizationId, req.translateAuth.workspaceId);
  }

  @Get(':id')
  @UseGuards(TranslateAuthGuard)
  get(@Req() req: Request & { translateAuth: TranslateAuthContext }, @Param('id') id: string) {
    return this.clones.get(req.translateAuth.organizationId, req.translateAuth.workspaceId, id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
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
  @UseGuards(ClerkAuthGuard)
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
  @UseGuards(ClerkAuthGuard)
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
