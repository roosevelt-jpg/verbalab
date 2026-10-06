import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { VoiceBiometricsService } from './voice-biometrics.service';
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

@Controller('v1/voice-biometrics')
export class VoiceBiometricsController {
  constructor(private readonly biometrics: VoiceBiometricsService) {}

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
    return this.biometrics.engine();
  }

  @Get('encryption')
  encryption() {
    return this.biometrics.encryptionStatus();
  }

  @Get('engine/analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.biometrics.analytics(req.translateAuth.organizationId);
  }

  @Get('liveness/challenge')
  livenessChallenge() {
    return this.biometrics.livenessChallenge();
  }

  @Get('risk')
  @UseGuards(TranslateAuthGuard)
  risk(@Req() req: AuthedReq, @Query('profileId') profileId?: string) {
    return this.biometrics.risk(this.auth(req), profileId);
  }

  @Post('enroll')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  enroll(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { profileId?: string; enableAuthFactor?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.profileId !== 'string' || !body.profileId.trim()) {
      throw new ApiException('validation_error', 'profileId is required', HttpStatus.BAD_REQUEST);
    }
    return this.biometrics.enroll(this.auth(req), {
      profileId: body.profileId.trim(),
      file,
      enableAuthFactor: body.enableAuthFactor === 'true' || body.enableAuthFactor === '1',
    });
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  verify(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { profileId?: string; threshold?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.profileId !== 'string' || !body.profileId.trim()) {
      throw new ApiException('validation_error', 'profileId is required', HttpStatus.BAD_REQUEST);
    }
    return this.biometrics.verify(this.auth(req), {
      profileId: body.profileId.trim(),
      file,
      threshold: body.threshold ? Number(body.threshold) : undefined,
    });
  }

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  identify(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { threshold?: string; topK?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.biometrics.identify(this.auth(req), {
      file,
      threshold: body.threshold ? Number(body.threshold) : undefined,
      topK: body.topK ? Number(body.topK) : undefined,
    });
  }

  @Post('anti-spoof')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  antiSpoof(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.biometrics.antiSpoof(file);
  }

  @Post('liveness')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  liveness(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { minDurationSeconds?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.biometrics.livenessCheck(
      this.auth(req),
      file,
      body.minDurationSeconds ? Number(body.minDurationSeconds) : undefined,
    );
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  authenticate(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { profileId?: string; threshold?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.biometrics.authenticate(this.auth(req), {
      profileId: body.profileId ?? '',
      file,
      threshold: body.threshold ? Number(body.threshold) : undefined,
    });
  }

  @Delete('profiles/:id')
  @UseGuards(TranslateAuthGuard)
  deleteProfile(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.biometrics.deleteProfile(this.auth(req), id);
  }
}
