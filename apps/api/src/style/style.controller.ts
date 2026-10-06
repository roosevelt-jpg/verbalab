import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { StyleService } from './style.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1/style')
export class StyleController {
  constructor(private readonly style: StyleService) {}

  @Get('intelligence')
  intelligence {
    return this.style.intelligence;
  }

  @Get('profiles')
  profiles {
    return this.style.profiles;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  analytics(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
  ) {
    return this.style.analytics(req.translateAuth.organizationId);
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  detect(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body body: { text?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.trim.length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return this.style.detect({
      text: body.text,
      organizationId: req.translateAuth.organizationId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('transform')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  transform(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body body: { text?: string; targetTone?: string; language?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.trim.length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.targetTone !== 'string' || body.targetTone.trim.length === 0) {
      throw new ApiException('validation_error', 'targetTone is required', HttpStatus.BAD_REQUEST);
    }
    return this.style.transform({
      text: body.text,
      targetTone: body.targetTone.trim,
      language: body.language,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  transfer(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body body: { text?: string; targetProfile?: string; language?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.trim.length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.targetProfile !== 'string' || body.targetProfile.trim.length === 0) {
      throw new ApiException('validation_error', 'targetProfile is required', HttpStatus.BAD_REQUEST);
    }
    return this.style.transfer({
      text: body.text,
      targetProfile: body.targetProfile.trim,
      language: body.language,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('rewrite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  rewrite(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body body: { text?: string; profile?: string; language?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.trim.length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.profile !== 'string' || body.profile.trim.length === 0) {
      throw new ApiException('validation_error', 'profile is required', HttpStatus.BAD_REQUEST);
    }
    return this.style.rewrite({
      text: body.text,
      profile: body.profile.trim,
      language: body.language,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
