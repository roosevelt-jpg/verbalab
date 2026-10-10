import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Request, Response } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { parseFormBody, verifyTwilioSignature } from '../voice/twilio-signature';
import { AccessLineService } from './accessline.service';

/**
 * Twilio webhooks for AccessLine.
 * Signature verification required. Tenant resolved from inbound To number only.
 * Without TWILIO_* configuration, returns provider_not_configured (503).
 */
@Controller('v1/accessline/twilio')
export class AccessLineTwilioController {
  constructor(
    private readonly accessline: AccessLineService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('inbound')
  @HttpCode(HttpStatus.OK)
  async inbound(
    @Req() req: Request & { rawBody?: Buffer },
    @Res() res: Response,
    @Headers('x-twilio-signature') signature?: string,
  ) {
    if (!this.accessline.twilioConfigured()) {
      throw new ApiException(
        'provider_not_configured',
        'AccessLine Twilio webhooks require TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and TWILIO_WEBHOOK_BASE_URL',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
    const base = process.env.TWILIO_WEBHOOK_BASE_URL!.replace(/\/$/, '');
    const url = `${base}/v1/accessline/twilio/inbound`;
    const raw = req.rawBody?.toString('utf8') ?? '';
    const params = parseFormBody(raw);
    if (!verifyTwilioSignature({ authToken, signature, url, params })) {
      throw new ApiException('unauthorized', 'Invalid Twilio signature', HttpStatus.UNAUTHORIZED);
    }

    const eventId = params.CallSid || createHash('sha256').update(raw).digest('hex');
    const dedup = await this.prisma.accessLineProviderEvent.findUnique({
      where: { providerEventId: `inbound:${eventId}` },
    });
    if (dedup) {
      res.type('text/xml').send(this.twimlSay('Please wait.'));
      return;
    }

    const to = params.To?.trim();
    if (!to) {
      throw new ApiException('validation_error', 'Missing To', HttpStatus.BAD_REQUEST);
    }
    const line = await this.accessline.resolveLineByNumber(to);
    if (!line || line.integrationMode !== 'twilio') {
      res.type('text/xml').send(this.twimlSay('This number is not configured for AccessLine.'));
      return;
    }

    await this.prisma.accessLineProviderEvent.create({
      data: {
        providerEventId: `inbound:${eventId}`,
        eventType: 'inbound',
        payloadHash: createHash('sha256').update(raw).digest('hex'),
      },
    });

    // Turn-based Gather — not marketed as real-time interpretation.
    const gatherUrl = `${base}/v1/accessline/twilio/gather`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Welcome to AccessLine. This is an AI assisted business service. Press 1 for Kiswahili, 2 for English, or 0 for a human agent.</Say>
  <Gather numDigits="1" action="${gatherUrl}" method="POST" timeout="8"/>
  <Say>We did not receive input. Goodbye.</Say>
</Response>`;
    res.type('text/xml').send(xml);
  }

  @Post('gather')
  @HttpCode(HttpStatus.OK)
  async gather(
    @Req() req: Request & { rawBody?: Buffer },
    @Res() res: Response,
    @Headers('x-twilio-signature') signature?: string,
  ) {
    if (!this.accessline.twilioConfigured()) {
      throw new ApiException(
        'provider_not_configured',
        'AccessLine Twilio webhooks require credentials',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
    const base = process.env.TWILIO_WEBHOOK_BASE_URL!.replace(/\/$/, '');
    const url = `${base}/v1/accessline/twilio/gather`;
    const raw = req.rawBody?.toString('utf8') ?? '';
    const params = parseFormBody(raw);
    if (!verifyTwilioSignature({ authToken, signature, url, params })) {
      throw new ApiException('unauthorized', 'Invalid Twilio signature', HttpStatus.UNAUTHORIZED);
    }
    const digits = params.Digits ?? '';
    // Live full dialogue orchestration remains on the simulator path until carrier pilot authorization.
    // Acknowledge DTMF honestly without inventing logistics status over the carrier path.
    if (digits === '0') {
      res.type('text/xml').send(this.twimlSay('Connecting you requires an allowlisted staff destination. Please try again during staffed hours or use the simulator console for pilot testing.'));
      return;
    }
    res
      .type('text/xml')
      .send(
        this.twimlSay(
          'AccessLine live carrier dialogue is gated pending pilot authorization. Use the AccessLine simulator for end-to-end delivery status testing.',
        ),
      );
  }

  @Post('status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async status(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-twilio-signature') signature?: string,
  ) {
    if (!this.accessline.twilioConfigured()) {
      throw new ApiException(
        'provider_not_configured',
        'AccessLine Twilio webhooks require credentials',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
    const base = process.env.TWILIO_WEBHOOK_BASE_URL!.replace(/\/$/, '');
    const url = `${base}/v1/accessline/twilio/status`;
    const raw = req.rawBody?.toString('utf8') ?? '';
    const params = parseFormBody(raw);
    if (!verifyTwilioSignature({ authToken, signature, url, params })) {
      throw new ApiException('unauthorized', 'Invalid Twilio signature', HttpStatus.UNAUTHORIZED);
    }
    const eventId = `${params.CallSid}:${params.CallStatus}:${params.Timestamp ?? ''}`;
    try {
      await this.prisma.accessLineProviderEvent.create({
        data: {
          providerEventId: `status:${eventId}`,
          eventType: `status:${params.CallStatus ?? 'unknown'}`,
          payloadHash: createHash('sha256').update(raw).digest('hex'),
        },
      });
    } catch {
      // Unique violation = replay; ignore
    }
  }

  private twimlSay(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escaped}</Say></Response>`;
  }
}
