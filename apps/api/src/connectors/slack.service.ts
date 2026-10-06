import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslateService } from '../translate/translate.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { verifySlackSignature } from './slack-signature';
import { HttpSlackClient, SlackClient } from './slack.client';

export type SlackSlashCommand = {
  team_id?: string;
  channel_id?: string;
  user_id?: string;
  text?: string;
  response_url?: string;
  command?: string;
};

@Injectable()
export class SlackConnectorService {
  private readonly logger = new Logger(SlackConnectorService.name);
  private client: SlackClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
  ) {
    this.client = new HttpSlackClient(process.env.SLACK_BOT_TOKEN ?? '');
  }

  /** Test hook only. */
  setClientForTests(client: SlackClient) {
    this.client = client;
  }

  isConfigured(): boolean {
    return Boolean(process.env.SLACK_SIGNING_SECRET);
  }

  assertSignature(rawBody: string, timestamp?: string, signature?: string) {
    if (process.env.SLACK_CONNECTOR_DISABLED === '1') {
      throw new ApiException(
        'connector_disabled',
        'Slack connector is disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const secret = process.env.SLACK_SIGNING_SECRET ?? '';
    if (!secret) {
      throw new ApiException(
        'provider_not_configured',
        'SLACK_SIGNING_SECRET is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const ok = verifySlackSignature({
      signingSecret: secret,
      timestamp,
      signature,
      rawBody,
    });
    if (!ok) {
      throw new ApiException('invalid_webhook', 'Invalid Slack signature', HttpStatus.UNAUTHORIZED);
    }
  }

  handleUrlVerification(payload: { type?: string; challenge?: string }) {
    if (payload.type === 'url_verification' && payload.challenge) {
      return { challenge: payload.challenge };
    }
    return null;
  }

  parseSlashText(text: string, defaultTarget: string): { target: string; sourceText: string } {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new ApiException(
        'validation_error',
        'Usage: /lugemi <targetLang> <text>  e.g. /lugemi sw Hello',
        HttpStatus.BAD_REQUEST,
      );
    }
    const parts = trimmed.split(/\s+/);
    const maybeTarget = parts[0]!.toLowerCase();
    if (/^[a-z]{2,3}(-[a-z0-9]+)?$/i.test(maybeTarget) && parts.length >= 2) {
      return { target: maybeTarget, sourceText: parts.slice(1).join(' ') };
    }
    return { target: defaultTarget, sourceText: trimmed };
  }

  async handleSlashCommand(command: SlackSlashCommand) {
    const teamId = command.team_id;
    if (!teamId) {
      throw new ApiException('validation_error', 'Missing team_id', HttpStatus.BAD_REQUEST);
    }

    const installation = await this.prisma.slackInstallation.findUnique({
      where: { teamId },
    });
    if (!installation) {
      throw new ApiException(
        'not_found',
        'Slack workspace is not linked. Add an installation in the Lugemi console.',
        HttpStatus.NOT_FOUND,
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: installation.organizationId },
      select: { disabledAt: true },
    });
    if (org?.disabledAt) {
      throw new ApiException(
        'org_disabled',
        'Organization is disabled',
        HttpStatus.FORBIDDEN,
      );
    }

    const { target, sourceText } = this.parseSlashText(
      command.text ?? '',
      installation.defaultTargetLang,
    );

    const result = await this.translate.translate({
      text: sourceText,
      source: 'auto',
      target,
      organizationId: installation.organizationId,
      workspaceId: installation.workspaceId,
      skipReview: true,
    });

    await this.audit.record({
      organizationId: installation.organizationId,
      action: 'connector.slack.translate',
      route: 'POST /v1/connectors/slack/commands',
      metadata: {
        teamId,
        channelId: command.channel_id,
        userId: command.user_id,
        target,
        characters: result.characters,
        provider: result.provider,
      },
    });

    const reply = `*${result.source} → ${result.target}* (${result.provider})\n${result.text}`;

    if (command.channel_id && process.env.SLACK_BOT_TOKEN) {
      void this.client
        .postMessage({
          channel: command.channel_id,
          text: reply,
        })
        .catch((error) => {
          this.logger.warn(
            `Slack postMessage failed: ${error instanceof Error ? error.message : error}`,
          );
        });
    }

    return {
      response_type: 'in_channel' as const,
      text: reply,
    };
  }

  async upsertInstallation(input: {
    organizationId: string;
    workspaceId: string;
    teamId: string;
    teamName?: string;
    defaultTargetLang?: string;
    userId: string;
    role: string;
    ip?: string;
  }) {
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can manage Slack installations',
        HttpStatus.FORBIDDEN,
      );
    }

    const teamId = input.teamId.trim();
    if (!teamId) {
      throw new ApiException('validation_error', 'teamId is required', HttpStatus.BAD_REQUEST);
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: input.workspaceId, organizationId: input.organizationId },
    });
    if (!workspace) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }

    const row = await this.prisma.slackInstallation.upsert({
      where: { teamId },
      create: {
        teamId,
        teamName: input.teamName,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        defaultTargetLang: input.defaultTargetLang?.trim() || 'en',
      },
      update: {
        teamName: input.teamName,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        defaultTargetLang: input.defaultTargetLang?.trim() || undefined,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector.slack.installation_upserted',
      route: 'POST /v1/connectors/slack/installations',
      ip: input.ip,
      metadata: { teamId: row.teamId, installationId: row.id },
    });

    return row;
  }

  listInstallations(organizationId: string) {
    return this.prisma.slackInstallation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  status() {
    return {
      provider: 'slack',
      signingSecretConfigured: Boolean(process.env.SLACK_SIGNING_SECRET),
      botTokenConfigured: Boolean(process.env.SLACK_BOT_TOKEN),
      disabled: process.env.SLACK_CONNECTOR_DISABLED === '1',
      commandsUrl: '/v1/connectors/slack/commands',
      eventsUrl: '/v1/connectors/slack/events',
    };
  }
}
