import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthContext, TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { AccessLineService } from './accessline.service';
import type { RegisteredContact, TransferDestination } from './accessline.types';

type AuthedRequest = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

function resolveActor(req: AuthedRequest, actorHeader?: string) {
  const fromSession = req.sessionAuth?.userId;
  const allowTestActors =
    process.env.NODE_ENV === 'test' ||
    process.env.ACCESSLINE_ALLOW_TEST_ACTORS === '1' ||
    Boolean(req.translateAuth.apiKeyId);
  const fromHeader = allowTestActors ? actorHeader?.trim() : undefined;
  const userId = fromSession || fromHeader;
  if (!userId) {
    throw new ApiException(
      'actor_required',
      'AccessLine requires a Clerk session user, or X-AccessLine-Actor-Id when using API keys / ACCESSLINE_ALLOW_TEST_ACTORS=1',
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

@Controller('v1/accessline')
@UseGuards(TranslateAuthGuard)
export class AccessLineController {
  constructor(private readonly accessline: AccessLineService) {}

  @Get('catalog')
  catalog() {
    return this.accessline.catalog();
  }

  @Get('capabilities')
  capabilities() {
    return this.accessline.capabilities();
  }

  @Get('metrics')
  metrics(@Req() req: AuthedRequest, @Headers('x-accessline-actor-id') actorHeader?: string) {
    return this.accessline.metrics(resolveActor(req, actorHeader));
  }

  @Get('lines')
  listLines(@Req() req: AuthedRequest, @Headers('x-accessline-actor-id') actorHeader?: string) {
    return this.accessline.listLines(resolveActor(req, actorHeader));
  }

  @Post('lines')
  @HttpCode(HttpStatus.CREATED)
  createLine(
    @Req() req: AuthedRequest,
    @Headers('x-accessline-actor-id') actorHeader?: string,
    @Body()
    body: {
      name?: string;
      inboundNumber?: string;
      jurisdiction?: string;
      timeZone?: string;
      enabledLanguages?: string[];
      recordingEnabled?: boolean;
      transferDestinations?: TransferDestination[];
      registeredContacts?: RegisteredContact[];
      knowledgeSnippet?: string;
      integrationMode?: 'simulated' | 'twilio';
    } = {},
  ) {
    if (!body.inboundNumber) {
      throw new ApiException('validation_error', 'inboundNumber is required', HttpStatus.BAD_REQUEST);
    }
    return this.accessline.createLine(resolveActor(req, actorHeader), {
      name: body.name ?? 'AccessLine pilot',
      inboundNumber: body.inboundNumber,
      jurisdiction: body.jurisdiction,
      timeZone: body.timeZone,
      enabledLanguages: body.enabledLanguages,
      recordingEnabled: body.recordingEnabled,
      transferDestinations: body.transferDestinations,
      registeredContacts: body.registeredContacts,
      knowledgeSnippet: body.knowledgeSnippet,
      integrationMode: body.integrationMode,
    });
  }

  @Get('lines/:id')
  getLine(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-accessline-actor-id') actorHeader?: string,
  ) {
    return this.accessline.getLine(resolveActor(req, actorHeader), id);
  }

  @Get('calls')
  listCalls(@Req() req: AuthedRequest, @Headers('x-accessline-actor-id') actorHeader?: string) {
    return this.accessline.listCalls(resolveActor(req, actorHeader));
  }

  @Get('calls/:id')
  getCall(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-accessline-actor-id') actorHeader?: string,
  ) {
    return this.accessline.getCall(resolveActor(req, actorHeader), id);
  }

  @Get('calls/:id/summary')
  summary(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-accessline-actor-id') actorHeader?: string,
  ) {
    return this.accessline.callSummary(resolveActor(req, actorHeader), id);
  }

  @Post('calls/:id/handoff')
  @HttpCode(HttpStatus.OK)
  handoff(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Headers('x-accessline-actor-id') actorHeader?: string,
    @Body() body: { reason?: string; destinationId?: string; idempotencyKey?: string } = {},
  ) {
    return this.accessline.requestHandoff(resolveActor(req, actorHeader), id, {
      reason: body.reason ?? 'api_requested',
      destinationId: body.destinationId,
      idempotencyKey: body.idempotencyKey ?? `handoff:${id}:api:${Date.now()}`,
    });
  }

  @Post('simulate/start')
  @HttpCode(HttpStatus.CREATED)
  simulateStart(
    @Req() req: AuthedRequest,
    @Headers('x-accessline-actor-id') actorHeader?: string,
    @Body() body: { lineId?: string; callerId?: string } = {},
  ) {
    if (!body.lineId) {
      throw new ApiException('validation_error', 'lineId is required', HttpStatus.BAD_REQUEST);
    }
    return this.accessline.simulateStart(resolveActor(req, actorHeader), {
      lineId: body.lineId,
      callerId: body.callerId,
    });
  }

  @Post('simulate/:callId/dtmf')
  @HttpCode(HttpStatus.OK)
  simulateDtmf(
    @Req() req: AuthedRequest,
    @Param('callId') callId: string,
    @Headers('x-accessline-actor-id') actorHeader?: string,
    @Body() body: { digits?: string } = {},
  ) {
    if (!body.digits) {
      throw new ApiException('validation_error', 'digits required', HttpStatus.BAD_REQUEST);
    }
    return this.accessline.simulateDtmf(resolveActor(req, actorHeader), callId, body.digits);
  }

  @Post('simulate/:callId/speech')
  @HttpCode(HttpStatus.OK)
  simulateSpeech(
    @Req() req: AuthedRequest,
    @Param('callId') callId: string,
    @Headers('x-accessline-actor-id') actorHeader?: string,
    @Body() body: { text?: string } = {},
  ) {
    if (!body.text) {
      throw new ApiException('validation_error', 'text required', HttpStatus.BAD_REQUEST);
    }
    return this.accessline.simulateSpeech(resolveActor(req, actorHeader), callId, body.text);
  }

  @Post('simulate/:callId/hangup')
  @HttpCode(HttpStatus.OK)
  simulateHangup(
    @Req() req: AuthedRequest,
    @Param('callId') callId: string,
    @Headers('x-accessline-actor-id') actorHeader?: string,
  ) {
    return this.accessline.simulateHangup(resolveActor(req, actorHeader), callId);
  }
}
