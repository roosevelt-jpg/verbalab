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
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { LanguageKitsService, type KitStage } from './language-kits.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/language-kits')
export class LanguageKitsController {
  constructor(private readonly kits: LanguageKitsService) {}

  @Get('engine')
  engine() {
    return this.kits.engine();
  }

  @Get('languages')
  languages(@Query('q') q?: string) {
    return this.kits.languages(q);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  create(
    @Req() req: AuthedReq,
    @Body()
    body: {
      languageTag?: string;
      varietyId?: string;
      displayName?: string;
      script?: string;
      orthographyNotes?: string;
    },
  ) {
    if (!body.languageTag?.trim() || !body.varietyId?.trim() || !body.displayName?.trim()) {
      throw new ApiException(
        'validation_error',
        'languageTag, varietyId, and displayName are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.kits.create({
      languageTag: body.languageTag,
      varietyId: body.varietyId,
      displayName: body.displayName,
      script: body.script,
      orthographyNotes: body.orthographyNotes,
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Get()
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  list(@Req() req: AuthedReq) {
    return this.kits.list(req.translateAuth.organizationId);
  }

  @Get(':id/coverage')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  coverage(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.kits.coverage(id, req.translateAuth.organizationId);
  }

  @Get(':id')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  get(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.kits.get(id, req.translateAuth.organizationId);
  }

  @Post(':id/advance')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  advance(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body()
    body: {
      toStage?: KitStage;
      datasetManifestRef?: string;
      licensePolicyRef?: string;
      translationDirection?: string;
    },
  ) {
    return this.kits.advance({
      id,
      organizationId: req.translateAuth.organizationId,
      toStage: body.toStage,
      datasetManifestRef: body.datasetManifestRef,
      licensePolicyRef: body.licensePolicyRef,
      translationDirection: body.translationDirection,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
