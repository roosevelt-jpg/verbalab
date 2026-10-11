import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
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
import { LanguageAssuranceService } from './assurance.service';
import type { AssuranceProduct, CheckStage, ContentCategory } from './assurance.types';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.LANGUAGE_ASSURANCE_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'Language Assurance requires a Clerk session user, or X-LanguageAssurance-Actor-Id when using API keys / LANGUAGE_ASSURANCE_ALLOW_TEST_ACTORS=1',
      HttpStatus.UNAUTHORIZED,
    );
  }
  return {
    organizationId: req.translateAuth.organizationId,
    workspaceId: req.translateAuth.workspaceId,
    userId,
    apiKeyId: req.translateAuth.apiKeyId,
    ip: clientIp(req),
    platformAdmin: Boolean(req.sessionAuth?.platformAdmin),
  };
}

@Controller('v1/language-assurance')
@UseGuards(TranslateAuthGuard)
export class LanguageAssuranceController {
  constructor(private readonly assurance: LanguageAssuranceService) {}

  @Get('catalog')
  catalog() {
    return this.assurance.catalog();
  }

  @Get('runs')
  list(
    @Req() req: AuthedRequest,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
  ) {
    return this.assurance.listRuns(resolveActor(req, actorHeader));
  }

  @Get('reviews/queue')
  reviewQueue(
    @Req() req: AuthedRequest,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
  ) {
    return this.assurance.listReviewQueue(resolveActor(req, actorHeader));
  }

  @Post('runs')
  @HttpCode(HttpStatus.CREATED)
  createRun(
    @Req() req: AuthedRequest,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
    @Body()
    body: {
      product?: AssuranceProduct;
      contentCategory?: ContentCategory;
      corridor?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      sourceText?: string;
      targetText?: string;
      audioBase64?: string;
      audioMimeType?: string;
      modelVersion?: string;
      voiceVersion?: string;
      task?: string;
      policyVersion?: string;
      idempotencyKey?: string;
      assignReviewerUserId?: string;
      terminology?: Record<string, string>;
    } = {},
  ) {
    if (!body.sourceText || !body.targetText || !body.idempotencyKey) {
      throw new ApiException(
        'validation_error',
        'sourceText, targetText, and idempotencyKey are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.assurance.createRun(resolveActor(req, actorHeader), {
      product: body.product,
      contentCategory: body.contentCategory,
      corridor: body.corridor,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      sourceText: body.sourceText,
      targetText: body.targetText,
      audioBase64: body.audioBase64,
      audioMimeType: body.audioMimeType,
      modelVersion: body.modelVersion,
      voiceVersion: body.voiceVersion,
      task: body.task,
      policyVersion: body.policyVersion,
      idempotencyKey: body.idempotencyKey,
      assignReviewerUserId: body.assignReviewerUserId,
      terminology: body.terminology,
    });
  }

  @Get('runs/:id')
  getRun(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
  ) {
    return this.assurance.runView(id, resolveActor(req, actorHeader));
  }

  @Post('runs/:id/cancel')
  cancel(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
  ) {
    return this.assurance.cancelRun(id, resolveActor(req, actorHeader));
  }

  @Get('runs/:id/report')
  report(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Query('format') format: 'json' | 'markdown' | undefined,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
  ) {
    return this.assurance.getReport(id, resolveActor(req, actorHeader), format ?? 'json');
  }

  @Post('runs/:id/assignments')
  @HttpCode(HttpStatus.CREATED)
  assign(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
    @Body() body: { reviewerUserId?: string; scope?: 'translation' | 'speech' | 'both' } = {},
  ) {
    if (!body.reviewerUserId) {
      throw new ApiException(
        'validation_error',
        'reviewerUserId is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.assurance.assignReview(id, resolveActor(req, actorHeader), {
      reviewerUserId: body.reviewerUserId,
      scope: body.scope,
    });
  }

  @Post('reviews/:assignmentId/submit')
  submitReview(
    @Req() req: AuthedRequest,
    @Param('assignmentId') assignmentId: string,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
    @Body()
    body: {
      judgment?: 'approve' | 'request_changes' | 'reject' | 'uncertain';
      sourceTextHash?: string;
      targetTextHash?: string;
      audioSha256?: string;
      meaningOk?: boolean;
      pronunciationOk?: boolean;
      toneOk?: boolean;
      naturalnessOk?: boolean;
      audioIntegrityOk?: boolean;
      notes?: string;
      correctionSuggestion?: string;
    } = {},
  ) {
    if (!body.judgment || !body.sourceTextHash || !body.targetTextHash) {
      throw new ApiException(
        'validation_error',
        'judgment, sourceTextHash, and targetTextHash are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.assurance.submitReview(assignmentId, resolveActor(req, actorHeader), {
      judgment: body.judgment,
      sourceTextHash: body.sourceTextHash,
      targetTextHash: body.targetTextHash,
      audioSha256: body.audioSha256,
      meaningOk: body.meaningOk,
      pronunciationOk: body.pronunciationOk,
      toneOk: body.toneOk,
      naturalnessOk: body.naturalnessOk,
      audioIntegrityOk: body.audioIntegrityOk,
      notes: body.notes,
      correctionSuggestion: body.correctionSuggestion,
    });
  }

  @Post('runs/:id/release-evidence')
  @HttpCode(HttpStatus.CREATED)
  release(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
    @Body() body: { reason?: string } = {},
  ) {
    return this.assurance.releaseEvidence(id, resolveActor(req, actorHeader), body);
  }

  @Post('policies')
  @HttpCode(HttpStatus.CREATED)
  createPolicy(
    @Req() req: AuthedRequest,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
    @Body()
    body: {
      version?: string;
      task?: string;
      corridor?: string;
      contentCategory?: ContentCategory;
      requiredStages?: CheckStage[];
      requireNativeReview?: boolean;
      maxRetries?: number;
      budgetNote?: string;
    } = {},
  ) {
    if (!body.version || !body.task || !body.corridor || !body.contentCategory || !body.requiredStages) {
      throw new ApiException(
        'validation_error',
        'version, task, corridor, contentCategory, and requiredStages are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.assurance.createPolicy(resolveActor(req, actorHeader), {
      version: body.version,
      task: body.task,
      corridor: body.corridor,
      contentCategory: body.contentCategory,
      requiredStages: body.requiredStages,
      requireNativeReview: body.requireNativeReview,
      maxRetries: body.maxRetries,
      budgetNote: body.budgetNote,
    });
  }

  @Post('integrations/voice-studio')
  @HttpCode(HttpStatus.CREATED)
  voiceStudio(
    @Req() req: AuthedRequest,
    @Headers('x-languageassurance-actor-id') actorHeader?: string,
    @Body()
    body: {
      sourceText?: string;
      targetText?: string;
      audioBase64?: string;
      audioMimeType?: string;
      audioSha256?: string;
      voiceVersion?: string;
      modelVersion?: string;
      corridor?: string;
      idempotencyKey?: string;
      assignReviewerUserId?: string;
    } = {},
  ) {
    if (!body.sourceText || !body.targetText || !body.idempotencyKey) {
      throw new ApiException(
        'validation_error',
        'sourceText, targetText, and idempotencyKey are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.assurance.verifyVoiceStudioTake(resolveActor(req, actorHeader), {
      sourceText: body.sourceText,
      targetText: body.targetText,
      audioBase64: body.audioBase64,
      audioMimeType: body.audioMimeType,
      audioSha256: body.audioSha256,
      voiceVersion: body.voiceVersion,
      modelVersion: body.modelVersion,
      corridor: body.corridor,
      idempotencyKey: body.idempotencyKey,
      assignReviewerUserId: body.assignReviewerUserId,
    });
  }
}
