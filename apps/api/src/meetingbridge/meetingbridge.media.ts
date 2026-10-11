import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';

export type MediaMode = 'webrtc_mesh' | 'webrtc_sfu' | 'phrase_upload';

export type MediaCapability = {
  mode: MediaMode;
  provisioned: boolean;
  simultaneousInterpretation: boolean;
  signaling: 'rest_mesh' | 'livekit' | 'none';
  turn?: { urls: string[]; username?: string; credential?: string };
  note: string;
};

type SignalMessage = {
  id: string;
  meetingId: string;
  fromUserId: string;
  toUserId: string;
  kind: 'offer' | 'answer' | 'ice';
  payload: unknown;
  createdAt: number;
};

const SIGNAL_TTL_MS = 120_000;

@Injectable()
export class MeetingBridgeMediaService {
  private readonly signals = new Map<string, SignalMessage[]>();

  capability(): MediaCapability {
    const sfuUrl = process.env.MEETINGBRIDGE_MEDIA_URL?.trim();
    const simultaneous =
      process.env.MEETINGBRIDGE_SIMULTANEOUS === '1' && Boolean(sfuUrl || process.env.MEETINGBRIDGE_MESH === '1');
    const meshEnabled = process.env.MEETINGBRIDGE_MESH !== '0';
    const turnUrls = (process.env.MEETINGBRIDGE_TURN_URLS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (sfuUrl) {
      return {
        mode: 'webrtc_sfu',
        provisioned: true,
        simultaneousInterpretation: simultaneous,
        signaling: 'livekit',
        turn: turnUrls.length
          ? {
              urls: turnUrls,
              username: process.env.MEETINGBRIDGE_TURN_USERNAME,
              credential: process.env.MEETINGBRIDGE_TURN_CREDENTIAL,
            }
          : undefined,
        note: `SFU at MEETINGBRIDGE_MEDIA_URL. Simultaneous interpretation ${
          simultaneous ? 'enabled when corridor TTS is available' : 'gated (set MEETINGBRIDGE_SIMULTANEOUS=1)'
        }.`,
      };
    }

    if (meshEnabled) {
      return {
        mode: 'webrtc_mesh',
        provisioned: true,
        simultaneousInterpretation: process.env.MEETINGBRIDGE_SIMULTANEOUS === '1',
        signaling: 'rest_mesh',
        turn: turnUrls.length
          ? {
              urls: turnUrls,
              username: process.env.MEETINGBRIDGE_TURN_USERNAME,
              credential: process.env.MEETINGBRIDGE_TURN_CREDENTIAL,
            }
          : undefined,
        note:
          'Browser mesh WebRTC with authenticated REST signaling (up to max participants). Not an SFU; works without MEETINGBRIDGE_MEDIA_URL. Simultaneous listen-channel TTS requires MEETINGBRIDGE_SIMULTANEOUS=1.',
      };
    }

    return {
      mode: 'phrase_upload',
      provisioned: false,
      simultaneousInterpretation: false,
      signaling: 'none',
      note: 'Mesh disabled (MEETINGBRIDGE_MESH=0) and no SFU URL. Phrase-level turn-taking captions only.',
    };
  }

  mintRoomToken(input: {
    meetingId: string;
    userId: string;
    role: string;
    expiresInSeconds?: number;
  }) {
    const cap = this.capability();
    if (!cap.provisioned) {
      throw new ApiException(
        'media_unavailable',
        'No media path provisioned. Enable mesh (default) or set MEETINGBRIDGE_MEDIA_URL.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const exp = Math.floor(Date.now() / 1000) + Math.max(60, input.expiresInSeconds ?? 3600);
    const body = {
      meetingId: input.meetingId,
      userId: input.userId,
      role: input.role,
      mode: cap.mode,
      exp,
      nonce: randomBytes(8).toString('hex'),
    };

    if (cap.mode === 'webrtc_sfu') {
      const apiKey = process.env.MEETINGBRIDGE_LIVEKIT_API_KEY?.trim();
      const apiSecret = process.env.MEETINGBRIDGE_LIVEKIT_API_SECRET?.trim();
      if (apiKey && apiSecret) {
        // Minimal LiveKit-compatible video grant JWT (HS256).
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(
          JSON.stringify({
            iss: apiKey,
            sub: input.userId,
            nbf: Math.floor(Date.now() / 1000) - 10,
            exp,
            video: {
              roomJoin: true,
              room: input.meetingId,
              canPublish: true,
              canSubscribe: true,
            },
            metadata: JSON.stringify({ role: input.role }),
          }),
        ).toString('base64url');
        const data = `${header}.${payload}`;
        const sig = createHmac('sha256', apiSecret).update(data).digest('base64url');
        return {
          token: `${data}.${sig}`,
          expiresAt: new Date(exp * 1000).toISOString(),
          mediaUrl: process.env.MEETINGBRIDGE_MEDIA_URL!.trim(),
          mode: cap.mode as MediaMode,
          iceServers: this.iceServers(cap),
        };
      }
      // Opaque HMAC token for custom SFU frontends.
      const opaque = this.signOpaque(body);
      return {
        token: opaque,
        expiresAt: new Date(exp * 1000).toISOString(),
        mediaUrl: process.env.MEETINGBRIDGE_MEDIA_URL!.trim(),
        mode: cap.mode as MediaMode,
        iceServers: this.iceServers(cap),
      };
    }

    return {
      token: this.signOpaque(body),
      expiresAt: new Date(exp * 1000).toISOString(),
      mediaUrl: null,
      mode: cap.mode as MediaMode,
      iceServers: this.iceServers(cap),
    };
  }

  verifyRoomToken(token: string, meetingId: string, userId: string) {
    const body = this.verifyOpaque(token);
    if (body.meetingId !== meetingId || body.userId !== userId) {
      throw new ApiException('forbidden', 'Media token mismatch', HttpStatus.FORBIDDEN);
    }
    if (body.exp < Math.floor(Date.now() / 1000)) {
      throw new ApiException('token_expired', 'Media token expired', HttpStatus.GONE);
    }
    return body;
  }

  postSignal(input: {
    meetingId: string;
    fromUserId: string;
    toUserId: string;
    kind: 'offer' | 'answer' | 'ice';
    payload: unknown;
    token: string;
  }) {
    this.verifyRoomToken(input.token, input.meetingId, input.fromUserId);
    const msg: SignalMessage = {
      id: `sig_${randomBytes(8).toString('hex')}`,
      meetingId: input.meetingId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      kind: input.kind,
      payload: input.payload,
      createdAt: Date.now(),
    };
    const key = input.meetingId;
    const list = this.signals.get(key) ?? [];
    list.push(msg);
    this.signals.set(key, list);
    this.gc(key);
    return { id: msg.id, accepted: true };
  }

  pullSignals(input: { meetingId: string; userId: string; token: string; afterId?: string }) {
    this.verifyRoomToken(input.token, input.meetingId, input.userId);
    this.gc(input.meetingId);
    const list = this.signals.get(input.meetingId) ?? [];
    let start = 0;
    if (input.afterId) {
      const idx = list.findIndex((m) => m.id === input.afterId);
      start = idx >= 0 ? idx + 1 : 0;
    }
    const messages = list.slice(start).filter((m) => m.toUserId === input.userId || m.toUserId === '*');
    return { messages, media: this.capability() };
  }

  private iceServers(cap: MediaCapability) {
    const servers: { urls: string | string[]; username?: string; credential?: string }[] = [
      { urls: 'stun:stun.l.google.com:19302' },
    ];
    if (cap.turn?.urls?.length) {
      servers.push({
        urls: cap.turn.urls,
        username: cap.turn.username,
        credential: cap.turn.credential,
      });
    }
    return servers;
  }

  private signingKey() {
    return (
      process.env.MEETINGBRIDGE_MEDIA_SIGNING_KEY?.trim() ||
      process.env.MEETINGBRIDGE_LIVEKIT_API_SECRET?.trim() ||
      'meetingbridge-dev-media-key'
    );
  }

  private signOpaque(body: Record<string, unknown>) {
    const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
    const sig = createHmac('sha256', this.signingKey()).update(payload).digest('base64url');
    return `mbmedia.${payload}.${sig}`;
  }

  private verifyOpaque(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 'mbmedia') {
      throw new ApiException('unauthorized', 'Invalid media token', HttpStatus.UNAUTHORIZED);
    }
    const [, payload, sig] = parts;
    const expected = createHmac('sha256', this.signingKey()).update(payload!).digest('base64url');
    const a = Buffer.from(sig!);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ApiException('unauthorized', 'Invalid media token signature', HttpStatus.UNAUTHORIZED);
    }
    return JSON.parse(Buffer.from(payload!, 'base64url').toString('utf8')) as {
      meetingId: string;
      userId: string;
      role: string;
      mode: string;
      exp: number;
    };
  }

  private gc(meetingId: string) {
    const list = this.signals.get(meetingId);
    if (!list) return;
    const cutoff = Date.now() - SIGNAL_TTL_MS;
    const next = list.filter((m) => m.createdAt >= cutoff);
    if (next.length) this.signals.set(meetingId, next);
    else this.signals.delete(meetingId);
  }
}
