import { createHash, randomBytes } from 'crypto';

export function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function contentHash(payload: unknown) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function mintInviteToken() {
  return `mb_inv_${randomBytes(24).toString('hex')}`;
}

export function mintEventId() {
  return `evt_${randomBytes(12).toString('hex')}`;
}

export function mintTurnId() {
  return `turn_${randomBytes(10).toString('hex')}`;
}
