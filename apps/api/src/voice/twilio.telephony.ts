import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';

export type TwilioCallResult = {
  sid: string;
  status: string;
};

export type TelephonyClient = {
  createOutboundCall(input: {
    to: string;
    from: string;
    url: string;
  }): Promise<TwilioCallResult>;
  downloadRecording(url: string): Promise<{ buffer: Buffer; contentType: string; filename: string }>;
};

class HttpTwilioClient implements TelephonyClient {
  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
  ) {}

  private authHeader {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;
  }

  async createOutboundCall(input: {
    to: string;
    from: string;
    url: string;
  }): Promise<TwilioCallResult> {
    const body = new URLSearchParams({
      To: input.to,
      From: input.from,
      Url: input.url,
      Method: 'POST',
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    const json = (await res.json) as { sid?: string; status?: string; message?: string };
    if (!res.ok || !json.sid) {
      throw new Error(json.message ?? `Twilio create call failed (${res.status})`);
    }
    return { sid: json.sid, status: json.status ?? 'queued' };
  }

  async downloadRecording(url: string): Promise<{
    buffer: Buffer;
    contentType: string;
    filename: string;
  }> {
    const withExt = url.includes('.') ? url : `${url}.wav`;
    const res = await fetch(withExt, {
      headers: { Authorization: this.authHeader },
    });
    if (!res.ok) {
      throw new Error(`Failed to download Twilio recording (${res.status})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer);
    const contentType = res.headers.get('content-type') || 'audio/wav';
    const filename = withExt.toLowerCase.includes('.mp3') ? 'recording.mp3' : 'recording.wav';
    return { buffer, contentType, filename };
  }
}

@Injectable
export class TwilioTelephonyService {
  private client: TelephonyClient | null = null;

  /** Test hook — inject fixture client. */
  setClientForTests(client: TelephonyClient | null) {
    this.client = client;
  }

  disabled {
    return process.env.VOICE_AGENT_DISABLED === '1';
  }

  accountSid {
    return process.env.TWILIO_ACCOUNT_SID?.trim || '';
  }

  authToken {
    return process.env.TWILIO_AUTH_TOKEN?.trim || '';
  }

  phoneNumber {
    return process.env.TWILIO_PHONE_NUMBER?.trim || '';
  }

  webhookBaseUrl {
    return (process.env.TWILIO_WEBHOOK_BASE_URL ?? process.env.API_PUBLIC_URL ?? '')
      .trim
      .replace(/\/$/, '');
  }

  isConfigured {
    return Boolean(this.accountSid && this.authToken && this.phoneNumber);
  }

  private resolveClient: TelephonyClient {
    if (this.client) return this.client;
    if (!this.isConfigured) {
      throw new ApiException(
        'provider_not_configured',
        'Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return new HttpTwilioClient(this.accountSid, this.authToken);
  }

  assertLiveReady {
    if (this.disabled) {
      throw new ApiException(
        'provider_disabled',
        'Voice agent is disabled (VOICE_AGENT_DISABLED=1).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!this.isConfigured && !this.client) {
      throw new ApiException(
        'provider_not_configured',
        'Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  createOutboundCall(input: { to: string; url: string }) {
    this.assertLiveReady;
    const from = this.phoneNumber;
    if (!from && !this.client) {
      throw new ApiException(
        'provider_not_configured',
        'TWILIO_PHONE_NUMBER is required for outbound calls',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return this.resolveClient.createOutboundCall({
      to: input.to,
      from: from || '+15555550100',
      url: input.url,
    });
  }

  downloadRecording(url: string) {
    return this.resolveClient.downloadRecording(url);
  }
}
