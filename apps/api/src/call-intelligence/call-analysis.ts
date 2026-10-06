import {
  analyzeIntent,
  analyzeSentiment,
} from '../language-intelligence/language-signals';
import { analyzeSpeechEmotion } from '../emotion-intelligence/emotion-signals';

export type CallAnalysis = {
  summary: string;
  topics: Array<{ id: string; label: string; score: number }>;
  intent: { label: string; confidence: number };
  sentiment: { label: string; score: number; confidence: number };
  emotion: { label: string; confidence: number };
  compliance: {
    flags: Array<{ id: string; severity: 'info' | 'warn' | 'critical'; message: string }>;
    riskScore: number;
  };
  coaching: Array<{ id: string; message: string }>;
  qa: {
    score: number;
    dimensions: Array<{ id: string; label: string; score: number; note: string }>;
  };
  note: string;
};

const TOPIC_PACKS: Array<{ id: string; label: string; re: RegExp }> = [
  { id: 'billing', label: 'Billing', re: /\b(bill|billing|invoice|payment|refund|charge|subscription)\b/gi },
  { id: 'support', label: 'Support', re: /\b(help|support|issue|problem|broken|bug|error|troubleshoot)\b/gi },
  { id: 'sales', label: 'Sales', re: /\b(buy|purchase|pricing|demo|upgrade|plan|quote|discount)\b/gi },
  { id: 'account', label: 'Account', re: /\b(account|login|password|access|profile|settings)\b/gi },
  { id: 'shipping', label: 'Shipping', re: /\b(ship|shipping|delivery|tracking|order|package)\b/gi },
  { id: 'compliance', label: 'Compliance', re: /\b(compliance|gdpr|privacy|consent|pci|hipaa)\b/gi },
];

const COMPLIANCE_RULES: Array<{
  id: string;
  severity: 'info' | 'warn' | 'critical';
  re: RegExp;
  message: string;
}> = [
  {
    id: 'pci-card',
    severity: 'critical',
    re: /\b(?:\d[ -]*?){13,19}\b/g,
    message: 'Possible full card number spoken/typed — PCI handling required.',
  },
  {
    id: 'ssn-like',
    severity: 'critical',
    re: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    message: 'Possible national ID / SSN-like pattern detected.',
  },
  {
    id: 'profanity',
    severity: 'warn',
    re: /\b(damn|hell|shit|fuck|bastard|asshole)\b/gi,
    message: 'Profanity detected — review for QA policy.',
  },
  {
    id: 'recording-disclosure',
    severity: 'info',
    re: /\b(this call (is|may be) recorded|recording for quality)\b/gi,
    message: 'Recording disclosure phrase present.',
  },
];

function countMatches(text: string, re: RegExp): number {
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  return [...text.matchAll(global)].length;
}

function extractiveSummary(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim;
  if (!cleaned) return 'Empty transcript.';
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim)
    .filter(Boolean);
  if (sentences.length <= 2) return cleaned.slice(0, 400);
  const first = sentences[0] ?? '';
  const last = sentences[sentences.length - 1] ?? '';
  const mid = sentences[Math.floor(sentences.length / 2)] ?? '';
  return [first, mid, last].filter(Boolean).join(' ').slice(0, 600);
}

/** Heuristic call analysis. */
export function analyzeCallTranscript(transcript: string): CallAnalysis {
  const text = transcript.trim;
  const sentiment = analyzeSentiment(text);
  const intent = analyzeIntent(text);
  const emotion = analyzeSpeechEmotion(text);

  const topics = TOPIC_PACKS.map((t) => ({
    id: t.id,
    label: t.label,
    score: countMatches(text, t.re),
  }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      label: t.label,
      score: Number(Math.min(1, t.score / 4).toFixed(2)),
    }));

  const flags: CallAnalysis['compliance']['flags'] = [];
  for (const rule of COMPLIANCE_RULES) {
    if (countMatches(text, rule.re) > 0) {
      flags.push({ id: rule.id, severity: rule.severity, message: rule.message });
    }
  }
  if (!flags.some((f) => f.id === 'recording-disclosure')) {
    flags.push({
      id: 'missing-disclosure',
      severity: 'warn',
      message: 'No recording disclosure phrase detected.',
    });
  }
  const riskScore = Math.min(
    100,
    flags.reduce((acc, f) => acc + (f.severity === 'critical' ? 40 : f.severity === 'warn' ? 15 : 0), 0),
  );

  const coaching: CallAnalysis['coaching'] = [];
  if (sentiment.label === 'negative' || sentiment.label === 'mixed') {
    coaching.push({
      id: 'empathy',
      message: 'Customer sentiment is soft-negative — acknowledge frustration before pitching.',
    });
  }
  if (intent.label === 'complaint') {
    coaching.push({
      id: 'complaint',
      message: 'Complaint intent — confirm issue, offer next step, and set a follow-up time.',
    });
  }
  if (!/\b(next step|follow[- ]?up|I will|we'll)\b/i.test(text)) {
    coaching.push({
      id: 'next-step',
      message: 'No clear next-step language — close with an explicit action and owner.',
    });
  }
  if (/\b(discount|price|pricing|quote)\b/i.test(text) && !/\b(value|roi|benefit)\b/i.test(text)) {
    coaching.push({
      id: 'value',
      message: 'Pricing discussed without value framing — tie price to outcomes.',
    });
  }
  if (!coaching.length) {
    coaching.push({
      id: 'strong',
      message: 'Solid structure — consider a brief recap email after the call.',
    });
  }

  const greeting = /\b(hello|hi|good morning|good afternoon|welcome)\b/i.test(text);
  const closing = /\b(thank you|thanks|goodbye|have a (great|good) day|anything else)\b/i.test(text);
  const clarity = text.length > 40 ? 80 : 50;
  const empathy = sentiment.label === 'negative' ? 55 : sentiment.label === 'positive' ? 90 : 75;
  const process =
    greeting && closing ? 90 : greeting || closing ? 70 : 50;
  const complianceDim = riskScore >= 40 ? 40 : riskScore >= 15 ? 65 : 90;
  const qaScore = Number(
    ((clarity + empathy + process + complianceDim) / 4).toFixed(1),
  );

  return {
    summary: extractiveSummary(text),
    topics:
      topics.length > 0
        ? topics
        : [{ id: 'general', label: 'General', score: 0.3 }],
    intent: { label: intent.label, confidence: intent.confidence },
    sentiment: {
      label: sentiment.label,
      score: sentiment.score,
      confidence: sentiment.confidence,
    },
    emotion: { label: emotion.label, confidence: emotion.confidence },
    compliance: { flags, riskScore },
    coaching,
    qa: {
      score: qaScore,
      dimensions: [
        { id: 'clarity', label: 'Clarity', score: clarity, note: 'Transcript length/structure proxy.' },
        { id: 'empathy', label: 'Empathy', score: empathy, note: 'Derived from sentiment cues.' },
        {
          id: 'process',
          label: 'Process',
          score: process,
          note: 'Greeting/closing checklist.',
        },
        {
          id: 'compliance',
          label: 'Compliance',
          score: complianceDim,
          note: 'Inverse of heuristic risk flags.',
        },
      ],
    },
    note: 'Heuristic Call Intelligence analysis — not Gong/Chorus or certified compliance.',
  };
}
