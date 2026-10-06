import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { LocalizeService } from './localize.service';
import { LocalizationPlatformService } from './localization-platform.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1')
export class LocalizeController {
  constructor(
    private readonly localize: LocalizeService,
    private readonly platform: LocalizationPlatformService,
  ) {}

  @Get('localization')
  localizationPlatform {
    return this.platform.platform;
  }

  @Post('localize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  localizeJson(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body
    body: {
      format?: string;
      source?: string;
      target?: string;
      content?: unknown;
    },
  ) {
    if (!body.source || !body.target) {
      throw new ApiException('validation_error', 'source and target are required', HttpStatus.BAD_REQUEST);
    }
    if (body.content === undefined) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    const format = body.format === 'yaml' ? 'yaml' : 'json';
    const parsed =
      typeof body.content === 'string'
        ? this.localize.parseContent(format, body.content)
        : body.content;

    return this.localize.localize({
      format,
      content: parsed,
      source: body.source,
      target: body.target,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('localize/file')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: Number(process.env.LOCALIZE_MAX_BYTES ?? 512 * 1024) },
    }),
  )
  localizeFile(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { format?: string; source?: string; target?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.source || !body.target) {
      throw new ApiException('validation_error', 'source and target are required', HttpStatus.BAD_REQUEST);
    }
    const format = this.localize.detectFormat(file.originalname, body.format);
    const parsed = this.localize.parseContent(format, file.buffer.toString('utf8'));

    return this.localize.localize({
      format,
      content: parsed,
      source: body.source,
      target: body.target,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('localize/catalog')
  @HttpCode(HttpStatus.OK)
  catalog(@Body body: { format?: string; content?: unknown }) {
    if (body.content === undefined) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    const format = body.format === 'yaml' ? 'yaml' : 'json';
    const parsed =
      typeof body.content === 'string'
        ? this.localize.parseContent(format, body.content)
        : body.content;
    return this.platform.catalog(parsed);
  }

  @Post('localize/qa')
  @HttpCode(HttpStatus.OK)
  qa(
    @Body
    body: {
      format?: string;
      sourceContent?: unknown;
      targetContent?: unknown;
      source?: string;
      target?: string;
    },
  ) {
    if (body.sourceContent === undefined || body.targetContent === undefined) {
      throw new ApiException(
        'validation_error',
        'sourceContent and targetContent are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const format = body.format === 'yaml' ? 'yaml' : 'json';
    const sourceContent =
      typeof body.sourceContent === 'string'
        ? this.localize.parseContent(format, body.sourceContent)
        : body.sourceContent;
    const targetContent =
      typeof body.targetContent === 'string'
        ? this.localize.parseContent(format, body.targetContent)
        : body.targetContent;
    return this.platform.qa({
      format,
      sourceContent,
      targetContent,
      sourceLang: body.source,
      targetLang: body.target,
    });
  }

  @Post('icu/validate')
  @HttpCode(HttpStatus.OK)
  validateIcu(@Body body: { message?: string }) {
    return this.platform.validateIcu(body.message ?? '');
  }

  @Post('icu/format')
  @HttpCode(HttpStatus.OK)
  formatIcu(
    @Body
    body: {
      message?: string;
      values?: Record<string, string | number>;
      locale?: string;
    },
  ) {
    return this.platform.formatIcu({
      message: body.message ?? '',
      values: body.values,
      locale: body.locale,
    });
  }
}
