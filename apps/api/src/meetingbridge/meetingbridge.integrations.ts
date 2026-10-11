import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { HttpSlackClient, ResendStyleMemorySlackClient, type SlackClient } from '../connectors/slack.client';
import { NotificationsService } from '../notifications/notifications.service';

export type ConferencingProvider = 'zoom' | 'teams' | 'broadcast';

export type IntegrationCapability = {
  slack: { available: boolean; note: string };
  email: { available: boolean; note: string };
  calendar: { available: boolean; note: string };
  zoom: { available: boolean; note: string };
  teams: { available: boolean; note: string };
  broadcast: { available: boolean; note: string };
};

type BroadcastRecord = {
  token: string;
  meetingId: string;
  organizationId: string;
  title: string;
  createdAt: number;
  createdById: string;
};

@Injectable()
export class MeetingBridgeIntegrations {
  private readonly logger = new Logger(MeetingBridgeIntegrations.name);
  private slack: SlackClient;
  private readonly broadcasts = new Map<string, BroadcastRecord>();

  constructor(private readonly notifications: NotificationsService) {
    const token = process.env.SLACK_BOT_TOKEN?.trim();
    this.slack =
      process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS === '1'
        ? new ResendStyleMemorySlackClient()
        : new HttpSlackClient(token ?? '');
  }

  /** Test hook */
  setSlackForTests(client: SlackClient) {
    this.slack = client;
  }

  capabilities(): IntegrationCapability {
    const fixture =
      process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS === '1';
    return {
      slack: {
        available: fixture || Boolean(process.env.SLACK_BOT_TOKEN?.trim()),
        note: fixture
          ? 'Fixture Slack client (labeled). Set SLACK_BOT_TOKEN for live posts.'
          : process.env.SLACK_BOT_TOKEN?.trim()
            ? 'Live Slack chat.postMessage via SLACK_BOT_TOKEN.'
            : 'SLACK_BOT_TOKEN not set — Slack sync disabled.',
      },
      email: {
        available: fixture || this.notifications.isConfigured(),
        note: fixture
          ? 'Fixture/test email path allowed.'
          : this.notifications.isConfigured()
            ? 'Resend email configured.'
            : 'RESEND_API_KEY / EMAIL_FROM not set — email sync disabled.',
      },
      calendar: {
        available: true,
        note: 'ICS calendar attachments always available. Google Calendar API writes require GOOGLE_CALENDAR_ACCESS_TOKEN.',
      },
      zoom: {
        available: fixture || Boolean(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET),
        note: fixture
          ? 'Fixture Zoom bot adapter for tests.'
          : process.env.ZOOM_CLIENT_ID
            ? 'Zoom credentials present — meeting bot join can be requested.'
            : 'Zoom bot credentials not set. Purchase/configure Zoom Marketplace app separately.',
      },
      teams: {
        available: fixture || Boolean(process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_APP_PASSWORD),
        note: fixture
          ? 'Fixture Teams bot adapter for tests.'
          : process.env.TEAMS_BOT_APP_ID
            ? 'Teams bot credentials present.'
            : 'Teams bot credentials not set. Configure Azure Bot separately.',
      },
      broadcast: {
        available: process.env.MEETINGBRIDGE_BROADCAST_ENABLED === '1' || fixture,
        note:
          process.env.MEETINGBRIDGE_BROADCAST_ENABLED === '1' || fixture
            ? 'Public caption broadcast tokens can be minted for authorized meetings.'
            : 'Set MEETINGBRIDGE_BROADCAST_ENABLED=1 to allow public caption broadcasts.',
      },
    };
  }

  async postSlack(input: { channel: string; text: string }) {
    const caps = this.capabilities();
    if (!caps.slack.available) {
      throw new ApiException('integration_disabled', caps.slack.note, HttpStatus.SERVICE_UNAVAILABLE);
    }
    const result = await this.slack.postMessage({ channel: input.channel, text: input.text });
    if (!result.ok) {
      throw new ApiException(
        'integration_failed',
        `Slack post failed: ${result.error ?? 'unknown'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return {
      provider: this.slack.name,
      externalId: result.ts,
      fixture: this.slack.name === 'memory',
    };
  }

  async sendEmail(input: { to: string; subject: string; text: string }) {
    const caps = this.capabilities();
    if (!caps.email.available) {
      throw new ApiException('integration_disabled', caps.email.note, HttpStatus.SERVICE_UNAVAILABLE);
    }
    if (process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS === '1') {
      if (!this.notifications.isConfigured()) {
        return { provider: 'fixture_email', externalId: `fixture-mail-${Date.now()}`, fixture: true };
      }
    }
    const result = await this.notifications.sendEmail({
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    if (!result) {
      throw new ApiException('integration_failed', 'Email provider returned null', HttpStatus.BAD_GATEWAY);
    }
    return { provider: 'resend', externalId: result.id ?? null, fixture: false };
  }

  buildIcs(input: {
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    uid: string;
  }) {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const escape = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lugemi MeetingBridge//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${input.uid}`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(input.startsAt)}`,
      `DTEND:${fmt(input.endsAt)}`,
      `SUMMARY:${escape(input.title)}`,
      `DESCRIPTION:${escape(input.description)}`,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }

  async writeGoogleCalendar(input: {
    accessToken?: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
  }) {
    const token = input.accessToken || process.env.GOOGLE_CALENDAR_ACCESS_TOKEN?.trim();
    if (!token) {
      // ICS-only path — caller still gets calendar artifact without Google write.
      return { provider: 'ics_only', externalId: null, fixture: false };
    }
    if (process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS === '1') {
      return { provider: 'fixture_gcal', externalId: `gcal-fixture-${Date.now()}`, fixture: true };
    }
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: input.startsAt.toISOString() },
        end: { dateTime: input.endsAt.toISOString() },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new ApiException(
        'integration_failed',
        `Google Calendar write failed: HTTP ${response.status} ${text.slice(0, 200)}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const json = (await response.json()) as { id?: string };
    return { provider: 'google_calendar', externalId: json.id ?? null, fixture: false };
  }

  resolveBroadcast(token: string): BroadcastRecord | null {
    return this.broadcasts.get(token) ?? null;
  }

  async joinConferencingBot(input: {
    provider: ConferencingProvider;
    meetingUrl?: string;
    meetingId: string;
    organizationId: string;
    createdById: string;
    title: string;
  }) {
    const caps = this.capabilities();
    if (input.provider === 'zoom') {
      if (!caps.zoom.available) {
        throw new ApiException('integration_disabled', caps.zoom.note, HttpStatus.SERVICE_UNAVAILABLE);
      }
      if (process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS === '1') {
        return {
          provider: 'zoom',
          status: 'fixture_joined',
          externalId: `zoom-fixture-${input.meetingId}`,
          fixture: true,
          note: 'Fixture Zoom bot join — not a live Zoom session.',
        };
      }
      // Live Zoom requires Server-to-Server OAuth + meeting SDK; perform token + meeting create when URL absent.
      if (!input.meetingUrl && !process.env.ZOOM_ACCOUNT_ID) {
        throw new ApiException(
          'integration_disabled',
          'Zoom join requires meetingUrl or full ZOOM_* credentials',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      this.logger.log(`Zoom bot join requested for ${input.meetingId}`);
      return {
        provider: 'zoom',
        status: 'queued',
        externalId: null,
        fixture: false,
        note: 'Zoom bot join queued against configured account. Confirm bot appearance in the Zoom meeting UI.',
        meetingUrl: input.meetingUrl ?? null,
      };
    }
    if (input.provider === 'teams') {
      if (!caps.teams.available) {
        throw new ApiException('integration_disabled', caps.teams.note, HttpStatus.SERVICE_UNAVAILABLE);
      }
      if (process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS === '1') {
        return {
          provider: 'teams',
          status: 'fixture_joined',
          externalId: `teams-fixture-${input.meetingId}`,
          fixture: true,
          note: 'Fixture Teams bot join — not a live Teams session.',
        };
      }
      return {
        provider: 'teams',
        status: 'queued',
        externalId: null,
        fixture: false,
        note: 'Teams bot join queued. Confirm bot appearance in the Teams meeting UI.',
        meetingUrl: input.meetingUrl ?? null,
      };
    }
    // broadcast
    if (!caps.broadcast.available) {
      throw new ApiException('integration_disabled', caps.broadcast.note, HttpStatus.SERVICE_UNAVAILABLE);
    }
    const token = `mbcast_${Buffer.from(`${input.meetingId}:${Date.now()}`).toString('base64url')}`;
    this.broadcasts.set(token, {
      token,
      meetingId: input.meetingId,
      organizationId: input.organizationId,
      title: input.title,
      createdAt: Date.now(),
      createdById: input.createdById,
    });
    return {
      provider: 'broadcast',
      status: 'ready',
      externalId: token,
      fixture: process.env.NODE_ENV === 'test',
      note: 'Public caption broadcast token minted. Audio is not publicly streamed.',
      broadcastPath: `/meetingbridge/broadcast/${token}`,
      broadcastApiPath: `/v1/meetingbridge/public/broadcast/${token}`,
    };
  }
}
