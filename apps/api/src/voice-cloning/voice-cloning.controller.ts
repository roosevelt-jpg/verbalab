import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { VoiceCloningService } from './voice-cloning.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { audioMaxBytes } from '../audio/audio-limits';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/voice-cloning')
export class VoiceCloningController {
  constructor(private readonly cloning: VoiceCloningService) {}

  @Get('engine')
  engine() {
    return this.cloning.engine();
  }

  @Get('consent/policy')
  consentPolicy() {
    return this.cloning.consentPolicy();
  }

  @Get('engine/analytics')
  @UseGuards(ClerkAuthGuard)
  analytics(@CurrentSession() session: SessionContext) {
    return this.cloning.analytics(session.organizationId, session.workspaceId);
  }

  @Get('library')
  @UseGuards(ClerkAuthGuard)
  library(@CurrentSession() session: SessionContext) {
    return this.cloning.library(session.organizationId, session.workspaceId);
  }

  @Post('enroll')
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(
    FilesInterceptor('samples', 5, {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  enroll(
    @CurrentSession() session: SessionContext,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body()
    body: {
      name?: string;
      consentAttested?: string | boolean;
      consentNotes?: string;
      cloneMode?: string;
      ownershipAttested?: string | boolean;
      ownershipNotes?: string;
      licenseType?: string;
      licenseNotes?: string;
    },
    @Req() req: Request,
  ) {
    return this.cloning.enroll({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      name: body.name ?? '',
      consentAttested: asBool(body.consentAttested),
      consentNotes: body.consentNotes ?? '',
      files: files ?? [],
      ip: clientIp(req),
      cloneMode: body.cloneMode === 'professional' ? 'professional' : 'instant',
      ownershipAttested: asBool(body.ownershipAttested),
      ownershipNotes: body.ownershipNotes,
      licenseType: asLicense(body.licenseType),
      licenseNotes: body.licenseNotes,
    });
  }

  @Post('enroll/stream')
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(
    FilesInterceptor('samples', 5, {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  async enrollStream(
    @CurrentSession() session: SessionContext,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body()
    body: {
      name?: string;
      consentAttested?: string | boolean;
      consentNotes?: string;
      cloneMode?: string;
      ownershipAttested?: string | boolean;
      ownershipNotes?: string;
      licenseType?: string;
      licenseNotes?: string;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = this.cloning.enrollStream({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      name: body.name ?? '',
      consentAttested: asBool(body.consentAttested),
      consentNotes: body.consentNotes ?? '',
      files: files ?? [],
      ip: clientIp(req),
      cloneMode: body.cloneMode === 'professional' ? 'professional' : 'instant',
      ownershipAttested: asBool(body.ownershipAttested),
      ownershipNotes: body.ownershipNotes,
      licenseType: asLicense(body.licenseType),
      licenseNotes: body.licenseNotes,
    });

    for await (const chunk of stream) {
      res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.event === 'error' || chunk.event === 'done') break;
    }
    res.end();
  }

  @Patch('clones/:id/ownership')
  @UseGuards(ClerkAuthGuard)
  updateOwnership(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body()
    body: { ownershipAttested?: boolean; ownershipNotes?: string; ownerUserId?: string },
    @Req() req: Request,
  ) {
    if (typeof body.ownershipAttested !== 'boolean') {
      throw new ApiException(
        'validation_error',
        'ownershipAttested boolean is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.cloning.updateOwnership({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      id,
      ownershipAttested: body.ownershipAttested,
      ownershipNotes: body.ownershipNotes ?? '',
      ownerUserId: body.ownerUserId,
      ip: clientIp(req),
    });
  }

  @Patch('clones/:id/license')
  @UseGuards(ClerkAuthGuard)
  updateLicense(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body() body: { licenseType?: string; licenseNotes?: string },
    @Req() req: Request,
  ) {
    if (!body.licenseType) {
      throw new ApiException('validation_error', 'licenseType is required', HttpStatus.BAD_REQUEST);
    }
    return this.cloning.updateLicense({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      id,
      licenseType: body.licenseType,
      licenseNotes: body.licenseNotes,
      ip: clientIp(req),
    });
  }

  @Patch('clones/:id/permissions')
  @UseGuards(ClerkAuthGuard)
  updatePermissions(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body()
    body: {
      canSynthesize?: boolean;
      canShare?: boolean;
      canExport?: boolean;
      allowedRoles?: string[];
    },
    @Req() req: Request,
  ) {
    return this.cloning.updatePermissions({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      id,
      permissions: body,
      ip: clientIp(req),
    });
  }

  @Post('clones/:id/verify-enrollment')
  @UseGuards(ClerkAuthGuard)
  verifyEnrollment(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: Request,
  ) {
    return this.cloning.verifyEnrollment({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      id,
      notes: body.notes,
      ip: clientIp(req),
    });
  }
}

function asBool(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

function asLicense(value?: string): 'internal' | 'commercial' | 'restricted' | undefined {
  if (value === 'internal' || value === 'commercial' || value === 'restricted') return value;
  return undefined;
}
