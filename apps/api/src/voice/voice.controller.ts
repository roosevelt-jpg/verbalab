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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
import { VoiceAgentService } from './voice-agent.service';
import { TwilioTelephonyService } from './twilio.telephony';
import { VoiceAudioStore } from './voice-audio.store';
import { parseFormBody, verifyTwilioSignature } from './twilio-signature';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { PrismaService } from '../prisma/prisma.service';
import { audioMaxBytes } from '../audio/audio.service';
import { defaultFaqVoice } from './faq-prompt';

@Controller('v1/voice')
export class VoiceController {
  constructor(
    private readonly agent: VoiceAgentService,
    private readonly twilio: TwilioTelephonyService,
    private readonly clips: VoiceAudioStore,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  @UseGuards(ClerkAuthGuard)
  status() {
    const base = this.twilio.webhookBaseUrl();
    return {
      provider: 'twilio',
      disabled: this.twilio.disabled(),
      twilioConfigured: this.twilio.isConfigured(),
      authTokenConfigured: Boolean(this.twilio.authToken()),
      phoneNumberConfigured: Boolean(this.twilio.phoneNumber()),
      webhookBaseConfigured: Boolean(base),
      defaultVoice: defaultFaqVoice(),
      inboundUrl: base ? `${base}/v1/voice/twilio/inbound` : null,
      turnUrl: base ? `${base}/v1/voice/twilio/turn` : null,
      demoOrgConfigured: Boolean(process.env.VOICE_DEMO_ORG_ID?.trim()),
      demoWorkspaceConfigured: Boolean(process.env.VOICE_DEMO_WORKSPACE_ID?.trim()),
    };
  }

  /** Console / CI path — text or audio → FAQ reply + TTS. */
  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  async simulate(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      text?: string;
      voice?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    if (this.twilio.disabled()) {
      throw new ApiException(
        'provider_disabled',
        'Voice agent is disabled (VOICE_AGENT_DISABLED=1).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return this.agent.turn({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      file,
      text: body.text,
      voice: body.voice,
      format: body.format,
    });
  }

  @Post('calls')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ClerkAuthGuard)
  async outbound(
    @CurrentSession() session: SessionContext,
    @Body() body: { to?: string },
  ) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can place outbound demo calls',
        HttpStatus.FORBIDDEN,
      );
    }
    const to = body.to?.trim() ?? '';
    if (!/^\+[1-9]\d{6,14}$/.test(to)) {
      throw new ApiException(
        'validation_error',
        'to must be an E.164 phone number (e.g. +15551234567)',
        HttpStatus.BAD_REQUEST,
      );
    }
    const base = this.twilio.webhookBaseUrl();
    if (!base) {
      throw new ApiException(
        'provider_not_configured',
        'TWILIO_WEBHOOK_BASE_URL (or API_PUBLIC_URL) is required for outbound calls',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const call = await this.twilio.createOutboundCall({
      to,
      url: `${base}/v1/voice/twilio/inbound`,
    });
    return {
      sid: call.sid,
      status: call.status,
      to,
      from: this.twilio.phoneNumber() || null,
    };
  }

  @Post('twilio/inbound')
  @HttpCode(HttpStatus.OK)
  async inbound(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-signature') signature: string | undefined,
  ) {
    this.assertTwilioRequest(req, signature);
    const turnUrl = this.absoluteWebhookPath('/v1/voice/twilio/turn');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Welcome to Lugemi FAQ. Ask your question after the beep, in English or Kiswahili.</Say>
  <Record maxLength="45" playBeep="true" action="${escapeXml(turnUrl)}" method="POST" />
</Response>`;
    res.type('text/xml').send(twiml);
  }

  @Post('twilio/turn')
  @HttpCode(HttpStatus.OK)
  async turn(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-signature') signature: string | undefined,
  ) {
    const params = this.assertTwilioRequest(req, signature);
    const { organizationId, workspaceId } = await this.resolveDemoTenant();
    const recordingUrl = params.RecordingUrl?.trim();
    const base = this.twilio.webhookBaseUrl();
    const turnUrl = this.absoluteWebhookPath('/v1/voice/twilio/turn');

    if (!recordingUrl) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I did not catch that. Please try again after the beep.</Say>
  <Record maxLength="45" playBeep="true" action="${escapeXml(turnUrl)}" method="POST" />
</Response>`;
      res.type('text/xml').send(twiml);
      return;
    }

    try {
      const recording = await this.twilio.downloadRecording(recordingUrl);
      const file = {
        fieldname: 'file',
        originalname: recording.filename,
        encoding: '7bit',
        mimetype: recording.contentType,
        size: recording.buffer.length,
        buffer: recording.buffer,
        destination: '',
        filename: recording.filename,
        path: '',
        stream: undefined as never,
      } as Express.Multer.File;

      const result = await this.agent.turn({
        organizationId,
        workspaceId,
        file,
      });

      const playUrl = base ? `${base}/v1/voice/audio/${result.audioId}` : null;
      const playOrSay = playUrl
        ? `<Play>${escapeXml(playUrl)}</Play>`
        : `<Say>${escapeXml(result.replyText.slice(0, 500))}</Say>`;

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${playOrSay}
  <Pause length="1"/>
  <Say>Ask another question after the beep, or hang up.</Say>
  <Record maxLength="45" playBeep="true" action="${escapeXml(turnUrl)}" method="POST" />
</Response>`;
      res.type('text/xml').send(twiml);
    } catch {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, I could not answer just now. Please try again later.</Say>
</Response>`;
      res.type('text/xml').send(twiml);
    }
  }

  @Get('audio/:id')
  audio(@Param('id') id: string, @Res() res: Response) {
    const clip = this.clips.get(id);
    if (!clip) {
      throw new ApiException('not_found', 'Audio clip expired or missing', HttpStatus.NOT_FOUND);
    }
    res.setHeader('Content-Type', clip.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(clip.buffer);
  }

  private assertTwilioRequest(req: Request, signature: string | undefined): Record<string, string> {
    if (this.twilio.disabled()) {
      throw new ApiException(
        'provider_disabled',
        'Voice agent is disabled (VOICE_AGENT_DISABLED=1).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const authToken = this.twilio.authToken();
    if (!authToken) {
      throw new ApiException(
        'provider_not_configured',
        'TWILIO_AUTH_TOKEN is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const raw =
      typeof rawBody !== 'undefined'
        ? Buffer.isBuffer(rawBody)
          ? rawBody.toString('utf8')
          : String(rawBody)
        : typeof req.body === 'string'
          ? req.body
          : '';

    const params =
      raw && raw.includes('=')
        ? parseFormBody(raw)
        : Object.fromEntries(
            Object.entries((req.body ?? {}) as Record<string, unknown>).map(([k, v]) => [
              k,
              v == null ? '' : String(v),
            ]),
          );

    const url = this.requestUrl(req);
    const ok = verifyTwilioSignature({
      authToken,
      signature,
      url,
      params,
    });
    if (!ok) {
      throw new ApiException('unauthorized', 'Invalid Twilio signature', HttpStatus.UNAUTHORIZED);
    }
    return params;
  }

  private requestUrl(req: Request): string {
    const base = this.twilio.webhookBaseUrl();
    if (base) {
      const path = req.path.startsWith('/') ? req.path : `/${req.path}`;
      return `${base}${path}`;
    }
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    return `${proto}://${host}${req.originalUrl.split('?')[0]}`;
  }

  private absoluteWebhookPath(path: string): string {
    const base = this.twilio.webhookBaseUrl();
    if (!base) {
      throw new ApiException(
        'provider_not_configured',
        'TWILIO_WEBHOOK_BASE_URL (or API_PUBLIC_URL) is required for Twilio webhooks',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return `${base}${path}`;
  }

  private async resolveDemoTenant(): Promise<{ organizationId: string; workspaceId: string }> {
    const organizationId = process.env.VOICE_DEMO_ORG_ID?.trim() ?? '';
    const workspaceId = process.env.VOICE_DEMO_WORKSPACE_ID?.trim() ?? '';
    if (!organizationId || !workspaceId) {
      throw new ApiException(
        'provider_not_configured',
        'Set VOICE_DEMO_ORG_ID and VOICE_DEMO_WORKSPACE_ID for Twilio call metering.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId },
      select: { id: true },
    });
    if (!workspace) {
      throw new ApiException(
        'provider_not_configured',
        'VOICE_DEMO_ORG_ID / VOICE_DEMO_WORKSPACE_ID do not match a workspace',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { organizationId, workspaceId };
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
