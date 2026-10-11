import { Injectable } from '@nestjs/common';
import { mintJoinToken, verifyJoinToken } from './relay.hash';

@Injectable()
export class RelayAdapters {
  private mediaSecret(): string {
    return (
      process.env.RELAY_MEDIA_SIGNING_KEY?.trim() ||
      process.env.MEETINGBRIDGE_MEDIA_SIGNING_KEY?.trim() ||
      'relay-local-media-secret-not-for-production'
    );
  }

  issueJoinToken(input: {
    bookingId: string;
    roomId: string;
    actorId: string;
    role: 'requester' | 'interpreter' | 'participant';
    ttlMs?: number;
  }) {
    const expiresAtMs = Date.now() + (input.ttlMs ?? 60 * 60 * 1000);
    const token = mintJoinToken({
      ...input,
      expiresAtMs,
      secret: this.mediaSecret(),
    });
    return {
      token,
      expiresAt: new Date(expiresAtMs).toISOString(),
      mediaMode: 'browser_audio' as const,
      note: 'Room token is bound to booking, role and expiry. Not end-to-end encrypted if server processing is used.',
    };
  }

  verifyJoinToken(token: string) {
    return verifyJoinToken(token, this.mediaSecret());
  }

  /** In-app notification only — never external send during unauthorized development. */
  notifyInApp(input: { organizationId: string; userId: string; title: string; body: string }) {
    return {
      channel: 'in_app' as const,
      delivered: false,
      queued: true,
      ...input,
      note: 'External messaging is not provisioned. Due items stay in-app / ops dashboard.',
    };
  }

  paymentMode() {
    const processor = Boolean(process.env.RELAY_PAYMENT_PROCESSOR_URL?.trim());
    return {
      mode: processor ? ('deferred_processor' as const) : ('manual_invoice' as const),
      processorIntegrated: processor,
      note: processor
        ? 'Processor URL present — still requires authorized webhook reconciliation before capture.'
        : 'Manual invoice / enterprise billing only. No card capture or interpreter payouts.',
    };
  }
}
