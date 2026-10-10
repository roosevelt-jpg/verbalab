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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthContext, TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { DealBridgeService } from './dealbridge.service';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.DEALBRIDGE_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'DealBridge requires a Clerk session user, or X-DealBridge-Actor-Id when using API keys / DEALBRIDGE_ALLOW_TEST_ACTORS=1',
      HttpStatus.UNAUTHORIZED,
    );
  }
  return {
    organizationId: req.translateAuth.organizationId,
    workspaceId: req.translateAuth.workspaceId,
    userId,
    apiKeyId: req.translateAuth.apiKeyId,
    authContext: fromSession ? 'clerk_session' : 'api_key_actor',
    ip: clientIp(req),
  };
}

@Controller('v1/dealbridge')
@UseGuards(TranslateAuthGuard)
export class DealBridgeController {
  constructor(private readonly dealbridge: DealBridgeService) {}

  @Get('catalog')
  catalog() {
    return this.dealbridge.catalog();
  }

  @Get('invites/:token')
  peekInvite(@Param('token') token: string) {
    return this.dealbridge.peekInvite(token);
  }

  @Get('sessions')
  list(
    @Req() req: AuthedRequest,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
  ) {
    return this.dealbridge.listSessions(resolveActor(req, actorHeader));
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthedRequest,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      category?: string;
      merchantLanguage?: string;
      buyerLanguage?: string;
      timeZone?: string;
      expiresInHours?: number;
      idempotencyKey?: string;
      pilotCohort?: 'baseline' | 'dealbridge';
      isDemo?: boolean;
    } = {},
  ) {
    if (!body.merchantLanguage || !body.buyerLanguage) {
      throw new ApiException(
        'validation_error',
        'merchantLanguage and buyerLanguage are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.dealbridge.createSession(resolveActor(req, actorHeader), {
      ...body,
      merchantLanguage: body.merchantLanguage,
      buyerLanguage: body.buyerLanguage,
    });
  }

  @Get('sessions/:id')
  get(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
  ) {
    return this.dealbridge.sessionView(id, resolveActor(req, actorHeader));
  }

  @Post('sessions/:id/invites')
  createInvite(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body() body: { expiresInHours?: number } = {},
  ) {
    return this.dealbridge.createInvite(
      resolveActor(req, actorHeader),
      id,
      body.expiresInHours,
    );
  }

  @Post('sessions/:id/join')
  join(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body() body: { token?: string; language?: string; variety?: string } = {},
  ) {
    if (!body.token || !body.language) {
      throw new ApiException(
        'validation_error',
        'token and language are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.dealbridge.join(resolveActor(req, actorHeader), id, {
      token: body.token,
      language: body.language,
      variety: body.variety,
    });
  }

  @Post('sessions/:id/consents')
  consent(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body()
    body: { purpose?: string; decision?: 'granted' | 'denied'; noticeVersion?: string } = {},
  ) {
    if (!body.purpose || !body.decision) {
      throw new ApiException(
        'validation_error',
        'purpose and decision are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.dealbridge.recordConsent(resolveActor(req, actorHeader), id, {
      purpose: body.purpose,
      decision: body.decision,
      noticeVersion: body.noticeVersion,
    });
  }

  @Post('sessions/:id/turns/uploads')
  uploadAuth(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
  ) {
    return this.dealbridge.issueUploadAuth(resolveActor(req, actorHeader), id);
  }

  @Post('sessions/:id/turns')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.DEALBRIDGE_MAX_AUDIO_BYTES ?? 5_000_000) },
    }),
  )
  createTurn(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body()
    body: { text?: string; language?: string; expectedRevision?: string | number } = {},
  ) {
    return this.dealbridge.createTurn(resolveActor(req, actorHeader), id, {
      text: body.text,
      language: body.language,
      expectedRevision:
        body.expectedRevision == null ? undefined : Number(body.expectedRevision),
      file,
    });
  }

  @Patch('sessions/:id/turns/:turnId')
  correctTurn(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('turnId') turnId: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body() body: { text?: string; expectedRevision?: number } = {},
  ) {
    if (!body.text?.trim()) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return this.dealbridge.correctTurn(resolveActor(req, actorHeader), id, turnId, {
      text: body.text,
      expectedRevision: body.expectedRevision,
    });
  }

  @Post('sessions/:id/snapshots')
  proposeSnapshot(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body()
    body: { expectedRevision?: number; overrides?: Record<string, unknown> } = {},
  ) {
    return this.dealbridge.proposeSnapshot(resolveActor(req, actorHeader), id, body);
  }

  @Post('sessions/:id/checks')
  submitCheck(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      snapshotId?: string;
      presentationHash?: string;
      responseText?: string;
      responseTurnId?: string;
    } = {},
  ) {
    if (!body.snapshotId || !body.presentationHash || body.responseText == null) {
      throw new ApiException(
        'validation_error',
        'snapshotId, presentationHash, and responseText are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.dealbridge.submitCheck(resolveActor(req, actorHeader), id, {
      snapshotId: body.snapshotId,
      presentationHash: body.presentationHash,
      responseText: body.responseText,
      responseTurnId: body.responseTurnId,
    });
  }

  @Post('sessions/:id/confirmations')
  confirm(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      snapshotId?: string;
      contentHash?: string;
      presentationHash?: string;
      action?: 'confirm' | 'change' | 'decline';
      idempotencyKey?: string;
    } = {},
  ) {
    if (
      !body.snapshotId ||
      !body.contentHash ||
      !body.presentationHash ||
      !body.action ||
      !body.idempotencyKey
    ) {
      throw new ApiException(
        'validation_error',
        'snapshotId, contentHash, presentationHash, action, and idempotencyKey are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.dealbridge.confirm(resolveActor(req, actorHeader), id, {
      snapshotId: body.snapshotId,
      contentHash: body.contentHash,
      presentationHash: body.presentationHash,
      action: body.action,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Get('sessions/:id/receipt')
  receipt(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
  ) {
    return this.dealbridge.getReceipt(resolveActor(req, actorHeader), id);
  }

  @Post('sessions/:id/revisions')
  revise(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body() body: { reason?: string; expectedRevision?: number } = {},
  ) {
    return this.dealbridge.startRevision(resolveActor(req, actorHeader), id, body);
  }

  @Delete('sessions/:id')
  remove(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
  ) {
    return this.dealbridge.requestDeletion(resolveActor(req, actorHeader), id);
  }

  @Get('sessions/:id/events')
  events(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
  ) {
    return this.dealbridge.listEvents(
      resolveActor(req, actorHeader),
      id,
      cursor != null ? Number(cursor) : undefined,
    );
  }

  @Post('demo/run')
  @HttpCode(HttpStatus.OK)
  runDemo(
    @Req() req: AuthedRequest,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
  ) {
    return this.dealbridge.runInvestorDemo(resolveActor(req, actorHeader));
  }

  @Post('demo/reset')
  resetDemo(
    @Req() req: AuthedRequest,
    @Headers('x-dealbridge-actor-id') actorHeader?: string,
    @Body() body: { sessionId?: string } = {},
  ) {
    if (!body.sessionId) {
      throw new ApiException('validation_error', 'sessionId is required', HttpStatus.BAD_REQUEST);
    }
    return this.dealbridge.resetDemo(resolveActor(req, actorHeader), body.sessionId);
  }
}
