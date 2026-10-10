import {
  DEALBRIDGE_SCHEMA_VERSION,
  NormalizedTerms,
  REQUIRED_FIELDS_BY_CATEGORY,
  SUPPORTED_CURRENCIES,
  SUPPORTED_UNITS,
} from './dealbridge.types';

/** Fixed-point decimal helpers using string scale (no floating money). */
export function isDecimalString(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function toScaled(value: string): { neg: boolean; digits: string; scale: number } {
  if (!isDecimalString(value)) throw new Error(`invalid_decimal:${value}`);
  const neg = value.startsWith('-');
  const raw = neg ? value.slice(1) : value;
  const [whole, frac = ''] = raw.split('.');
  return { neg, digits: `${whole}${frac}`.replace(/^0+(?=\d)/, '') || '0', scale: frac.length };
}

function fromScaled(neg: boolean, digits: string, scale: number): string {
  const d = digits.replace(/^0+(?=\d)/, '') || '0';
  if (scale <= 0) return `${neg ? '-' : ''}${d}`;
  const padded = d.padStart(scale + 1, '0');
  const whole = padded.slice(0, -scale) || '0';
  const frac = padded.slice(-scale).replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`;
}

export function decimalMul(a: string, b: string): string {
  const A = toScaled(a);
  const B = toScaled(b);
  const product = BigInt(A.digits) * BigInt(B.digits);
  const scale = A.scale + B.scale;
  const raw = fromScaled(A.neg !== B.neg, product.toString(), scale);
  // Preserve input fractional scale for money-friendly display (50 * 320.00 → 16000.00).
  if (scale > 0 && !raw.includes('.')) return `${raw}.${'0'.repeat(scale)}`;
  if (scale > 0 && raw.includes('.')) {
    const [w, f = ''] = raw.split('.');
    if (f.length < scale) return `${w}.${f.padEnd(scale, '0')}`;
  }
  return raw;
}

export function decimalEquals(a: string, b: string): boolean {
  const A = toScaled(a);
  const B = toScaled(b);
  const scale = Math.max(A.scale, B.scale);
  const aDigits = BigInt(A.digits) * 10n ** BigInt(scale - A.scale);
  const bDigits = BigInt(B.digits) * 10n ** BigInt(scale - B.scale);
  return A.neg === B.neg && aDigits === bDigits;
}

export function emptyTerms(timeZone = 'Africa/Accra'): NormalizedTerms {
  return {
    schemaVersion: DEALBRIDGE_SCHEMA_VERSION,
    product: { description: null, grade: null },
    quantity: { value: null, unit: null, packageSize: { value: null, unit: null } },
    pricing: {
      currency: null,
      unitPrice: null,
      total: null,
      basis: null,
      taxTreatment: null,
      shippingIncluded: null,
    },
    delivery: { date: null, timeZone, location: null, locationConfirmed: false },
    payment: { method: null, dueCondition: null, deposit: null },
    unresolvedFields: [],
  };
}

export function getByPath(terms: NormalizedTerms, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = terms;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function setByPath(terms: NormalizedTerms, path: string, value: unknown): NormalizedTerms {
  const clone = structuredClone(terms);
  const parts = path.split('.');
  let cur: Record<string, unknown> = clone as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
  return clone;
}

export function recomputeUnresolved(terms: NormalizedTerms, category: string): NormalizedTerms {
  const required = REQUIRED_FIELDS_BY_CATEGORY[category] ?? REQUIRED_FIELDS_BY_CATEGORY.wholesale_rice!;
  const unresolved = new Set(terms.unresolvedFields);
  for (const field of required) {
    const v = getByPath(terms, field);
    if (v == null || v === '' || v === 'unresolved') unresolved.add(field);
    else unresolved.delete(field);
  }
  if (terms.pricing.taxTreatment == null) unresolved.add('pricing.taxTreatment');
  if (terms.pricing.shippingIncluded == null) unresolved.add('pricing.shippingIncluded');
  if (terms.payment.method == null) unresolved.add('payment.method');
  return { ...terms, unresolvedFields: [...unresolved].sort() };
}

export function validateMoneyAndUnits(terms: NormalizedTerms): string[] {
  const errors: string[] = [];
  if (terms.pricing.currency && !SUPPORTED_CURRENCIES.includes(terms.pricing.currency as never)) {
    errors.push(`unsupported_currency:${terms.pricing.currency}`);
  }
  if (terms.quantity.unit && !SUPPORTED_UNITS.includes(terms.quantity.unit as never)) {
    errors.push(`unsupported_unit:${terms.quantity.unit}`);
  }
  if (terms.pricing.unitPrice && !isDecimalString(terms.pricing.unitPrice)) {
    errors.push('invalid_unit_price');
  }
  if (terms.pricing.total && !isDecimalString(terms.pricing.total)) {
    errors.push('invalid_total');
  }
  if (terms.quantity.value && !isDecimalString(terms.quantity.value)) {
    errors.push('invalid_quantity');
  }
  if (
    terms.quantity.value &&
    terms.pricing.unitPrice &&
    terms.pricing.total &&
    isDecimalString(terms.quantity.value) &&
    isDecimalString(terms.pricing.unitPrice) &&
    isDecimalString(terms.pricing.total)
  ) {
    const expected = decimalMul(terms.quantity.value, terms.pricing.unitPrice);
    if (!decimalEquals(expected, terms.pricing.total)) {
      errors.push('arithmetic_mismatch');
    }
  }
  return errors;
}

export function summarizeTerms(terms: NormalizedTerms, language: string): string {
  const qty = terms.quantity.value ?? '?';
  const unit = terms.quantity.unit ?? 'unit';
  const pkg =
    terms.quantity.packageSize.value && terms.quantity.packageSize.unit
      ? ` (${terms.quantity.packageSize.value} ${terms.quantity.packageSize.unit} each)`
      : '';
  const product = terms.product.description ?? 'goods';
  const currency = terms.pricing.currency ?? '?';
  const unitPrice = terms.pricing.unitPrice ?? '?';
  const total = terms.pricing.total ?? '?';
  const delivery = terms.delivery.date ?? 'unspecified date';
  const location = terms.delivery.location ?? 'location not specified';
  const payment = terms.payment.dueCondition ?? 'payment terms not specified';
  const shipping =
    terms.pricing.shippingIncluded == null
      ? 'shipping not specified'
      : terms.pricing.shippingIncluded
        ? 'shipping included'
        : 'shipping excluded';
  const tax = terms.pricing.taxTreatment ?? 'tax treatment not specified';

  if (language.startsWith('fr')) {
    return [
      `Proposition: ${qty} ${unit}${pkg} de ${product}.`,
      `Prix: ${unitPrice} ${currency} par ${unit}, total ${total} ${currency}.`,
      `Livraison: ${delivery}, lieu: ${location}.`,
      `Paiement: ${payment}. ${shipping}. Taxe: ${tax}.`,
      terms.unresolvedFields.length
        ? `Champs non résolus: ${terms.unresolvedFields.join(', ')}.`
        : 'Tous les champs requis sont renseignés.',
    ].join(' ');
  }

  return [
    `Proposal: ${qty} ${unit}${pkg} of ${product}.`,
    `Price: ${unitPrice} ${currency} per ${unit}, total ${total} ${currency}.`,
    `Delivery: ${delivery}, location: ${location}.`,
    `Payment: ${payment}. ${shipping}. Tax: ${tax}.`,
    terms.unresolvedFields.length
      ? `Unresolved fields: ${terms.unresolvedFields.join(', ')}.`
      : 'All required fields are set.',
  ].join(' ');
}
