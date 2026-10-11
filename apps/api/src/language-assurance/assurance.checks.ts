import { tokenize, alignWords, scoreFromAlignment } from '../pronunciation-intelligence/pronunciation-score';

export type AssuranceFinding = {
  stage: string;
  category: string;
  severity: 'critical' | 'major' | 'minor';
  sourceEvidence?: string;
  targetEvidence?: string;
  audioTimestampMs?: number | null;
  uncertainty?: string;
  scoreMeaning: string;
  reasonCode?: string;
  evidence?: Record<string, unknown>;
};

const CURRENCIES = ['GHS', 'USD', 'EUR', 'NGN', 'KES', 'XOF', 'GBP'] as const;
const NEGATION =
  /\b(not|no|never|don't|dont|doesn't|doesnt|won't|wont|cannot|can't|refuse|reject|cancel)\b/i;

function extractQuantities(text: string): Array<{ raw: string; value: number }> {
  const out: Array<{ raw: string; value: number }> = [];
  const re = /\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = m[1]!;
    const normalized = Number(raw.replace(/,/g, ''));
    if (Number.isFinite(normalized)) out.push({ raw, value: normalized });
  }
  return out;
}

function extractCurrencies(text: string): string[] {
  const found = new Set<string>();
  for (const c of CURRENCIES) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) found.add(c.toUpperCase());
  }
  if (/₵/.test(text)) found.add('GHS');
  if (/\$/.test(text)) found.add('USD');
  if (/€/.test(text)) found.add('EUR');
  return [...found];
}

function extractDates(text: string): string[] {
  const out: string[] = [];
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  out.push(...iso);
  const slash = text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) ?? [];
  out.push(...slash);
  return out;
}

/** Deterministic critical-field comparison — meaning-oriented, not raw string equality. */
export function runCriticalInformationChecks(source: string, target: string): AssuranceFinding[] {
  const findings: AssuranceFinding[] = [];
  const srcQ = extractQuantities(source);
  const tgtQ = extractQuantities(target);

  for (const q of srcQ) {
    const matched = tgtQ.some((t) => Math.abs(t.value - q.value) < 1e-9);
    if (!matched) {
      const scale = tgtQ.find(
        (t) =>
          t.value !== 0 &&
          q.value !== 0 &&
          (Math.abs(t.value / q.value) === 10 ||
            Math.abs(t.value / q.value) === 100 ||
            Math.abs(q.value / t.value) === 10),
      );
      findings.push({
        stage: 'critical_information',
        category: 'quantity_mismatch',
        severity: 'critical',
        sourceEvidence: q.raw,
        targetEvidence: scale?.raw ?? (tgtQ[0]?.raw ?? target.slice(0, 80)),
        scoreMeaning: 'uncalibrated_detector_score',
        reasonCode: scale ? 'QUANTITY_SCALE_CHANGED' : 'QUANTITY_MISSING_OR_CHANGED',
      });
    }
  }

  // Equivalent formats: "15" vs "15.0" / "1,500" vs "1500" already handled via numeric normalize.
  const srcCur = extractCurrencies(source);
  const tgtCur = extractCurrencies(target);
  for (const c of srcCur) {
    if (!tgtCur.includes(c)) {
      findings.push({
        stage: 'critical_information',
        category: 'currency_mismatch',
        severity: 'critical',
        sourceEvidence: c,
        targetEvidence: tgtCur.join(',') || target.slice(0, 80),
        scoreMeaning: 'uncalibrated_detector_score',
        reasonCode: 'CURRENCY_MISSING_OR_CHANGED',
      });
    }
  }

  const srcNeg = NEGATION.test(source);
  const tgtNeg = NEGATION.test(target);
  if (srcNeg !== tgtNeg) {
    findings.push({
      stage: 'critical_information',
      category: 'negation_mismatch',
      severity: 'critical',
      sourceEvidence: srcNeg ? 'negated' : 'affirmative',
      targetEvidence: tgtNeg ? 'negated' : 'affirmative',
      scoreMeaning: 'uncalibrated_detector_score',
      reasonCode: srcNeg ? 'NEGATION_DROPPED' : 'NEGATION_INSERTED',
    });
  }

  const srcDates = extractDates(source);
  const tgtDates = extractDates(target);
  for (const d of srcDates) {
    const normalized = d.includes('-')
      ? d
      : (() => {
          const [a, b, c] = d.split('/');
          if (!a || !b || !c) return d;
          const y = c.length === 2 ? `20${c}` : c;
          return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
        })();
    const matched = tgtDates.some((td) => {
      if (td === d) return true;
      if (td.includes('-') && td === normalized) return true;
      return false;
    });
    if (!matched && tgtDates.length > 0) {
      findings.push({
        stage: 'critical_information',
        category: 'date_mismatch',
        severity: 'critical',
        sourceEvidence: d,
        targetEvidence: tgtDates.join(', '),
        scoreMeaning: 'uncalibrated_detector_score',
        reasonCode: 'DATE_MISSING_OR_CHANGED',
      });
    } else if (!matched && /tomorrow|next week|friday/i.test(source)) {
      findings.push({
        stage: 'critical_information',
        category: 'date_uncertainty',
        severity: 'major',
        sourceEvidence: source.match(/tomorrow|next week|friday/i)?.[0],
        uncertainty: 'Relative date requires clarification; do not invent a calendar day.',
        scoreMeaning: 'uncalibrated_detector_score',
        reasonCode: 'RELATIVE_DATE_UNRESOLVED',
      });
    }
  }

  return findings;
}

export type AudioIntegrityResult = {
  findings: AssuranceFinding[];
  unavailable?: string;
  ok: boolean;
};

/** Structural / signal heuristics — not pronunciation judgments. */
export function runAudioIntegrityChecks(input: {
  audioBase64?: string | null;
  audioMimeType?: string | null;
  requireAudio: boolean;
}): AudioIntegrityResult {
  if (!input.audioBase64?.trim()) {
    if (input.requireAudio) {
      return {
        ok: false,
        findings: [
          {
            stage: 'structural_audio_integrity',
            category: 'missing_audio',
            severity: 'critical',
            scoreMeaning: 'deterministic_integrity',
            reasonCode: 'AUDIO_REQUIRED',
            uncertainty: 'Required audio artifact absent.',
          },
        ],
      };
    }
    return { ok: true, findings: [], unavailable: 'no_audio_provided' };
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(input.audioBase64, 'base64');
  } catch {
    return {
      ok: false,
      findings: [
        {
          stage: 'structural_audio_integrity',
          category: 'undecodable_audio',
          severity: 'critical',
          scoreMeaning: 'deterministic_integrity',
          reasonCode: 'AUDIO_UNDECODABLE',
        },
      ],
    };
  }

  const findings: AssuranceFinding[] = [];
  const asText = buf.toString('utf8');
  if (
    asText.trimStart().startsWith('{') ||
    asText.includes('"error"') ||
    asText.startsWith('FIXTURE_TTS:') ||
    // Detect C0 control chars before "error" without a control-character regex literal.
    (() => {
      const head = asText.slice(0, 64);
      const idx = head.toLowerCase().indexOf('error');
      if (idx < 0) return false;
      for (let i = 0; i < idx; i++) {
        const code = head.charCodeAt(i);
        if (code <= 0x1f && code !== 0x09 && code !== 0x0a && code !== 0x0d) return true;
      }
      return false;
    })()
  ) {
    findings.push({
      stage: 'structural_audio_integrity',
      category: 'provider_error_payload',
      severity: 'critical',
      scoreMeaning: 'deterministic_integrity',
      reasonCode: 'PROVIDER_ERROR_AS_AUDIO',
      uncertainty: 'Provider error or labeled fixture bytes must never pass as valid speech.',
    });
    return { ok: false, findings };
  }

  if (buf.length < 44) {
    return {
      ok: false,
      findings: [
        {
          stage: 'structural_audio_integrity',
          category: 'truncated_audio',
          severity: 'critical',
          scoreMeaning: 'deterministic_integrity',
          reasonCode: 'AUDIO_TOO_SHORT',
        },
      ],
    };
  }

  const isWav = buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WAVE';
  const isId3 = buf.slice(0, 3).toString('ascii') === 'ID3';
  const isMp3Frame = buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0;
  const mime = (input.audioMimeType ?? '').toLowerCase();
  if (mime.includes('wav') && !isWav) {
    findings.push({
      stage: 'structural_audio_integrity',
      category: 'codec_mismatch',
      severity: 'critical',
      scoreMeaning: 'deterministic_integrity',
      reasonCode: 'MIME_HEADER_MISMATCH',
    });
  }
  if (mime.includes('mpeg') || mime.includes('mp3')) {
    if (!isId3 && !isMp3Frame && !isWav) {
      findings.push({
        stage: 'structural_audio_integrity',
        category: 'codec_mismatch',
        severity: 'critical',
        scoreMeaning: 'deterministic_integrity',
        reasonCode: 'MIME_HEADER_MISMATCH',
      });
    }
  }

  // Tone/beep heuristic: tiny PCM WAV with near-constant amplitude samples.
  if (isWav && buf.length < 8000) {
    findings.push({
      stage: 'structural_audio_integrity',
      category: 'suspicious_short_audio',
      severity: 'major',
      scoreMeaning: 'calibrated_heuristic_not_pronunciation',
      reasonCode: 'SHORT_OR_TONE_LIKE',
      uncertainty: 'Short waveform flagged for investigation — not a pronunciation judgment.',
    });
  }

  // Silence heuristic on PCM 16-bit mono after header.
  if (isWav && buf.length > 100) {
    let absSum = 0;
    let samples = 0;
    for (let i = 44; i + 1 < Math.min(buf.length, 44 + 4000); i += 2) {
      const sample = buf.readInt16LE(i);
      absSum += Math.abs(sample);
      samples += 1;
    }
    const mean = samples ? absSum / samples : 0;
    if (samples > 100 && mean < 8) {
      findings.push({
        stage: 'structural_audio_integrity',
        category: 'unexpected_silence',
        severity: 'critical',
        scoreMeaning: 'calibrated_heuristic_not_pronunciation',
        reasonCode: 'NEAR_SILENT_AUDIO',
      });
    }
  }

  return { ok: findings.every((f) => f.severity !== 'critical'), findings };
}

export function runSpokenRealizationAlignment(input: {
  approvedTargetText: string;
  asrHypothesis: string;
}): AssuranceFinding[] {
  const ref = tokenize(input.approvedTargetText);
  const hyp = tokenize(input.asrHypothesis);
  if (ref.length === 0) return [];
  const alignment = alignWords(ref, hyp);
  const scores = scoreFromAlignment(alignment, 0.5, 0.5);
  const findings: AssuranceFinding[] = [];

  if (scores.wordErrorRate > 0.35) {
    findings.push({
      stage: 'spoken_realization',
      category: 'asr_target_divergence',
      severity: 'major',
      sourceEvidence: input.approvedTargetText.slice(0, 120),
      targetEvidence: input.asrHypothesis.slice(0, 120),
      scoreMeaning: 'uncalibrated_wer_not_pronunciation_proof',
      reasonCode: 'HIGH_WER',
      evidence: { wordErrorRate: scores.wordErrorRate },
      uncertainty:
        'Matching or diverging ASR does not prove natural pronunciation, tone, or meaning.',
    });
  }

  const refNums = extractQuantities(input.approvedTargetText);
  const hypNums = extractQuantities(input.asrHypothesis);
  for (const q of refNums) {
    if (!hypNums.some((h) => Math.abs(h.value - q.value) < 1e-9)) {
      findings.push({
        stage: 'spoken_realization',
        category: 'spoken_quantity_change',
        severity: 'critical',
        sourceEvidence: q.raw,
        targetEvidence: hypNums.map((h) => h.raw).join(',') || input.asrHypothesis.slice(0, 80),
        scoreMeaning: 'uncalibrated_wer_not_pronunciation_proof',
        reasonCode: 'SPOKEN_QUANTITY_CHANGED',
      });
    }
  }

  return findings;
}
