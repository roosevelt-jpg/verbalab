import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { clientIp } from '../common/http/client-ip';
import { VoiceDataService } from './voice-data.service';

/** Public recorder endpoints; the unguessable link token is the credential. */
@Controller('v1/voice-data/session/:token')
export class VoiceDataSessionController {
  constructor(private readonly voiceData: VoiceDataService) {}

  @Get()
  session(@Param('token') token: string) {
    return this.voiceData.session(token);
  }

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  consent(
    @Param('token') token: string,
    @Req() req: Request,
    @Body() body: { fullName?: unknown; adult?: unknown; nativeSpeaker?: unknown; agree?: unknown },
  ) {
    return this.voiceData.consent(token, body, {
      ip: (req.headers['fly-client-ip'] as string | undefined) ?? clientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('recordings')
  @UseInterceptors(
    FileInterceptor('audio', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  addRecording(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { promptId?: unknown; durationMs?: unknown },
  ) {
    return this.voiceData.addRecording(token, file, body);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  feedback(@Param('token') token: string, @Body() body: { promptId?: unknown; suggestion?: unknown }) {
    return this.voiceData.feedback(token, body);
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  withdraw(@Param('token') token: string) {
    return this.voiceData.withdraw(token);
  }
}
