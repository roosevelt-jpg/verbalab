import { createHash } from 'crypto';

export function contentHash(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(`voicebridge-invite:${token}`).digest('hex');
}
