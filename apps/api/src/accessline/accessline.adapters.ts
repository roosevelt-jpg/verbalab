import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import type {
  DeliveryLookupResult,
  RegisteredContact,
  TransferDestination,
} from './accessline.types';

/** Fixture logistics catalog for the pilot simulator. Leading zeros preserved as strings. */
const FIXTURE_ORDERS: Record<
  string,
  { customerScope: string; status: DeliveryLookupResult['status']; updatedAt: string; eta: string | null }
> = {
  '00123456': {
    customerScope: 'cust_ke_demo_1',
    status: 'out_for_delivery',
    updatedAt: '2026-10-11T08:00:00.000Z',
    eta: null,
  },
  'AB-90001': {
    customerScope: 'cust_ke_demo_1',
    status: 'dispatched',
    updatedAt: '2026-10-10T14:30:00.000Z',
    eta: null,
  },
  '000777': {
    customerScope: 'cust_ke_demo_2',
    status: 'delivered',
    updatedAt: '2026-10-09T16:00:00.000Z',
    eta: null,
  },
};

@Injectable()
export class AccessLineAdapters {
  hashSecret(value: string): string {
    return createHash('sha256').update(`accessline-otp:${value}`).digest('hex');
  }

  verifySecret(value: string, hash: string): boolean {
    const a = Buffer.from(this.hashSecret(value));
    const b = Buffer.from(hash);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  maskDigits(digits: string): string {
    if (digits.length <= 2) return '*'.repeat(digits.length);
    return `${'*'.repeat(Math.max(0, digits.length - 2))}${digits.slice(-2)}`;
  }

  maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return `***${digits.slice(-4)}`;
  }

  /**
   * Simulator OTP for registered contacts only.
   * Does not send SMS/email — returns a labeled fixture code for local/demo.
   */
  issueSimulatorOtp(contact: RegisteredContact): { code: string; hash: string; mode: 'simulator' } {
    const code =
      contact.simulateOtpHint && /^\d{4,8}$/.test(contact.simulateOtpHint)
        ? contact.simulateOtpHint
        : String(randomInt(100000, 999999));
    return { code, hash: this.hashSecret(code), mode: 'simulator' };
  }

  lookupDelivery(input: {
    customerScope: string;
    orderReference: string;
    freshnessMinutes: number;
    now?: Date;
  }): DeliveryLookupResult {
    const ref = input.orderReference.trim();
    const row = FIXTURE_ORDERS[ref];
    if (!row) {
      return {
        status: 'not_found',
        updatedAt: null,
        estimatedDelivery: null,
        source: 'fixture_logistics_catalog',
        resultState: 'unavailable',
        orderReference: ref,
      };
    }
    if (row.customerScope !== input.customerScope) {
      // Same external message as not_found — no order enumeration.
      return {
        status: 'not_found',
        updatedAt: null,
        estimatedDelivery: null,
        source: 'fixture_logistics_catalog',
        resultState: 'inaccessible',
        orderReference: ref,
      };
    }
    const now = input.now ?? new Date();
    const updated = new Date(row.updatedAt);
    const ageMin = (now.getTime() - updated.getTime()) / 60_000;
    const freshness = ageMin > input.freshnessMinutes ? 'stale' : 'fresh';
    return {
      status: row.status,
      updatedAt: row.updatedAt,
      estimatedDelivery: row.eta,
      source: 'fixture_logistics_catalog',
      resultState: freshness,
      orderReference: ref,
    };
  }

  requestHash(tool: string, payload: unknown): string {
    return createHmac('sha256', 'accessline-tool')
      .update(JSON.stringify({ tool, payload }))
      .digest('hex')
      .slice(0, 32);
  }

  pickTransfer(
    destinations: TransferDestination[],
    destinationId?: string,
  ): TransferDestination | null {
    if (!destinations.length) return null;
    if (destinationId) {
      return destinations.find((d) => d.id === destinationId || d.destination === destinationId) ?? null;
    }
    return destinations[0] ?? null;
  }

  classifyIntent(text: string): {
    intent: 'delivery_status' | 'opening_hours' | 'repeat' | 'language_switch' | 'human_assistance' | 'unknown';
  } {
    const t = text.toLowerCase();
    if (/\b(agent|human|representative|mwakilishi|person|staff)\b/.test(t)) {
      return { intent: 'human_assistance' };
    }
    if (/\b(repeat|again|rudia|sema tena)\b/.test(t)) return { intent: 'repeat' };
    if (/\b(english|kiswahili|swahili|language|lugha)\b/.test(t)) return { intent: 'language_switch' };
    if (/\b(hour|open|fungua|closing|saa)\b/.test(t)) return { intent: 'opening_hours' };
    if (/\b(deliver|delivery|order|oda|parcel|package|status|hali|tracking)\b/.test(t)) {
      return { intent: 'delivery_status' };
    }
    return { intent: 'unknown' };
  }

  normalizeOrderReference(raw: string): string {
    // Preserve leading zeros and alphanumerics; strip spaces/dashes variants carefully.
    return raw.trim().replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }
}
