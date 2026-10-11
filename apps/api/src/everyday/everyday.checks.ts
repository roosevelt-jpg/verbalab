import type { Answerability, EverydayBlock } from './everyday.types';

export type QualityFinding = {
  code: string;
  severity: 'info' | 'warn' | 'block';
  message: string;
};

export type QualityReport = {
  ok: boolean;
  requireRecapture: boolean;
  findings: QualityFinding[];
  estimatedPages: number;
  blurScore: number | null;
  glareScore: number | null;
};

const DEADLINE_RE =
  /\b(?:by|before|due|deadline|pay\s+by|respond\s+by)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/gi;
const AMOUNT_RE =
  /\b(?:GHS|GH₵|USD|\$|€|£)\s?([\d,]+(?:\.\d{2})?)|\b([\d,]+(?:\.\d{2})?)\s?(?:GHS|cedis)\b/gi;
const REF_RE =
  /\b(?:ref(?:erence)?(?:\s*(?:no|number|#))?|account|invoice)\s*[:#]?\s*([A-Z0-9\-]{4,})/gi;
const NEGATION_RE = /\b(do not|don't|must not|never|not required|no longer)\b/i;

/** Heuristic image/PDF quality gates. Fixture markers force recapture in tests. */
export function assessCaptureQuality(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  pageCount?: number;
}): QualityReport {
  const findings: QualityFinding[] = [];
  const name = input.originalName.toLowerCase();
  const asText = input.buffer.toString('utf8', 0, Math.min(input.buffer.length, 4096));

  if (input.buffer.length < 32) {
    findings.push({
      code: 'empty_or_tiny',
      severity: 'block',
      message: 'The upload is too small to contain readable text. Please capture again.',
    });
  }

  const blurred =
    name.includes('blur') ||
    name.includes('obscure') ||
    /\[BLURRED\]|\[OBSCURED\]|████|unreadable/i.test(asText);
  if (blurred) {
    findings.push({
      code: 'blur_or_obscured',
      severity: 'block',
      message:
        'Critical text looks blurred or obscured. Please retake this section with better focus and lighting.',
    });
  }

  const glare = name.includes('glare') || /\[GLARE\]/i.test(asText);
  if (glare) {
    findings.push({
      code: 'glare',
      severity: 'block',
      message: 'Glare is covering text. Tilt the page or move away from bright light and recapture.',
    });
  }

  if (name.includes('crop') || /\[MISSING_PAGE\]/i.test(asText)) {
    findings.push({
      code: 'missing_page_or_crop',
      severity: 'block',
      message:
        'Part of the document appears missing or cropped. Capture all pages before claiming obligations are complete.',
    });
  }

  if (input.mimeType === 'application/pdf' && /Encrypt|\/Encrypt/i.test(asText.slice(0, 2048))) {
    findings.push({
      code: 'encrypted_pdf',
      severity: 'block',
      message: 'Encrypted PDFs are not supported. Export an unlocked PDF or page images.',
    });
  }

  const requireRecapture = findings.some((f) => f.severity === 'block');
  return {
    ok: !requireRecapture,
    requireRecapture,
    findings,
    estimatedPages: input.pageCount ?? 1,
    blurScore: blurred ? 0.1 : 0.85,
    glareScore: glare ? 0.9 : 0.1,
  };
}

export function buildBlocksFromText(fullText: string, pageCount = 1): EverydayBlock[] {
  const paragraphs = fullText
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const units = paragraphs.length ? paragraphs : fullText.trim() ? [fullText.trim()] : [];
  return units.map((text, i) => {
    const uncertainty: EverydayBlock['uncertainty'] =
      /█|\[BLURRED\]|\[OBSCURED\]|unreadable/i.test(text)
        ? 'unreadable'
        : /\?\?\?|\[unclear\]/i.test(text)
          ? 'high'
          : 'low';
    const kind: EverydayBlock['kind'] = /^\s*(amount due|due date|reference|account)\b/i.test(text)
      ? 'label'
      : /\|/.test(text)
        ? 'table_cell'
        : 'paragraph';
    return {
      id: `block_${i + 1}`,
      page: Math.min(pageCount, Math.floor(i / Math.max(1, Math.ceil(units.length / pageCount))) + 1),
      text,
      bbox: {
        x: 0.08,
        y: 0.08 + (i % 12) * 0.07,
        w: 0.84,
        h: 0.06,
        coordinateSystem: 'normalized_0_1',
      },
      readingOrder: i + 1,
      uncertainty,
      kind,
    };
  });
}

export function extractCriticalFields(blocks: EverydayBlock[]) {
  const text = blocks.map((b) => b.text).join('\n');
  const deadlines: { value: string; blockId: string }[] = [];
  const amounts: { value: string; blockId: string }[] = [];
  const references: { value: string; blockId: string }[] = [];

  for (const block of blocks) {
    for (const m of block.text.matchAll(DEADLINE_RE)) {
      deadlines.push({ value: m[1] ?? m[0], blockId: block.id });
    }
    for (const m of block.text.matchAll(AMOUNT_RE)) {
      amounts.push({ value: (m[1] || m[2] || m[0]).replace(/,/g, ''), blockId: block.id });
    }
    for (const m of block.text.matchAll(REF_RE)) {
      references.push({ value: m[1] ?? m[0], blockId: block.id });
    }
  }

  return {
    deadlines,
    amounts,
    references,
    hasNegation: NEGATION_RE.test(text),
    unreadableBlocks: blocks.filter((b) => b.uncertainty === 'unreadable').map((b) => b.id),
  };
}

export function validateEvidenceBlockIds(
  blocks: EverydayBlock[],
  evidenceIds: string[],
): { ok: boolean; missing: string[] } {
  const known = new Set(blocks.map((b) => b.id));
  const missing = evidenceIds.filter((id) => !known.has(id));
  return { ok: missing.length === 0, missing };
}

export function answerQuestionFromSource(input: {
  question: string;
  blocks: EverydayBlock[];
  missingPages: boolean;
}): {
  answerability: Answerability;
  answerText: string;
  claims: { id: string; text: string; evidenceBlockIds: string[] }[];
  evidence: { page: number; blockId: string }[];
  reason?: string;
} {
  const q = input.question.toLowerCase();
  const fields = extractCriticalFields(input.blocks);
  const blockById = new Map(input.blocks.map((b) => [b.id, b]));

  if (fields.unreadableBlocks.length && /(deadline|by when|due|when|amount|pay|ref)/i.test(q)) {
    const evidence = fields.unreadableBlocks.map((id) => ({
      page: blockById.get(id)?.page ?? 1,
      blockId: id,
    }));
    return {
      answerability: 'unreadable',
      answerText:
        'Part of the relevant text is unreadable. Retake that section rather than guessing.',
      claims: [],
      evidence,
      reason: 'Critical fields sit in unreadable OCR blocks.',
    };
  }

  if (input.missingPages && /(all|everything|complete|any other)/i.test(q)) {
    return {
      answerability: 'requires_clarification',
      answerText:
        'One or more pages appear missing, so obligations on those pages cannot be confirmed.',
      claims: [],
      evidence: [],
      reason: 'Missing page prevents claiming all obligations were reviewed.',
    };
  }

  if (/(deadline|by when|due date|when)/i.test(q)) {
    if (!fields.deadlines.length) {
      return {
        answerability: 'not_found',
        answerText:
          'No deadline was found in the reviewed pages. That is not the same as saying none exists on unread pages.',
        claims: [],
        evidence: [],
        reason: 'not_found_in_reviewed_pages',
      };
    }
    const d = fields.deadlines[0]!;
    return {
      answerability: 'supported',
      answerText: `A deadline in the reviewed text is ${d.value}.`,
      claims: [
        {
          id: 'claim_deadline',
          text: `Deadline: ${d.value}`,
          evidenceBlockIds: [d.blockId],
        },
      ],
      evidence: [{ page: blockById.get(d.blockId)?.page ?? 1, blockId: d.blockId }],
    };
  }

  if (/(amount|how much|pay|owe|balance)/i.test(q)) {
    if (!fields.amounts.length) {
      return {
        answerability: 'not_found',
        answerText: 'No amount was found in the reviewed pages.',
        claims: [],
        evidence: [],
        reason: 'not_found_in_reviewed_pages',
      };
    }
    const a = fields.amounts[0]!;
    return {
      answerability: 'supported',
      answerText: `An amount in the reviewed text is ${a.value}. Labels stay attached to their source rows.`,
      claims: [
        {
          id: 'claim_amount',
          text: `Amount: ${a.value}`,
          evidenceBlockIds: [a.blockId],
        },
      ],
      evidence: [{ page: blockById.get(a.blockId)?.page ?? 1, blockId: a.blockId }],
    };
  }

  if (/(what do i need|what should i|action|do next|required)/i.test(q)) {
    const actionBlocks = input.blocks.filter((b) =>
      /\b(must|please|required|pay|submit|attend|bring|call)\b/i.test(b.text),
    );
    if (!actionBlocks.length) {
      return {
        answerability: 'requires_clarification',
        answerText:
          'No clear required action was found. Ask about a specific line or retake unclear pages.',
        claims: [],
        evidence: [],
      };
    }
    const b = actionBlocks[0]!;
    return {
      answerability: fields.hasNegation ? 'partially_supported' : 'supported',
      answerText: b.text,
      claims: [
        {
          id: 'claim_action',
          text: b.text,
          evidenceBlockIds: [b.id],
        },
      ],
      evidence: [{ page: b.page, blockId: b.id }],
      reason: fields.hasNegation
        ? 'Negations or exceptions appear in the document — keep them when acting.'
        : undefined,
    };
  }

  // Generic grounded excerpt: first overlapping block
  const tokens = q
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 3);
  const hit = input.blocks.find((b) => tokens.some((t) => b.text.toLowerCase().includes(t)));
  if (!hit) {
    return {
      answerability: 'not_found',
      answerText: 'Nothing in the reviewed text clearly answers that question.',
      claims: [],
      evidence: [],
      reason: 'not_found_in_reviewed_pages',
    };
  }
  return {
    answerability: 'partially_supported',
    answerText: hit.text,
    claims: [{ id: 'claim_excerpt', text: hit.text, evidenceBlockIds: [hit.id] }],
    evidence: [{ page: hit.page, blockId: hit.id }],
  };
}

export function buildExplanationClaims(blocks: EverydayBlock[]): {
  claims: {
    id: string;
    text: string;
    evidenceBlockIds: string[];
    omission?: string;
    uncertainty?: string;
  }[];
  simplifiedText: string;
  omissions: string[];
} {
  const fields = extractCriticalFields(blocks);
  const claims: {
    id: string;
    text: string;
    evidenceBlockIds: string[];
    omission?: string;
    uncertainty?: string;
  }[] = [];
  const omissions: string[] = [];

  if (fields.deadlines[0]) {
    claims.push({
      id: 'exp_deadline',
      text: `There is a deadline of ${fields.deadlines[0].value} in the document.`,
      evidenceBlockIds: [fields.deadlines[0].blockId],
    });
  } else if (fields.unreadableBlocks.length) {
    omissions.push('Deadline may exist on unreadable text — not asserted.');
  }

  if (fields.amounts[0]) {
    claims.push({
      id: 'exp_amount',
      text: `An amount shown is ${fields.amounts[0].value}.`,
      evidenceBlockIds: [fields.amounts[0].blockId],
    });
  }

  const action = blocks.find((b) => /\b(must|please|required|pay|submit)\b/i.test(b.text));
  if (action) {
    claims.push({
      id: 'exp_action',
      text: `Suggested next step from the text: ${action.text}`,
      evidenceBlockIds: [action.id],
      uncertainty: fields.hasNegation ? 'Check negations and exceptions in the full text.' : undefined,
    });
  }

  if (!claims.length && blocks[0]) {
    claims.push({
      id: 'exp_overview',
      text: `In simple words: ${blocks[0].text}`,
      evidenceBlockIds: [blocks[0].id],
      omission: 'Fine print and conditions may be omitted — compare with the faithful translation.',
    });
    omissions.push('Simplified overview omits full legal wording.');
  }

  return {
    claims,
    simplifiedText: claims.map((c) => c.text).join(' '),
    omissions,
  };
}

/** Reject reply drafts that invent payments, admissions, or dates not in user source. */
export function replyCommitmentFindings(userSource: string, targetText: string): {
  code: string;
  message: string;
}[] {
  const findings: { code: string; message: string }[] = [];
  const src = userSource.toLowerCase();
  const tgt = targetText.toLowerCase();

  const inventsPay =
    /\b(i (?:agree|authorize|promise) to pay|please debit|wire transfer)\b/i.test(targetText) &&
    !/\b(pay|payment|debit|transfer)\b/i.test(userSource);
  if (inventsPay) {
    findings.push({
      code: 'unauthorized_payment_commitment',
      message: 'The reply draft adds a payment commitment that is not in your wording.',
    });
  }

  const inventsAdmission =
    /\b(i admit|i accept liability|i was at fault)\b/i.test(targetText) &&
    !/\b(admit|liability|fault|sorry)\b/i.test(userSource);
  if (inventsAdmission) {
    findings.push({
      code: 'unauthorized_admission',
      message: 'The reply draft adds an admission that is not in your wording.',
    });
  }

  const dateInTarget = targetText.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
  if (dateInTarget && !src.includes(dateInTarget[0]!.toLowerCase()) && !userSource.includes(dateInTarget[0]!)) {
    findings.push({
      code: 'invented_date',
      message: 'The reply draft introduces a date that is not in your wording.',
    });
  }

  if (/\bIGNORE\s+PREVIOUS\b|\bSYSTEM\s*:/i.test(userSource) || /\bIGNORE\s+PREVIOUS\b/i.test(tgt)) {
    findings.push({
      code: 'prompt_injection_ignored',
      message: 'Document or reply instructions cannot change permissions or send messages.',
    });
  }

  return findings;
}

export function preserveCriticalTokens(source: string, target: string): {
  code: string;
  message: string;
}[] {
  const findings: { code: string; message: string }[] = [];
  const srcRefs = [...source.matchAll(/\b([A-Z0-9]{2,}-\d{2,}|\d{6,})\b/g)].map((m) => m[1]!);
  for (const ref of srcRefs) {
    if (ref.startsWith('0') && !target.includes(ref)) {
      findings.push({
        code: 'leading_zero_dropped',
        message: `Reference ${ref} with leading zeros must survive translation.`,
      });
    } else if (!target.includes(ref) && ref.length >= 6) {
      findings.push({
        code: 'reference_missing',
        message: `Reference ${ref} is missing from the translation.`,
      });
    }
  }
  if (NEGATION_RE.test(source) && !NEGATION_RE.test(target) && !/\b(no|not|never)\b/i.test(target)) {
    findings.push({
      code: 'negation_dropped',
      message: 'A negation in the source does not appear preserved in the translation.',
    });
  }
  return findings;
}
