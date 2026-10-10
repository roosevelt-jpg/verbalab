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
import { VoiceBridgeService } from './voicebridge.service';
import type { ConsentPurpose } from './voicebridge.types';
import { VOICEBRIDGE_MAX_UPLOAD_BYTES } from './voicebridge.types';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.VOICEBRIDGE_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'VoiceBridge requires a Clerk session user, or X-VoiceBridge-Actor-Id when using API keys / VOICEBRIDGE_ALLOW_TEST_ACTORS=1',
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

@Controller('v1/voicebridge')
@UseGuards(TranslateAuthGuard)
export class VoiceBridgeController {
  constructor(private readonly voicebridge: VoiceBridgeService) {}

  @Get('catalog')
  catalog() {
    return this.voicebridge.catalog();
  }

  @Get('invites/:token')
  peekInvite(@Param('token') token: string) {
    return this.voicebridge.peekInvite(token);
  }

  @Get('threads')
  list(
    @Req() req: AuthedRequest,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
  ) {
    return this.voicebridge.listThreads(resolveActor(req, actorHeader));
  }

  @Post('threads')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthedRequest,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body()
    body: { title?: string; category?: string; language?: string; variety?: string; corridor?: string } = {},
  ) {
    if (!body.title || !body.language) {
      throw new ApiException(
        'validation_error',
        'title and language are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.voicebridge.createThread(resolveActor(req, actorHeader), {
      title: body.title,
      category: body.category,
      language: body.language,
      variety: body.variety,
      corridor: body.corridor,
    });
  }

  @Get('threads/:id')
  get(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
  ) {
    return this.voicebridge.threadView(id, resolveActor(req, actorHeader));
  }

  @Post('threads/:id/invites')
  @HttpCode(HttpStatus.CREATED)
  invite(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body() body: { expiresInHours?: number } = {},
  ) {
    return this.voicebridge.createInvite(id, resolveActor(req, actorHeader), body.expiresInHours);
  }

  @Post('threads/:id/join')
  join(
    @Req() req: AuthedRequest,
    @Param('id') _id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      token?: string;
      language?: string;
      variety?: string;
      consents?: { purpose: ConsentPurpose; decision: 'granted' | 'denied' }[];
    } = {},
  ) {
    if (!body.token || !body.language) {
      throw new ApiException(
        'validation_error',
        'token and language are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.voicebridge.joinThread(body.token, resolveActor(req, actorHeader), {
      language: body.language,
      variety: body.variety,
      consents: body.consents,
    });
  }

  @Patch('threads/:id/members/me')
  patchMe(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body()
    body: { language?: string; variety?: string | null; notificationsEnabled?: boolean } = {},
  ) {
    return this.voicebridge.patchMemberMe(id, resolveActor(req, actorHeader), body);
  }

  @Post('threads/:id/uploads')
  uploads(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
  ) {
    return this.voicebridge.issueUploadAuth(id, resolveActor(req, actorHeader));
  }

  @Post('threads/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: VOICEBRIDGE_MAX_UPLOAD_BYTES },
    }),
  )
  createMessage(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body()
    body: {
      text?: string;
      language?: string;
      idempotencyKey?: string;
      replyToMessageId?: string;
      replyToRevisionId?: string;
    } = {},
  ) {
    return this.voicebridge.createDraftMessage(id, resolveActor(req, actorHeader), {
      ...body,
      file,
    });
  }

  @Patch('messages/:id/draft')
  patchDraft(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body() body: { reviewedTranscript?: string; expectedDraftRevisionId?: string } = {},
  ) {
    if (!body.reviewedTranscript || !body.expectedDraftRevisionId) {
      throw new ApiException(
        'validation_error',
        'reviewedTranscript and expectedDraftRevisionId are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.voicebridge.updateDraftTranscript(id, resolveActor(req, actorHeader), {
      reviewedTranscript: body.reviewedTranscript,
      expectedDraftRevisionId: body.expectedDraftRevisionId,
    });
  }

  @Post('messages/:id/publish')
  publish(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body()
    body: { expectedDraftRevisionId?: string; reviewedTranscript?: string } = {},
  ) {
    if (!body.expectedDraftRevisionId) {
      throw new ApiException(
        'validation_error',
        'expectedDraftRevisionId is required (sender review)',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.voicebridge.publishMessage(id, resolveActor(req, actorHeader), {
      expectedDraftRevisionId: body.expectedDraftRevisionId,
      reviewedTranscript: body.reviewedTranscript,
    });
  }

  @Post('messages/:id/corrections')
  correct(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      expectedActiveRevisionId?: string;
      reviewedTranscript?: string;
      correctionReason?: string;
    } = {},
  ) {
    if (!body.expectedActiveRevisionId || !body.reviewedTranscript) {
      throw new ApiException(
        'validation_error',
        'expectedActiveRevisionId and reviewedTranscript are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.voicebridge.correctMessage(id, resolveActor(req, actorHeader), {
      expectedActiveRevisionId: body.expectedActiveRevisionId,
      reviewedTranscript: body.reviewedTranscript,
      correctionReason: body.correctionReason,
    });
  }

  @Post('revisions/:id/acknowledgments')
  ack(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
  ) {
    return this.voicebridge.acknowledgeRevision(id, resolveActor(req, actorHeader));
  }

  @Post('revisions/:id/playback')
  playback(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
  ) {
    return this.voicebridge.recordPlayback(id, resolveActor(req, actorHeader));
  }

  @Post('threads/:id/deal-drafts')
  @HttpCode(HttpStatus.CREATED)
  dealDraft(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-voicebridge-actor-id') actorHeader?: string,
    @Body()
    body: {
      selectedRevisionIds?: string[];
      partyAUserId?: string;
      partyBUserId?: string;
      category?: string;
      idempotencyKey?: string;
    } = {},
  ) {
    if (!body.selectedRevisionIds?.length || !body.partyAUserId || !body.partyBUserId) {
      throw new ApiException(
        'validation_error',
        'selectedRevisionIds, partyAUserId, and partyBUserId are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.voicebridge.createDealDraft(id, resolveActor(req, actorHeader), {
      selectedRevisionIds: body.selectedRevisionIds,
      partyAUserId: body.partyAUserId,
      partyBUserId: body.partyBUserId,
      category: body.category,
      idempotencyKey: body.idempotencyKey,
    });
  }
}
