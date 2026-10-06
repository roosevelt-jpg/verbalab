import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SlackConnectorService, SlackSlashCommand } from './slack.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';

@Controller('v1/connectors/slack')
export class SlackConnectorController {
  constructor(private readonly slack: SlackConnectorService) {}

  @Get('status')
  @UseGuards(ClerkAuthGuard)
  status {
    return this.slack.status;
  }

  @Get('installations')
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession session: SessionContext) {
    return this.slack.listInstallations(session.organizationId);
  }

  @Post('installations')
  @UseGuards(ClerkAuthGuard)
  upsert(
    @CurrentSession session: SessionContext,
    @Req req: Request,
    @Body
    body: { teamId?: string; teamName?: string; defaultTargetLang?: string },
  ) {
    return this.slack.upsertInstallation({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      teamId: body.teamId ?? '',
      teamName: body.teamName,
      defaultTargetLang: body.defaultTargetLang,
      userId: session.userId,
      role: session.role,
      ip: clientIp(req),
    });
  }

  @Post('events')
  @HttpCode(200)
  events(
    @Req req: Request & { rawBody?: Buffer },
    @Headers('x-slack-signature') signature: string | undefined,
    @Headers('x-slack-request-timestamp') timestamp: string | undefined,
  ) {
    const rawBody = this.requireRawBody(req);
    this.slack.assertSignature(rawBody, timestamp, signature);
    const payload = JSON.parse(rawBody) as { type?: string; challenge?: string };
    const challenge = this.slack.handleUrlVerification(payload);
    if (challenge) return challenge;
    return { ok: true };
  }

  @Post('commands')
  @HttpCode(200)
  async commands(
    @Req req: Request & { rawBody?: Buffer; body?: Record<string, string> },
    @Headers('x-slack-signature') signature: string | undefined,
    @Headers('x-slack-request-timestamp') timestamp: string | undefined,
  ) {
    const rawBody = this.requireRawBody(req);
    this.slack.assertSignature(rawBody, timestamp, signature);

    const params = new URLSearchParams(rawBody);
    const command: SlackSlashCommand = {
      team_id: params.get('team_id') ?? req.body?.team_id,
      channel_id: params.get('channel_id') ?? req.body?.channel_id,
      user_id: params.get('user_id') ?? req.body?.user_id,
      text: params.get('text') ?? req.body?.text ?? '',
      response_url: params.get('response_url') ?? req.body?.response_url,
      command: params.get('command') ?? req.body?.command,
    };

    return this.slack.handleSlashCommand(command);
  }

  private requireRawBody(req: Request & { rawBody?: Buffer }) {
    const rawBody = req.rawBody?.toString('utf8');
    if (!rawBody) {
      throw new ApiException(
        'invalid_webhook',
        'Raw body unavailable for Slack signature verification',
        HttpStatus.BAD_REQUEST,
      );
    }
    return rawBody;
  }
}
