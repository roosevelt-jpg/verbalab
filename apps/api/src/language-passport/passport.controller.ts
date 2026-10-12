import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthContext, TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { LanguagePassportService } from './passport.service';
import type { ApprovedMeaning, ContextScope, PassportEntryType, ResolveRequest } from './passport.types';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.LANGUAGE_PASSPORT_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'Language Passport requires a Clerk session user, or X-Language-Passport-Actor-Id when using API keys',
      HttpStatus.UNAUTHORIZED,
    );
  }
  return {
    organizationId: req.translateAuth.organizationId,
    workspaceId: req.translateAuth.workspaceId,
    userId,
    apiKeyId: req.translateAuth.apiKeyId,
    ip: clientIp(req),
  };
}

@Controller('v1/passport')
export class LanguagePassportController {
  constructor(private readonly passport: LanguagePassportService) {}

  @Get('catalog')
  catalog() {
    return this.passport.catalog();
  }

  @Get('model-sync')
  modelSync() {
    return this.passport.modelSync();
  }

  @Get('me')
  @UseGuards(TranslateAuthGuard)
  me(@Req() req: AuthedRequest, @Headers('x-language-passport-actor-id') actorHeader?: string) {
    return this.passport.getOrCreate(resolveActor(req, actorHeader));
  }

  @Patch('preferences')
  @UseGuards(TranslateAuthGuard)
  preferences(
    @Req() req: AuthedRequest,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body()
    body?: {
      personalizationEnabled?: boolean;
      preferredVarieties?: string[];
      preferredVoiceIds?: string[];
      retentionDays?: number;
      trainingConsent?: boolean;
      expectedPreferencesRevision?: number;
    },
  ) {
    return this.passport.patchPreferences(resolveActor(req, actorHeader), body ?? {});
  }

  @Post('entries')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createEntry(
    @Req() req: AuthedRequest,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body()
    body?: {
      type?: PassportEntryType;
      sourceForm?: string;
      languageVariety?: string;
      sourceLang?: string;
      targetLang?: string;
      direction?: string;
      approvedValue?: ApprovedMeaning;
      context?: ContextScope;
      examples?: unknown[];
      provenance?: Record<string, unknown>;
      trainingPermission?: boolean;
      autoApprove?: boolean;
      idempotencyKey?: string;
    },
  ) {
    if (!body?.type || !body.sourceForm || !body.languageVariety || !body.approvedValue) {
      throw new ApiException(
        'validation_error',
        'type, sourceForm, languageVariety, and approvedValue are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.passport.createEntry(resolveActor(req, actorHeader), {
      type: body.type,
      sourceForm: body.sourceForm,
      languageVariety: body.languageVariety,
      sourceLang: body.sourceLang,
      targetLang: body.targetLang,
      direction: body.direction,
      approvedValue: body.approvedValue,
      context: body.context,
      examples: body.examples,
      provenance: body.provenance,
      trainingPermission: body.trainingPermission,
      autoApprove: body.autoApprove,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post('entries/:id/revisions')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  revise(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body()
    body?: {
      sourceForm?: string;
      languageVariety?: string;
      sourceLang?: string;
      targetLang?: string;
      direction?: string;
      approvedValue?: ApprovedMeaning;
      context?: ContextScope;
      examples?: unknown[];
      provenance?: Record<string, unknown>;
      trainingPermission?: boolean;
      expectedRevision?: number;
      autoApprove?: boolean;
    },
  ) {
    if (!body?.approvedValue) {
      throw new ApiException('validation_error', 'approvedValue is required', HttpStatus.BAD_REQUEST);
    }
    return this.passport.createRevision(resolveActor(req, actorHeader), id, {
      ...body,
      approvedValue: body.approvedValue,
    });
  }

  @Post('entries/:id/approvals')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  approve(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body() body?: { expectedRevision?: number },
  ) {
    return this.passport.approveEntry(resolveActor(req, actorHeader), id, body?.expectedRevision);
  }

  @Get('entries/:id')
  @UseGuards(TranslateAuthGuard)
  getEntry(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
  ) {
    return this.passport.getEntry(resolveActor(req, actorHeader), id);
  }

  @Delete('entries/:id')
  @UseGuards(TranslateAuthGuard)
  removeEntry(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
  ) {
    return this.passport.deleteEntry(resolveActor(req, actorHeader), id);
  }

  @Post('resolutions')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  resolve(
    @Req() req: AuthedRequest,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body() body?: ResolveRequest,
  ) {
    if (!body?.product || typeof body.text !== 'string') {
      throw new ApiException('validation_error', 'product and text are required', HttpStatus.BAD_REQUEST);
    }
    return this.passport.resolve(resolveActor(req, actorHeader), body);
  }

  @Post('grants')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createGrant(
    @Req() req: AuthedRequest,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body()
    body?: {
      entryIds?: string[];
      purpose?: string;
      permittedProducts?: string[];
      granteeUserId?: string;
      granteeResource?: string;
      ttlHours?: number;
    },
  ) {
    return this.passport.createGrant(resolveActor(req, actorHeader), {
      entryIds: body?.entryIds ?? [],
      purpose: body?.purpose ?? '',
      permittedProducts: body?.permittedProducts ?? [],
      granteeUserId: body?.granteeUserId,
      granteeResource: body?.granteeResource,
      ttlHours: body?.ttlHours,
    });
  }

  @Delete('grants/:id')
  @UseGuards(TranslateAuthGuard)
  revokeGrant(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
  ) {
    return this.passport.revokeGrant(resolveActor(req, actorHeader), id);
  }

  @Post('exports')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  exportPassport(
    @Req() req: AuthedRequest,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body() body?: { entryIds?: string[] },
  ) {
    return this.passport.exportPassport(resolveActor(req, actorHeader), body?.entryIds);
  }

  @Post('import-previews')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  importPreview(
    @Req() req: AuthedRequest,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Body() body?: unknown,
  ) {
    return this.passport.createImportPreview(resolveActor(req, actorHeader), body);
  }

  @Post('imports/:id/confirm')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  confirmImport(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
  ) {
    return this.passport.confirmImport(resolveActor(req, actorHeader), id);
  }

  @Get('history')
  @UseGuards(TranslateAuthGuard)
  history(
    @Req() req: AuthedRequest,
    @Headers('x-language-passport-actor-id') actorHeader?: string,
    @Query('limit') limit?: string,
  ) {
    return this.passport.history(resolveActor(req, actorHeader), limit ? Number(limit) : 50);
  }

  @Delete('me')
  @UseGuards(TranslateAuthGuard)
  deleteMe(@Req() req: AuthedRequest, @Headers('x-language-passport-actor-id') actorHeader?: string) {
    return this.passport.deletePassport(resolveActor(req, actorHeader));
  }
}
