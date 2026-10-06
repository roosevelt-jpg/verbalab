import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
import { audioMaxBytes } from '../audio/audio-limits';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SpeakerIntelligenceService } from './speaker-intelligence.service';

@Controller('v1/speakers')
export class SpeakerIntelligenceController {
  constructor(private readonly speakers: SpeakerIntelligenceService) {}

  @Get('engine')
  engine() {
    return this.speakers.engine();
  }

  @Get('profiles')
  @UseGuards(TranslateAuthGuard)
  listProfiles(
    @Req()
    req: Request & { translateAuth: TranslateAuthContext },
  ) {
    return this.speakers.listProfiles(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('profiles/:id')
  @UseGuards(TranslateAuthGuard)
  getProfile(
    @Req()
    req: Request & { translateAuth: TranslateAuthContext },
    @Param('id') id: string,
  ) {
    return this.speakers.getProfile(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      id,
    );
  }

  @Post('profiles')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  createProfile(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { displayName?: string; externalRef?: string },
  ) {
    if (typeof body.displayName !== 'string') {
      throw new ApiException('validation_error', 'displayName is required', HttpStatus.BAD_REQUEST);
    }
    return this.speakers.createProfile({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      displayName: body.displayName,
      externalRef: body.externalRef,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('profiles/:id/enroll')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  enroll(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.speakers.enroll({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      profileId: id,
      file,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  verify(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { profileId?: string; threshold?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.profileId !== 'string' || !body.profileId.trim()) {
      throw new ApiException('validation_error', 'profileId is required', HttpStatus.BAD_REQUEST);
    }
    return this.speakers.verify({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      profileId: body.profileId.trim(),
      file,
      threshold: body.threshold ? Number(body.threshold) : undefined,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  identify(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { threshold?: string; topK?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.speakers.identify({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      file,
      threshold: body.threshold ? Number(body.threshold) : undefined,
      topK: body.topK ? Number(body.topK) : undefined,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('diarize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  diarize(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { language?: string; gapSeconds?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.speakers.diarize({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      file,
      language: body.language,
      gapSeconds: body.gapSeconds ? Number(body.gapSeconds) : undefined,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
      ip: clientIp(req),
    });
  }

  @Post('diarize/stream')
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  async diarizeStream(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { language?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = this.speakers.streamDiarize({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      file,
      language: body.language,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
      ip: clientIp(req),
    });

    for await (const chunk of stream) {
      res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.event === 'error' || chunk.event === 'done') break;
    }
    res.end();
  }

  @Get('history')
  @UseGuards(TranslateAuthGuard)
  history(
    @Req()
    req: Request & { translateAuth: TranslateAuthContext },
    @Query('limit') limit?: string,
  ) {
    return this.speakers.history(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      limit ? Number(limit) : 50,
    );
  }
}
