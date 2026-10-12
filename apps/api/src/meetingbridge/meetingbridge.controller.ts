import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthContext, TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { MeetingBridgeService } from './meetingbridge.service';
import type { ConfirmAction, ConsentPurpose, ItemKind, ListeningMode } from './meetingbridge.types';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.MEETINGBRIDGE_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'MeetingBridge requires a signed-in session, or an API key with a MeetingBridge actor header for local testing.',
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

@Controller('v1/meetingbridge')
@UseGuards(TranslateAuthGuard)
export class MeetingBridgeController {
  constructor(private readonly meetingbridge: MeetingBridgeService) {}

  @Get('catalog')
  catalog() {
    return this.meetingbridge.catalog();
  }

  @Get('invites/:token')
  peekInvite(@Param('token') token: string) {
    return this.meetingbridge.peekInvite(token);
  }

  @Get('meetings')
  list(
    @Req() req: AuthedRequest,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.listMeetings(resolveActor(req, actorHeader));
  }

  @Post('meetings')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthedRequest,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      title?: string;
      agenda?: string;
      timeZone?: string;
      corridor?: string;
      speakingLanguage?: string;
      listeningLanguage?: string;
      maxParticipants?: number;
      isDemo?: boolean;
      terminology?: Record<string, string>;
    } = {},
  ) {
    if (!body.title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }
    return this.meetingbridge.createMeeting(resolveActor(req, actorHeader), {
      title: body.title,
      agenda: body.agenda,
      timeZone: body.timeZone,
      corridor: body.corridor,
      speakingLanguage: body.speakingLanguage,
      listeningLanguage: body.listeningLanguage,
      maxParticipants: body.maxParticipants,
      isDemo: body.isDemo,
      terminology: body.terminology,
    });
  }

  @Get('meetings/:id')
  get(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.meetingView(id, resolveActor(req, actorHeader));
  }

  @Post('meetings/:id/invites')
  @HttpCode(HttpStatus.CREATED)
  invite(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body() body: { expiresInHours?: number } = {},
  ) {
    return this.meetingbridge.createInvite(id, resolveActor(req, actorHeader), body.expiresInHours);
  }

  @Post('meetings/:id/join')
  join(
    @Req() req: AuthedRequest,
    @Param('id') _id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      token?: string;
      speakingLanguage?: string;
      listeningLanguage?: string;
      speakingVariety?: string;
      listeningVariety?: string;
      listeningMode?: ListeningMode;
      consents?: { purpose: ConsentPurpose; decision: 'granted' | 'denied' }[];
    } = {},
  ) {
    if (!body.token || !body.speakingLanguage || !body.listeningLanguage) {
      throw new ApiException(
        'validation_error',
        'token, speakingLanguage, and listeningLanguage are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.joinMeeting(body.token, resolveActor(req, actorHeader), {
      speakingLanguage: body.speakingLanguage,
      listeningLanguage: body.listeningLanguage,
      speakingVariety: body.speakingVariety,
      listeningVariety: body.listeningVariety,
      listeningMode: body.listeningMode,
      consents: body.consents,
    });
  }

  @Patch('meetings/:id/members/me')
  preferences(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      speakingLanguage?: string;
      listeningLanguage?: string;
      speakingVariety?: string;
      listeningVariety?: string;
      listeningMode?: ListeningMode;
    } = {},
  ) {
    return this.meetingbridge.updatePreferences(id, resolveActor(req, actorHeader), body);
  }

  @Post('meetings/:id/lobby')
  openLobby(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.openLobby(id, resolveActor(req, actorHeader));
  }

  @Post('meetings/:id/start')
  start(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.startLive(id, resolveActor(req, actorHeader));
  }

  @Post('meetings/:id/utterances')
  @HttpCode(HttpStatus.CREATED)
  utterance(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      text?: string;
      language?: string;
      variety?: string;
      turnId?: string;
      targetLanguages?: string[];
    } = {},
  ) {
    if (!body.text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return this.meetingbridge.commitUtterance(id, resolveActor(req, actorHeader), {
      text: body.text,
      language: body.language,
      variety: body.variety,
      turnId: body.turnId,
      targetLanguages: body.targetLanguages,
    });
  }

  @Post('meetings/:id/utterance-corrections')
  correct(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body() body: { utteranceId?: string; text?: string; reason?: string } = {},
  ) {
    if (!body.utteranceId || !body.text) {
      throw new ApiException(
        'validation_error',
        'utteranceId and text are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.correctUtterance(id, resolveActor(req, actorHeader), {
      utteranceId: body.utteranceId,
      text: body.text,
      reason: body.reason,
    });
  }

  @Post('meetings/:id/items')
  @HttpCode(HttpStatus.CREATED)
  proposeItem(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      kind?: ItemKind;
      wording?: string;
      ownerParticipantIds?: string[];
      requiredApproverIds?: string[];
      dueDate?: string;
      sourceRevisionIds?: string[];
      conditions?: string[];
    } = {},
  ) {
    if (!body.kind || !body.wording) {
      throw new ApiException('validation_error', 'kind and wording are required', HttpStatus.BAD_REQUEST);
    }
    return this.meetingbridge.proposeItem(id, resolveActor(req, actorHeader), {
      kind: body.kind,
      wording: body.wording,
      ownerParticipantIds: body.ownerParticipantIds,
      requiredApproverIds: body.requiredApproverIds,
      dueDate: body.dueDate,
      sourceRevisionIds: body.sourceRevisionIds,
      conditions: body.conditions,
    });
  }

  @Post('items/:itemId/revisions')
  @HttpCode(HttpStatus.CREATED)
  reviseItem(
    @Req() req: AuthedRequest,
    @Param('itemId') itemId: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      meetingId?: string;
      expectedRevision?: number;
      wording?: string;
      ownerParticipantIds?: string[];
      requiredApproverIds?: string[];
      dueDate?: string | null;
      conditions?: string[];
      sourceRevisionIds?: string[];
    } = {},
  ) {
    if (!body.meetingId || body.expectedRevision == null) {
      throw new ApiException(
        'validation_error',
        'meetingId and expectedRevision are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.reviseItem(body.meetingId, resolveActor(req, actorHeader), {
      itemId,
      expectedRevision: body.expectedRevision,
      wording: body.wording,
      ownerParticipantIds: body.ownerParticipantIds,
      requiredApproverIds: body.requiredApproverIds,
      dueDate: body.dueDate,
      conditions: body.conditions,
      sourceRevisionIds: body.sourceRevisionIds,
    });
  }

  @Post('items/:itemId/sync')
  @HttpCode(HttpStatus.CREATED)
  syncItem(
    @Req() req: AuthedRequest,
    @Param('itemId') itemId: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      meetingId?: string;
      destination?: string;
      idempotencyKey?: string;
      target?: string;
    } = {},
  ) {
    if (!body.meetingId || !body.idempotencyKey) {
      throw new ApiException(
        'validation_error',
        'meetingId and idempotencyKey are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.syncItem(body.meetingId, resolveActor(req, actorHeader), {
      itemId,
      destination: body.destination,
      idempotencyKey: body.idempotencyKey,
      target: body.target,
    });
  }

  @Post('meetings/:id/handoff/dealbridge')
  handoffDeal(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.handoffDealBridge(id, resolveActor(req, actorHeader));
  }

  @Post('meetings/:id/handoff/voicebridge')
  handoffVoice(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.handoffVoiceBridge(id, resolveActor(req, actorHeader));
  }

  @Post('items/:itemId/confirmations')
  confirm(
    @Req() req: AuthedRequest,
    @Param('itemId') itemId: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      meetingId?: string;
      action?: ConfirmAction;
      idempotencyKey?: string;
      note?: string;
      presentationId?: string;
    } = {},
  ) {
    if (!body.meetingId || !body.action || !body.idempotencyKey) {
      throw new ApiException(
        'validation_error',
        'meetingId, action, and idempotencyKey are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.confirmItem(body.meetingId, resolveActor(req, actorHeader), {
      itemId,
      action: body.action,
      idempotencyKey: body.idempotencyKey,
      note: body.note,
      presentationId: body.presentationId,
    });
  }

  @Post('meetings/:id/close')
  close(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.closeMeeting(id, resolveActor(req, actorHeader));
  }

  @Post('meetings/:id/minutes')
  @HttpCode(HttpStatus.CREATED)
  minutes(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.issueMinutes(id, resolveActor(req, actorHeader));
  }

  @Post('minutes/:minutesId/exports')
  @HttpCode(HttpStatus.CREATED)
  exportMinutes(
    @Req() req: AuthedRequest,
    @Param('minutesId') minutesId: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      meetingId?: string;
      format?: 'markdown' | 'json' | 'csv_tasks';
      idempotencyKey?: string;
    } = {},
  ) {
    if (!body.meetingId || !body.idempotencyKey) {
      throw new ApiException(
        'validation_error',
        'meetingId and idempotencyKey are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.exportMinutes(body.meetingId, resolveActor(req, actorHeader), {
      minutesId,
      format: body.format,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post('meetings/:id/media/token')
  mediaToken(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.mintMediaToken(id, resolveActor(req, actorHeader));
  }

  @Post('meetings/:id/media/signal')
  mediaSignal(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      token?: string;
      toUserId?: string;
      kind?: 'offer' | 'answer' | 'ice';
      payload?: unknown;
    } = {},
  ) {
    if (!body.token || !body.toUserId || !body.kind) {
      throw new ApiException(
        'validation_error',
        'token, toUserId, and kind are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.postMediaSignal(id, resolveActor(req, actorHeader), {
      token: body.token,
      toUserId: body.toUserId,
      kind: body.kind,
      payload: body.payload,
    });
  }

  @Post('meetings/:id/media/signals/pull')
  mediaSignalsPull(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body() body: { token?: string; afterId?: string } = {},
  ) {
    if (!body.token) {
      throw new ApiException('validation_error', 'token is required', HttpStatus.BAD_REQUEST);
    }
    return this.meetingbridge.pullMediaSignals(id, resolveActor(req, actorHeader), {
      token: body.token,
      afterId: body.afterId,
    });
  }

  @Post('meetings/:id/lobby/mic-check')
  micCheck(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      deviceLabel?: string;
      sampleRate?: number;
      levelPeak?: number;
      muted?: boolean;
    } = {},
  ) {
    return this.meetingbridge.lobbyMicCheck(id, resolveActor(req, actorHeader), body);
  }

  @Get('meetings/:id/inbox')
  inbox(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.confirmationInbox(id, resolveActor(req, actorHeader));
  }

  @Get('meetings/:id/diagnostics')
  diagnostics(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
  ) {
    return this.meetingbridge.diagnostics(id, resolveActor(req, actorHeader));
  }

  @Post('meetings/:id/conferencing')
  conferencing(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body() body: { provider?: 'zoom' | 'teams' | 'broadcast'; meetingUrl?: string } = {},
  ) {
    if (!body.provider) {
      throw new ApiException('validation_error', 'provider is required', HttpStatus.BAD_REQUEST);
    }
    return this.meetingbridge.joinConferencing(id, resolveActor(req, actorHeader), {
      provider: body.provider,
      meetingUrl: body.meetingUrl,
    });
  }

  @Post('meetings/:id/tts')
  listenTts(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-meetingbridge-actor-id') actorHeader?: string,
    @Body() body: { text?: string; language?: string } = {},
  ) {
    if (!body.text || !body.language) {
      throw new ApiException(
        'validation_error',
        'text and language are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.meetingbridge.synthesizeListenChannel(id, resolveActor(req, actorHeader), {
      text: body.text,
      language: body.language,
    });
  }
}

/** Unauthenticated caption broadcast reads (token-gated). */
@Controller('v1/meetingbridge/public')
export class MeetingBridgePublicController {
  constructor(private readonly meetingbridge: MeetingBridgeService) {}

  @Get('broadcast/:token')
  broadcast(@Param('token') token: string) {
    return this.meetingbridge.publicBroadcast(token);
  }
}
