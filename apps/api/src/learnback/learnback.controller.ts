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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthContext, TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { LearnBackService } from './learnback.service';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.LEARNBACK_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'LearnBack requires a Clerk session user, or X-LearnBack-Actor-Id when using API keys / LEARNBACK_ALLOW_TEST_ACTORS=1',
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

@Controller('v1/learnback')
@UseGuards(TranslateAuthGuard)
export class LearnBackController {
  constructor(private readonly learnback: LearnBackService) {}

  @Get('catalog')
  catalog() {
    return this.learnback.catalog();
  }

  @Get('scenarios')
  scenarios(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Query('situation') situation?: string,
    @Query('corridorId') corridorId?: string,
  ) {
    return this.learnback.listScenarios(resolveActor(req, actorHeader), {
      situation,
      corridorId,
    });
  }

  @Get('profile')
  profile(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.getProfile(resolveActor(req, actorHeader));
  }

  @Patch('profile')
  updateProfile(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body()
    body: {
      explanationLanguage?: string;
      practiceLanguage?: string;
      optionalAccentTarget?: string | null;
      goal?: string | null;
      trainingConsent?: boolean;
      retentionDays?: number;
      accessibilityPrefs?: Record<string, unknown>;
    } = {},
  ) {
    return this.learnback.updateProfile(resolveActor(req, actorHeader), body);
  }

  @Get('sessions')
  listSessions(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.listSessions(resolveActor(req, actorHeader));
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body()
    body: {
      corridorId?: string;
      situation?: string;
      scenarioPackId?: string;
      fictionalMode?: boolean;
      trainingConsent?: boolean;
      idempotencyKey?: string;
    } = {},
  ) {
    return this.learnback.createSession(resolveActor(req, actorHeader), body);
  }

  @Get('sessions/:id')
  getSession(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.getSession(resolveActor(req, actorHeader), id);
  }

  @Delete('sessions/:id')
  deleteSession(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.deleteSession(resolveActor(req, actorHeader), id);
  }

  @Post('sessions/:id/attempts')
  @HttpCode(HttpStatus.CREATED)
  createAttempt(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body()
    body: {
      contentBase64?: string;
      mimeType?: string;
      textAnswer?: string;
      idempotencyKey?: string;
    } = {},
  ) {
    if (!body.idempotencyKey) {
      throw new ApiException(
        'validation_error',
        'idempotencyKey is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.learnback.createAttempt(resolveActor(req, actorHeader), id, {
      contentBase64: body.contentBase64,
      mimeType: body.mimeType,
      textAnswer: body.textAnswer,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post('attempts/:id/transcript-revisions')
  @HttpCode(HttpStatus.CREATED)
  correctTranscript(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body()
    body: { editedText?: string; expectedTranscriptRevisionId?: string } = {},
  ) {
    if (!body.editedText) {
      throw new ApiException('validation_error', 'editedText is required', HttpStatus.BAD_REQUEST);
    }
    return this.learnback.correctTranscript(resolveActor(req, actorHeader), id, {
      editedText: body.editedText,
      expectedTranscriptRevisionId: body.expectedTranscriptRevisionId,
    });
  }

  @Get('attempts/:id/feedback')
  feedback(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.getAttemptFeedback(resolveActor(req, actorHeader), id);
  }

  @Post('audio')
  @HttpCode(HttpStatus.CREATED)
  audio(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body()
    body: {
      kind?: 'question' | 'explanation' | 'example' | 'phrase';
      text?: string;
      language?: string;
    } = {},
  ) {
    if (!body.kind || !body.text || !body.language) {
      throw new ApiException(
        'validation_error',
        'kind, text, and language are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.learnback.synthesizeAudio(resolveActor(req, actorHeader), {
      kind: body.kind,
      text: body.text,
      language: body.language,
    });
  }

  @Get('artifacts/:id/audio')
  async getAudio(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Res() res?: Response,
  ) {
    const { buffer, mimeType } = await this.learnback.getAudioBytes(
      resolveActor(req, actorHeader),
      id,
    );
    res!.setHeader('Content-Type', mimeType);
    res!.setHeader('Cache-Control', 'private, no-store');
    res!.send(buffer);
  }

  @Get('phrasebook')
  phrasebook(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.listPhrasebook(resolveActor(req, actorHeader));
  }

  @Post('phrasebook')
  @HttpCode(HttpStatus.CREATED)
  savePhrase(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body()
    body: {
      phrase?: string;
      intendedMeaning?: string;
      context?: string;
      practiceLanguage?: string;
      explanationLanguage?: string;
      sourceAttemptId?: string;
    } = {},
  ) {
    if (!body.phrase || !body.intendedMeaning) {
      throw new ApiException(
        'validation_error',
        'phrase and intendedMeaning are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.learnback.savePhrase(resolveActor(req, actorHeader), {
      phrase: body.phrase,
      intendedMeaning: body.intendedMeaning,
      context: body.context,
      practiceLanguage: body.practiceLanguage,
      explanationLanguage: body.explanationLanguage,
      sourceAttemptId: body.sourceAttemptId,
    });
  }

  @Patch('phrasebook/:id')
  updatePhrase(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body() body: { phrase?: string; intendedMeaning?: string; context?: string | null } = {},
  ) {
    return this.learnback.updatePhrase(resolveActor(req, actorHeader), id, body);
  }

  @Delete('phrasebook/:id')
  deletePhrase(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.deletePhrase(resolveActor(req, actorHeader), id);
  }

  @Get('progress')
  progress(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
  ) {
    return this.learnback.getProgress(resolveActor(req, actorHeader));
  }

  @Patch('reminder-preferences')
  reminders(
    @Req() req: AuthedRequest,
    @Headers('x-learnback-actor-id') actorHeader?: string,
    @Body()
    body: {
      reminderOptIn?: boolean;
      reminderTimezone?: string | null;
      reminderChannel?: string | null;
      quietHoursStart?: number | null;
      quietHoursEnd?: number | null;
    } = {},
  ) {
    return this.learnback.updateReminderPreferences(resolveActor(req, actorHeader), body);
  }
}
