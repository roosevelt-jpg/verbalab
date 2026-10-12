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
import { RelayService } from './relay.service';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.RELAY_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'Relay requires a signed-in session, or an API key with a Relay actor header for local testing.',
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

@Controller('v1/relay')
@UseGuards(TranslateAuthGuard)
export class RelayController {
  constructor(private readonly relay: RelayService) {}

  @Get('catalog')
  catalog() {
    return this.relay.catalog();
  }

  @Get('coverage')
  coverage(
    @Req() req: AuthedRequest,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.coverage(resolveActor(req, actorHeader));
  }

  @Get('slots')
  slots(
    @Req() req: AuthedRequest,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Query('corridorId') corridorId?: string,
  ) {
    return this.relay.listSlots(resolveActor(req, actorHeader), corridorId);
  }

  @Get('ops/overview')
  ops(
    @Req() req: AuthedRequest,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.opsOverview(resolveActor(req, actorHeader));
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  createRequest(
    @Req() req: AuthedRequest,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body()
    body: {
      corridorId?: string;
      category?: string;
      preferredStartAt?: string;
      preferredTimezone?: string;
      durationMinutes?: number;
      originProduct?: string;
      originRefs?: Record<string, unknown>;
      notes?: string;
      idempotencyKey?: string;
    } = {},
  ) {
    if (!body.idempotencyKey) {
      throw new ApiException('validation_error', 'idempotencyKey is required', HttpStatus.BAD_REQUEST);
    }
    return this.relay.createRequest(resolveActor(req, actorHeader), {
      ...body,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Get('requests/:id')
  getRequest(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.getRequest(resolveActor(req, actorHeader), id);
  }

  @Post('offers/:id/accept')
  @HttpCode(HttpStatus.OK)
  acceptOffer(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.acceptOffer(resolveActor(req, actorHeader), id);
  }

  @Post('offers/:id/decline')
  declineOffer(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.declineOffer(resolveActor(req, actorHeader), id);
  }

  @Get('offers')
  listOffers(
    @Req() req: AuthedRequest,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.listOffersForInterpreter(resolveActor(req, actorHeader));
  }

  @Post('requests/:id/quotes/:quoteId/accept')
  @HttpCode(HttpStatus.CREATED)
  acceptQuote(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.acceptQuote(resolveActor(req, actorHeader), id, quoteId);
  }

  @Get('bookings')
  listBookings(
    @Req() req: AuthedRequest,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.listBookings(resolveActor(req, actorHeader));
  }

  @Get('bookings/:id')
  getBooking(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.getBooking(resolveActor(req, actorHeader), id);
  }

  @Post('bookings/:id/context-grants')
  @HttpCode(HttpStatus.CREATED)
  contextGrant(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body()
    body: {
      purpose?: string;
      evidence?: unknown[];
      originProduct?: string;
      scopeNote?: string;
      expiresInHours?: number;
    } = {},
  ) {
    return this.relay.createContextGrant(resolveActor(req, actorHeader), id, {
      purpose: body.purpose ?? 'session_interpretation',
      evidence: body.evidence ?? [],
      originProduct: body.originProduct,
      scopeNote: body.scopeNote,
      expiresInHours: body.expiresInHours,
    });
  }

  @Post('bookings/:id/context-grants/:grantId/revoke')
  revokeGrant(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('grantId') grantId: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
  ) {
    return this.relay.revokeContextGrant(resolveActor(req, actorHeader), id, grantId);
  }

  @Post('bookings/:id/join')
  @HttpCode(HttpStatus.OK)
  join(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { recordingOptIn?: boolean } = {},
  ) {
    return this.relay.join(resolveActor(req, actorHeader), id, body);
  }

  @Post('bookings/:id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { connectedSeconds?: number } = {},
  ) {
    return this.relay.complete(resolveActor(req, actorHeader), id, body);
  }

  @Post('bookings/:id/cancel')
  cancel(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { reason?: string } = {},
  ) {
    return this.relay.cancel(resolveActor(req, actorHeader), id, body.reason);
  }

  @Post('bookings/:id/extensions')
  @HttpCode(HttpStatus.CREATED)
  approveExtension(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { additionalMinutes?: number; expectedRevision?: number } = {},
  ) {
    if (body.additionalMinutes == null) {
      throw new ApiException(
        'validation_error',
        'additionalMinutes is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.relay.approveExtension(resolveActor(req, actorHeader), id, {
      additionalMinutes: body.additionalMinutes,
      expectedRevision: body.expectedRevision,
    });
  }

  @Post('bookings/:id/corrections')
  @HttpCode(HttpStatus.CREATED)
  submitCorrection(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body()
    body: {
      suggestion?: string;
      grantId?: string;
      sourceEvidenceNote?: string;
      trainingRightsGranted?: boolean;
    } = {},
  ) {
    if (!body.suggestion) {
      throw new ApiException('validation_error', 'suggestion is required', HttpStatus.BAD_REQUEST);
    }
    return this.relay.submitCorrection(resolveActor(req, actorHeader), id, {
      suggestion: body.suggestion,
      grantId: body.grantId,
      sourceEvidenceNote: body.sourceEvidenceNote,
      trainingRightsGranted: body.trainingRightsGranted,
    });
  }

  @Post('bookings/:id/corrections/:correctionId/review')
  reviewCorrection(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('correctionId') correctionId: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { reviewStatus?: 'accepted' | 'rejected' } = {},
  ) {
    if (!body.reviewStatus) {
      throw new ApiException('validation_error', 'reviewStatus is required', HttpStatus.BAD_REQUEST);
    }
    return this.relay.reviewCorrection(resolveActor(req, actorHeader), id, correctionId, {
      reviewStatus: body.reviewStatus,
    });
  }

  @Post('bookings/:id/feedback')
  @HttpCode(HttpStatus.CREATED)
  feedback(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { rating?: number; comment?: string; role?: string } = {},
  ) {
    return this.relay.feedback(resolveActor(req, actorHeader), id, body);
  }

  @Post('bookings/:id/disputes')
  @HttpCode(HttpStatus.CREATED)
  dispute(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { issue?: string; evidence?: unknown[] } = {},
  ) {
    if (!body.issue) {
      throw new ApiException('validation_error', 'issue is required', HttpStatus.BAD_REQUEST);
    }
    return this.relay.openDispute(resolveActor(req, actorHeader), id, {
      issue: body.issue,
      evidence: body.evidence,
    });
  }

  @Post('bookings/:id/payments/mark-paid')
  @HttpCode(HttpStatus.OK)
  markPaid(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { idempotencyKey?: string } = {},
  ) {
    if (!body.idempotencyKey) {
      throw new ApiException('validation_error', 'idempotencyKey is required', HttpStatus.BAD_REQUEST);
    }
    return this.relay.markPaid(resolveActor(req, actorHeader), id, body.idempotencyKey);
  }

  @Post('interpreters')
  @HttpCode(HttpStatus.CREATED)
  registerInterpreter(
    @Req() req: AuthedRequest,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body()
    body: {
      displayName?: string;
      languagePairs?: { source: string; target: string }[];
      timezone?: string;
      confidentialityAccepted?: boolean;
    } = {},
  ) {
    return this.relay.registerInterpreter(resolveActor(req, actorHeader), body);
  }

  @Post('interpreters/:id/review')
  reviewInterpreter(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { status?: 'approved' | 'suspended'; reviewerNote?: string } = {},
  ) {
    if (!body.status) {
      throw new ApiException('validation_error', 'status is required', HttpStatus.BAD_REQUEST);
    }
    return this.relay.reviewInterpreter(resolveActor(req, actorHeader), id, {
      status: body.status,
      reviewerNote: body.reviewerNote,
    });
  }

  @Post('interpreters/:id/slots')
  @HttpCode(HttpStatus.CREATED)
  createSlot(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-relay-actor-id') actorHeader?: string,
    @Body() body: { startAt?: string; endAt?: string; displayTimezone?: string } = {},
  ) {
    if (!body.startAt || !body.endAt) {
      throw new ApiException(
        'validation_error',
        'startAt and endAt are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.relay.createSlot(resolveActor(req, actorHeader), id, {
      startAt: body.startAt,
      endAt: body.endAt,
      displayTimezone: body.displayTimezone,
    });
  }
}
