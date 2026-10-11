import { DISABLED_DOMAINS, RELAY_CORRIDORS, RELAY_DOMAINS, relaySetupBufferMinutes } from './relay.types';

export function corridorOrNull(id: string) {
  return RELAY_CORRIDORS.find((c) => c.id === id) ?? null;
}

export function assertGeneralDomain(category: string): { ok: true } | { ok: false; reason: string } {
  if ((DISABLED_DOMAINS as readonly string[]).includes(category)) {
    return {
      ok: false,
      reason: `${category} interpretation is disabled until domain credentials and jurisdiction review are complete.`,
    };
  }
  if (!(RELAY_DOMAINS as readonly string[]).includes(category)) {
    return { ok: false, reason: `Unsupported category ${category}` };
  }
  return { ok: true };
}

/** Reject overlapping intervals including setup buffer. */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
  bufferMinutes = relaySetupBufferMinutes(),
): boolean {
  const bufMs = bufferMinutes * 60_000;
  const as = aStart.getTime() - bufMs;
  const ae = aEnd.getTime() + bufMs;
  const bs = bStart.getTime();
  const be = bEnd.getTime();
  return as < be && bs < ae;
}

export function resolvePreferredWindow(input: {
  preferredStartAt: Date;
  durationMinutes: number;
  timezone: string;
}): { startAt: Date; endAt: Date; displayTimezone: string } {
  const start = new Date(input.preferredStartAt);
  if (Number.isNaN(start.getTime())) {
    throw new Error('invalid_preferred_start');
  }
  // Explicit UTC storage; display timezone carried separately for UI.
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  return { startAt: start, endAt: end, displayTimezone: input.timezone };
}

export type MatchCandidate = {
  interpreterId: string;
  slotId: string;
  supplyKind: string;
  status: string;
  domains: string[];
  languagePairs: { source: string; target: string }[];
  startAt: Date;
  endAt: Date;
  state: string;
};

export function selectMatch(input: {
  sourceLanguage: string;
  targetLanguage: string;
  category: string;
  windowStart: Date;
  windowEnd: Date;
  candidates: MatchCandidate[];
}): MatchCandidate | null {
  const eligible = input.candidates.filter((c) => {
    if (c.status !== 'approved') return false;
    if (c.state !== 'open') return false;
    if (!c.domains.includes(input.category)) return false;
    const pairOk = c.languagePairs.some(
      (p) =>
        (p.source === input.sourceLanguage && p.target === input.targetLanguage) ||
        (p.source === input.targetLanguage && p.target === input.sourceLanguage),
    );
    if (!pairOk) return false;
    // Slot must fully cover requested window
    if (c.startAt.getTime() > input.windowStart.getTime()) return false;
    if (c.endAt.getTime() < input.windowEnd.getTime()) return false;
    return true;
  });
  // Deterministic: earliest slot start, then interpreter id
  eligible.sort((a, b) => {
    const t = a.startAt.getTime() - b.startAt.getTime();
    if (t !== 0) return t;
    return a.interpreterId.localeCompare(b.interpreterId);
  });
  return eligible[0] ?? null;
}

export function quoteHash(input: {
  currency: string;
  amountMinor: number;
  minimumMinutes: number;
  billingIncrementMin: number;
  includedMinutes: number;
  overrunCeilingMinor: number | null;
  taxesFeesMinor: number;
  cancellationTerms: string;
  version: string;
}): string {
  return [
    input.currency,
    input.amountMinor,
    input.minimumMinutes,
    input.billingIncrementMin,
    input.includedMinutes,
    input.overrunCeilingMinor ?? 'none',
    input.taxesFeesMinor,
    input.cancellationTerms,
    input.version,
  ].join('|');
}
