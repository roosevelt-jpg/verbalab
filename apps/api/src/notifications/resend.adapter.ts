import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { EmailProvider, SendEmailInput, SendEmailResult } from './email-provider';

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export class ResendAdapter implements EmailProvider {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'RESEND_API_KEY is not set. Add the key to enable email notifications.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!this.from) {
      throw new ApiException(
        'provider_not_configured',
        'EMAIL_FROM is not set. Add a verified From address for Resend.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const to = Array.isArray(input.to) ? input.to : [input.to];
    const response = await this.fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? undefined,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const json = (await response.json.catch( => ({}))) as ResendResponse;

    if (!response.ok) {
      const message = json.message ?? json.name ?? `Resend HTTP ${response.status}`;
      if (response.status === 429 || response.status >= 500) {
        throw new ApiException('provider_unavailable', message, HttpStatus.BAD_GATEWAY);
      }
      throw new ApiException('provider_error', message, HttpStatus.BAD_GATEWAY);
    }

    if (!json.id) {
      throw new ApiException(
        'provider_error',
        'Resend returned an empty response',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return { id: json.id, provider: this.name };
  }
}
