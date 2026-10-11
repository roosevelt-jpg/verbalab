import { createHash, randomBytes } from 'crypto';

export function hashText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function mintEventId(prefix = 'relay'): string {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(6).toString('hex')}`;
}

export function mintRoomId(): string {
  return `relay_room_${randomBytes(12).toString('hex')}`;
}

export function mintJoinToken(input: {
  bookingId: string;
  roomId: string;
  actorId: string;
  role: string;
  expiresAtMs: number;
  secret: string;
}): string {
  const payload = [
    input.bookingId,
    input.roomId,
    input.actorId,
    input.role,
    String(input.expiresAtMs),
  ].join('|');
  const sig = createHash('sha256').update(`${payload}|${input.secret}`).digest('hex').slice(0, 32);
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

export function verifyJoinToken(
  token: string,
  secret: string,
): { bookingId: string; roomId: string; actorId: string; role: string; expiresAtMs: number } | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split('|');
    if (parts.length !== 6) return null;
    const bookingId = parts[0];
    const roomId = parts[1];
    const actorId = parts[2];
    const role = parts[3];
    const expiresAtMs = parts[4];
    const sig = parts[5];
    if (!bookingId || !roomId || !actorId || !role || !expiresAtMs || !sig) return null;
    const payload = [bookingId, roomId, actorId, role, expiresAtMs].join('|');
    const expect = createHash('sha256')
      .update(`${payload}|${secret}`)
      .digest('hex')
      .slice(0, 32);
    if (sig !== expect) return null;
    const exp = Number(expiresAtMs);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    return { bookingId, roomId, actorId, role, expiresAtMs: exp };
  } catch {
    return null;
  }
}
