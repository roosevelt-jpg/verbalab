import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthContext, TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { EverydayService } from './everyday.service';
import type { EverydayBlock } from './everyday.types';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.EVERYDAY_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'Everyday requires a signed-in session, or an API key with an Everyday actor header for local testing.',
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

@Controller('v1/everyday')
@UseGuards(TranslateAuthGuard)
export class EverydayController {
  constructor(private readonly everyday: EverydayService) {}

  @Get('catalog')
  catalog() {
    return this.everyday.catalog();
  }

  @Get('sessions')
  list(
    @Req() req: AuthedRequest,
    @Headers('x-everyday-actor-id') actorHeader?: string,
  ) {
    return this.everyday.listSessions(resolveActor(req, actorHeader));
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(
    @Req() req: AuthedRequest,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body()
    body: {
      mode?: string;
      corridor?: string;
      preferredVariety?: string;
      documentCategory?: string;
      trainingConsent?: boolean;
      sensitivePolicyOk?: boolean;
      retentionDays?: number;
    } = {},
  ) {
    return this.everyday.createSession(resolveActor(req, actorHeader), body);
  }

  @Get('sessions/:id')
  getSession(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
  ) {
    return this.everyday.getSession(resolveActor(req, actorHeader), id);
  }

  @Get('sessions/:id/events')
  events(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Query('after') after: string | undefined,
    @Headers('x-everyday-actor-id') actorHeader?: string,
  ) {
    return this.everyday.listEvents(
      resolveActor(req, actorHeader),
      id,
      Number(after ?? 0) || 0,
    );
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  deleteSession(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
  ) {
    return this.everyday.deleteSession(resolveActor(req, actorHeader), id);
  }

  @Post('sessions/:id/uploads')
  @HttpCode(HttpStatus.CREATED)
  upload(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body()
    body: {
      filename?: string;
      mimeType?: string;
      contentBase64?: string;
      pageCountHint?: number;
    } = {},
  ) {
    return this.everyday.uploadDocument(resolveActor(req, actorHeader), id, {
      filename: body.filename ?? '',
      mimeType: body.mimeType ?? 'application/octet-stream',
      contentBase64: body.contentBase64 ?? '',
      pageCountHint: body.pageCountHint,
    });
  }

  @Post('documents/:id/source-revisions')
  @HttpCode(HttpStatus.CREATED)
  correctSource(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body()
    body: {
      fullText?: string;
      blocks?: EverydayBlock[];
      expectedSourceRevisionId?: string;
    } = {},
  ) {
    if (!body.fullText) {
      throw new ApiException('validation_error', 'fullText is required', HttpStatus.BAD_REQUEST);
    }
    return this.everyday.correctSource(resolveActor(req, actorHeader), id, {
      fullText: body.fullText,
      blocks: body.blocks,
      expectedSourceRevisionId: body.expectedSourceRevisionId,
    });
  }

  @Post('sources/:id/translations')
  @HttpCode(HttpStatus.CREATED)
  translate(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body() body: { targetVariety?: string } = {},
  ) {
    return this.everyday.translateSource(resolveActor(req, actorHeader), id, body);
  }

  @Post('sources/:id/explanations')
  @HttpCode(HttpStatus.CREATED)
  explain(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body() body: { translationRevisionId?: string } = {},
  ) {
    return this.everyday.explainSource(resolveActor(req, actorHeader), id, body);
  }

  @Post('sources/:id/questions')
  @HttpCode(HttpStatus.CREATED)
  question(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body() body: { question?: string } = {},
  ) {
    if (!body.question) {
      throw new ApiException('validation_error', 'question is required', HttpStatus.BAD_REQUEST);
    }
    return this.everyday.askQuestion(resolveActor(req, actorHeader), id, body.question);
  }

  @Post('audio')
  @HttpCode(HttpStatus.CREATED)
  audio(
    @Req() req: AuthedRequest,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body()
    body: {
      kind?: 'translation' | 'explanation' | 'reply' | 'source';
      translationRevisionId?: string;
      explanationRevisionId?: string;
      replyRevisionId?: string;
      sourceRevisionId?: string;
    } = {},
  ) {
    if (!body.kind) {
      throw new ApiException('validation_error', 'kind is required', HttpStatus.BAD_REQUEST);
    }
    return this.everyday.createAudio(resolveActor(req, actorHeader), {
      kind: body.kind,
      translationRevisionId: body.translationRevisionId,
      explanationRevisionId: body.explanationRevisionId,
      replyRevisionId: body.replyRevisionId,
      sourceRevisionId: body.sourceRevisionId,
    });
  }

  @Get('artifacts/:id/audio')
  async getAudio(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Res() res?: Response,
  ) {
    const { buffer, mimeType } = await this.everyday.getAudioBytes(
      resolveActor(req, actorHeader),
      id,
    );
    res!.setHeader('Content-Type', mimeType);
    res!.setHeader('Cache-Control', 'private, no-store');
    res!.send(buffer);
  }

  @Post('sessions/:id/replies')
  @HttpCode(HttpStatus.CREATED)
  reply(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body()
    body: {
      userSourceText?: string;
      targetVariety?: string;
      sourceRevisionId?: string;
    } = {},
  ) {
    if (!body.userSourceText) {
      throw new ApiException(
        'validation_error',
        'userSourceText is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.everyday.createReply(resolveActor(req, actorHeader), id, {
      userSourceText: body.userSourceText,
      targetVariety: body.targetVariety,
      sourceRevisionId: body.sourceRevisionId,
    });
  }

  @Post('replies/:id/approvals')
  @HttpCode(HttpStatus.CREATED)
  approve(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body()
    body: {
      action?: 'approve_copy' | 'approve_download' | 'approve_share_sheet';
      sourcePresentationHash?: string;
      targetPresentationHash?: string;
    } = {},
  ) {
    if (!body.action || !body.sourcePresentationHash || !body.targetPresentationHash) {
      throw new ApiException(
        'validation_error',
        'action, sourcePresentationHash, and targetPresentationHash are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.everyday.approveReply(resolveActor(req, actorHeader), id, {
      action: body.action,
      sourcePresentationHash: body.sourcePresentationHash,
      targetPresentationHash: body.targetPresentationHash,
    });
  }

  @Post('sessions/:id/terms')
  @HttpCode(HttpStatus.CREATED)
  term(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-everyday-actor-id') actorHeader?: string,
    @Body()
    body: {
      selectedSpan?: string;
      sourceRevisionId?: string;
      scope?: 'document' | 'general';
      language?: string;
    } = {},
  ) {
    if (!body.selectedSpan) {
      throw new ApiException('validation_error', 'selectedSpan is required', HttpStatus.BAD_REQUEST);
    }
    return this.everyday.explainTerm(resolveActor(req, actorHeader), id, {
      selectedSpan: body.selectedSpan,
      sourceRevisionId: body.sourceRevisionId,
      scope: body.scope,
      language: body.language,
    });
  }
}
