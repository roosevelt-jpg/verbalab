import { DEALBRIDGE_VERIFIER_VERSION, CheckState, NormalizedTerms } from './dealbridge.types';
import { decimalEquals, getByPath, isDecimalString } from './dealbridge.terms';

export type FieldComparison = {
  field: string;
  expected: string | null;
  observed: string | null;
  result: 'match' | 'mismatch' | 'missing' | 'uncertain';
  sourceTurnId?: string;
};

export type VerifyResult = {
  status: CheckState;
  comparisons: FieldComparison[];
  clarification: { field: string; questionIntent: string; question: string } | null;
  verifierVersion: string;
};

const CRITICAL_FIELDS = [
  'quantity.value',
  'pricing.currency',
  'pricing.unitPrice',
  'pricing.total',
  'delivery.date',
  'payment.dueCondition',
];

/**
 * Deterministic explain-back verifier. "Yes" alone never completes a check.
 * Semantic grade/obligation mismatches are marked uncertain for clarification.
 */
export function verifyExplainBack(input: {
  terms: NormalizedTerms;
  responseText: string;
  language: string;
}): VerifyResult {
  const response = input.responseText.trim();
  const comparisons: FieldComparison[] = [];

  if (!response) {
    return {
      status: 'not_assessed',
      comparisons: [],
      clarification: null,
      verifierVersion: DEALBRIDGE_VERIFIER_VERSION,
    };
  }

  if (/^(yes|oui|ok|okay|confirm|d'accord)\.?$/i.test(response)) {
    return {
      status: 'needs_clarification',
      comparisons: [
        {
          field: 'quantity.value',
          expected: String(getByPath(input.terms, 'quantity.value') ?? ''),
          observed: response,
          result: 'uncertain',
        },
      ],
      clarification: {
        field: 'quantity.value',
        questionIntent: 'confirm_quantity',
        question: questionFor('quantity.value', input.language),
      },
      verifierVersion: DEALBRIDGE_VERIFIER_VERSION,
    };
  }

  const observedQty = extractNumber(response);
  const expectedQty = String(getByPath(input.terms, 'quantity.value') ?? '');
  if (expectedQty) {
    if (observedQty == null) {
      comparisons.push({
        field: 'quantity.value',
        expected: expectedQty,
        observed: null,
        result: 'missing',
      });
    } else if (isDecimalString(expectedQty) && decimalEquals(expectedQty, observedQty)) {
      comparisons.push({
        field: 'quantity.value',
        expected: expectedQty,
        observed: observedQty,
        result: 'match',
      });
    } else {
      comparisons.push({
        field: 'quantity.value',
        expected: expectedQty,
        observed: observedQty,
        result: 'mismatch',
      });
    }
  }

  const expectedCurrency = String(getByPath(input.terms, 'pricing.currency') ?? '');
  if (expectedCurrency) {
    const currencyHit = new RegExp(`\\b${expectedCurrency}\\b`, 'i').test(response);
    comparisons.push({
      field: 'pricing.currency',
      expected: expectedCurrency,
      observed: currencyHit ? expectedCurrency : null,
      result: currencyHit ? 'match' : 'missing',
    });
  }

  const expectedUnitPrice = String(getByPath(input.terms, 'pricing.unitPrice') ?? '');
  if (expectedUnitPrice) {
    const observedPrice = extractNumberNear(response, /per\s*bag|\/\s*bag|unit/i) ?? extractNumber(response);
    const priceHit =
      response.includes(expectedUnitPrice) ||
      (observedPrice != null &&
        isDecimalString(expectedUnitPrice) &&
        isDecimalString(observedPrice) &&
        decimalEquals(expectedUnitPrice, observedPrice));
    comparisons.push({
      field: 'pricing.unitPrice',
      expected: expectedUnitPrice,
      observed: priceHit ? expectedUnitPrice : observedPrice,
      result: priceHit ? 'match' : 'missing',
    });
  }

  const expectedTotal = String(getByPath(input.terms, 'pricing.total') ?? '');
  if (expectedTotal) {
    const nums = [...response.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map((m) => m[1]!);
    const totalHit =
      response.includes(expectedTotal) ||
      nums.some(
        (n) =>
          isDecimalString(expectedTotal) && isDecimalString(n) && decimalEquals(expectedTotal, n),
      );
    comparisons.push({
      field: 'pricing.total',
      expected: expectedTotal,
      observed: totalHit ? expectedTotal : null,
      result: totalHit ? 'match' : 'missing',
    });
  }

  const expectedDate = String(getByPath(input.terms, 'delivery.date') ?? '');
  if (expectedDate) {
    const dateHit = response.includes(expectedDate);
    comparisons.push({
      field: 'delivery.date',
      expected: expectedDate,
      observed: dateHit ? expectedDate : null,
      result: dateHit ? 'match' : 'missing',
    });
  }

  const expectedPayment = String(getByPath(input.terms, 'payment.dueCondition') ?? '');
  if (expectedPayment) {
    const paymentHit =
      response.toLowerCase().includes(expectedPayment.replace(/_/g, ' ')) ||
      (expectedPayment === 'on_delivery' && /\bon\s+delivery\b|\bà la livraison\b/i.test(response));
    comparisons.push({
      field: 'payment.dueCondition',
      expected: expectedPayment,
      observed: paymentHit ? expectedPayment : null,
      result: paymentHit ? 'match' : 'missing',
    });
  }

  const mismatch = comparisons.find((c) => c.result === 'mismatch');
  if (mismatch) {
    return {
      status: 'needs_clarification',
      comparisons,
      clarification: {
        field: mismatch.field,
        questionIntent: `confirm_${mismatch.field.replace(/\./g, '_')}`,
        question: questionFor(mismatch.field, input.language),
      },
      verifierVersion: DEALBRIDGE_VERIFIER_VERSION,
    };
  }

  const missingCritical = CRITICAL_FIELDS.filter((field) => {
    const expected = getByPath(input.terms, field);
    if (expected == null || expected === '') return false;
    const cmp = comparisons.find((c) => c.field === field);
    return !cmp || cmp.result !== 'match';
  });

  if (missingCritical.length) {
    const field = missingCritical[0]!;
    return {
      status: 'needs_clarification',
      comparisons,
      clarification: {
        field,
        questionIntent: `confirm_${field.replace(/\./g, '_')}`,
        question: questionFor(field, input.language),
      },
      verifierVersion: DEALBRIDGE_VERIFIER_VERSION,
    };
  }

  return {
    status: 'check_completed',
    comparisons,
    clarification: null,
    verifierVersion: DEALBRIDGE_VERIFIER_VERSION,
  };
}

function extractNumber(text: string): string | null {
  const m = text.match(/\b(\d+(?:\.\d+)?)\b/);
  return m?.[1] ?? null;
}

function extractNumberNear(text: string, near: RegExp): string | null {
  const m = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${near.source})`, 'i'));
  return m?.[1] ?? null;
}

function questionFor(field: string, language: string): string {
  const fr = language.startsWith('fr');
  switch (field) {
    case 'quantity.value':
      return fr
        ? 'Combien de sacs confirmez-vous pour cette commande ?'
        : 'How many bags are you confirming for this order?';
    case 'pricing.currency':
      return fr ? 'Quelle devise confirmez-vous ?' : 'Which currency are you confirming?';
    case 'pricing.unitPrice':
      return fr ? 'Quel est le prix unitaire confirmé ?' : 'What unit price are you confirming?';
    case 'pricing.total':
      return fr ? 'Quel est le total confirmé ?' : 'What total amount are you confirming?';
    case 'delivery.date':
      return fr
        ? 'Quelle date de livraison confirmez-vous (AAAA-MM-JJ) ?'
        : 'What delivery date are you confirming (YYYY-MM-DD)?';
    case 'payment.dueCondition':
      return fr
        ? 'Quelles sont les conditions de paiement confirmées ?'
        : 'What payment condition are you confirming?';
    default:
      return fr
        ? `Merci de préciser la valeur pour ${field}.`
        : `Please state the value for ${field}.`;
  }
}
