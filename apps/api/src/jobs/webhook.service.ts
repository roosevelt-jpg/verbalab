import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSigningSecret(organizationId: string): Promise<string> {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    if (org.webhookSigningSecret) {
      return org.webhookSigningSecret;
    }
    const secret = `whsec_${randomBytes(24).toString('base64url')}`;
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { webhookSigningSecret: secret },
    });
    return secret;
  }

  signPayload(secret: string, timestamp: string, body: string): string {
    const signed = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
    return `v1=${signed}`;
  }

  verifySignature(secret: string, timestamp: string, body: string, signatureHeader: string): boolean {
    const expected = this.signPayload(secret, timestamp, body);
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  async deliver(input: {
    organizationId: string;
    webhookUrl: string;
    event: string;
    data: unknown;
  }): Promise<{ ok: boolean; status?: number; error?: string }> {
    const secret = await this.ensureSigningSecret(input.organizationId);
    const timestamp = Math.floor(Date.now / 1000).toString;
    const payload = JSON.stringify({
      id: randomBytes(8).toString('hex'),
      event: input.event,
      created: Number(timestamp),
      data: input.data,
    });
    const signature = this.signPayload(secret, timestamp, payload);

    try {
      const response = await fetch(input.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Lugemi-Timestamp': timestamp,
          'X-Lugemi-Signature': signature,
          'User-Agent': 'Lugemi-Webhooks/1.0',
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        return { ok: false, status: response.status, error: `HTTP ${response.status}` };
      }
      return { ok: true, status: response.status };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Webhook delivery failed',
      };
    }
  }
}
