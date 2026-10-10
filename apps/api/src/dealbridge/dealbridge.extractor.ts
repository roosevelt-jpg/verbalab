import { DEALBRIDGE_EXTRACTOR_VERSION, NormalizedTerms } from './dealbridge.types';
import { decimalMul, emptyTerms, recomputeUnresolved, setByPath } from './dealbridge.terms';

export type ExtractionCandidate = {
  field: string;
  value: unknown;
  sourceSpanIds: string[];
  speakerId: string;
  confidence: number;
  uncertaintyReason: string | null;
  extractorVersion: string;
};

const PROMPT_INJECTION =
  /\b(ignore (your|all) rules|confirm the deal|system prompt|override instructions)\b/i;

/**
 * Constrained, deterministic extractor for the wholesale_rice pilot.
 * Treats conversation text as untrusted data — never executes embedded instructions.
 */
export function extractTermCandidates(input: {
  texts: Array<{ turnId: string; speakerId: string; text: string }>;
  timeZone: string;
  category: string;
}): { candidates: ExtractionCandidate[]; terms: NormalizedTerms; rejectedInstructions: string[] } {
  let terms = emptyTerms(input.timeZone);
  const candidates: ExtractionCandidate[] = [];
  const rejectedInstructions: string[] = [];

  for (const turn of input.texts) {
    const text = turn.text.trim();
    if (!text) continue;
    if (PROMPT_INJECTION.test(text)) {
      rejectedInstructions.push(turn.turnId);
      continue;
    }

    const push = (field: string, value: unknown, confidence: number, reason: string | null = null) => {
      candidates.push({
        field,
        value,
        sourceSpanIds: [turn.turnId],
        speakerId: turn.speakerId,
        confidence,
        uncertaintyReason: reason,
        extractorVersion: DEALBRIDGE_EXTRACTOR_VERSION,
      });
      terms = setByPath(terms, field, value);
    };

    const rice = text.match(/\b(\d+)\s*(bags?|sacs?)\b(?:\s+of)?\s*(?:(\d+)\s*(kg|kilos?))?\s*(rice|riz)?/i);
    if (rice) {
      push('quantity.value', rice[1]!, 0.92);
      push('quantity.unit', /sac/i.test(rice[2]!) ? 'bag' : 'bag', 0.9);
      if (rice[3]) {
        push('quantity.packageSize.value', rice[3], 0.88);
        push('quantity.packageSize.unit', 'kg', 0.88);
      }
      if (rice[5] || /rice|riz/i.test(text)) {
        push('product.description', /riz/i.test(text) ? 'Riz' : 'Rice', 0.9);
      }
    } else if (/\brice\b|\briz\b/i.test(text)) {
      push('product.description', /riz/i.test(text) ? 'Riz' : 'Rice', 0.75, 'product_only');
    }

    const price = text.match(
      /\b(?:GHS|CFA|XOF|USD|EUR|NGN|KES|₵)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:GHS|CFA|XOF|USD|EUR|NGN|KES|₵)?\s*(?:per|\/|par)\s*(bag|sac|kg)/i,
    );
    if (price) {
      const currencyMatch = text.match(/\b(GHS|XOF|USD|EUR|NGN|KES)\b/i) || text.match(/₵/);
      const currency = currencyMatch
        ? currencyMatch[0] === '₵'
          ? 'GHS'
          : currencyMatch[0]!.toUpperCase() === 'CFA'
            ? 'XOF'
            : currencyMatch[0]!.toUpperCase()
        : null;
      if (currency) push('pricing.currency', currency, 0.9);
      else push('pricing.currency', null, 0.2, 'ambiguous_currency_symbol');
      push('pricing.unitPrice', price[1]!, 0.9);
      push('pricing.basis', 'per_bag', 0.85);
    }

    const total = text.match(/\btotal\s*(?:of|:)?\s*(?:GHS|XOF|USD|EUR)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (total) push('pricing.total', total[1]!, 0.85);

    const deliveryDate = text.match(
      /\b(20\d{2}-\d{2}-\d{2})\b|\b(?:on|for|by)\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2})\b/i,
    );
    if (deliveryDate) {
      const raw = deliveryDate[1] || deliveryDate[2]!;
      push('delivery.date', normalizeDate(raw), 0.8, deliveryDate[2] ? 'parsed_calendar_phrase' : null);
    }
    if (/\bnext friday\b/i.test(text)) {
      push('delivery.date', null, 0.1, 'relative_date_needs_confirmation');
    }

    const location = text.match(
      /\b(?:deliver(?:y|ed)?|livraison)\s+(?:to|at|à)?\s+([^,.]+)/i,
    );
    if (location) {
      push('delivery.location', location[1]!.trim(), 0.7, 'location_needs_confirmation');
      push('delivery.locationConfirmed', false, 0.7);
    }

    if (/\bshipping included\b|\blivraison incluse\b/i.test(text)) {
      push('pricing.shippingIncluded', true, 0.85);
    } else if (/\bshipping excluded\b|\bexcluding shipping\b|\bhors livraison\b/i.test(text)) {
      push('pricing.shippingIncluded', false, 0.85);
    }

    if (/\bon delivery\b|\bà la livraison\b|\bcash on delivery\b/i.test(text)) {
      push('payment.dueCondition', 'on_delivery', 0.85);
    } else if (/\bdeposit\b|\bacompte\b/i.test(text)) {
      push('payment.dueCondition', 'deposit_required', 0.7, 'deposit_details_incomplete');
    }

    if (/\bmobile money\b|\bmomo\b|\bbank transfer\b|\bvirement\b/i.test(text)) {
      const method = /\bmobile money\b|\bmomo\b/i.test(text) ? 'mobile_money' : 'bank_transfer';
      push('payment.method', method, 0.8);
    }

    if (/\btax (?:included|exclusive|excluded)\b|\bTVA\b/i.test(text)) {
      const treatment = /\bincluded\b|\bincluse\b/i.test(text)
        ? 'included'
        : /\bexclusive|excluded|hors\b/i.test(text)
          ? 'excluded'
          : 'unresolved';
      push('pricing.taxTreatment', treatment, treatment === 'unresolved' ? 0.3 : 0.8);
    }
  }

  if (
    terms.quantity.value &&
    terms.pricing.unitPrice &&
    !terms.pricing.total &&
    isFiniteNumber(terms.quantity.value) &&
    isFiniteNumber(terms.pricing.unitPrice)
  ) {
    const total = decimalMul(terms.quantity.value, terms.pricing.unitPrice);
    candidates.push({
      field: 'pricing.total',
      value: total,
      sourceSpanIds: [],
      speakerId: input.texts[0]?.speakerId ?? 'system',
      confidence: 0.95,
      uncertaintyReason: 'computed_from_quantity_and_unit_price',
      extractorVersion: DEALBRIDGE_EXTRACTOR_VERSION,
    });
    terms = setByPath(terms, 'pricing.total', total);
  }

  terms = recomputeUnresolved(terms, input.category);
  return { candidates, terms, rejectedInstructions };
}

function isFiniteNumber(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function normalizeDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  return new Date(parsed).toISOString().slice(0, 10);
}
