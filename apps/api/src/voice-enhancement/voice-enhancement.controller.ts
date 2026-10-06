import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import type { Request, Response } from 'express';
import { VoiceEnhancementService } from './voice-enhancement.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { audioMaxBytes } from '../audio/audio-limits';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/voice-enhancement')
export class VoiceEnhancementController {
  constructor(private readonly enhancement: VoiceEnhancementService) {}

  private auth(req: AuthedReq) {
    return {
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    };
  }

  @Get('engine')
  engine() {
    return this.enhancement.engine();
  }

  @Get('profiles')
  profiles() {
    return this.enhancement.profiles();
  }

  @Get('echo')
  echo() {
    return this.enhancement.echoStatus();
  }

  @Get('engine/analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.enhancement.analytics(req.translateAuth.organizationId);
  }

  @Post('enhance')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  enhance(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { profile?: string; targetRate?: string },
    @Query('profile') profileQuery?: string,
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.enhancement.enhance(this.auth(req), {
      file,
      profile: body.profile || profileQuery,
      targetRate: body.targetRate ? Number(body.targetRate) : undefined,
    });
  }

  @Post('upscale')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  upscale(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { targetRate?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.enhancement.upscale(this.auth(req), {
      file,
      targetRate: body.targetRate ? Number(body.targetRate) : undefined,
    });
  }

  @Post('enhance/stream')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  async enhanceStream(
    @Req() req: AuthedReq,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { profile?: string; targetRate?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = this.enhancement.streamEnhance(this.auth(req), {
      file,
      profile: body.profile,
      targetRate: body.targetRate ? Number(body.targetRate) : undefined,
    });

    for await (const chunk of stream) {
      res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.event === 'error' || chunk.event === 'done') break;
    }
    res.end();
  }
}
