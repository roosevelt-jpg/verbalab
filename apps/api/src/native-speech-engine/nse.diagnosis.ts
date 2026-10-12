import { runAudioIntegrityChecks } from '../language-assurance/assurance.checks';
import type { NseDiagnosisIssue } from './nse.types';

/**
 * Layered beep/echo/unintelligible diagnosis comparing payload shape to
 * intended synthesizer output. Reuses Language Assurance integrity heuristics.
 */
export function diagnoseSpeechAudio(input: {
  audio: Buffer;
  mimeType: string;
  synthEngine?: string | null;
  verificationStatus?: string | null;
  requireIntelligible?: boolean;
}): { ok: boolean; issues: NseDiagnosisIssue[]; durationHintMs: number | null } {
  const issues: NseDiagnosisIssue[] = [];
  const buf = input.audio;
  const mime = (input.mimeType || '').toLowerCase();

  if (!buf?.length) {
    issues.push({
      layer: 'payload',
      code: 'EMPTY_AUDIO',
      severity: 'critical',
      message: 'No audio bytes returned from synthesizer.',
      remediation: 'Check OWN_TTS_URL / eSpeak path; refuse playback.',
    });
    return { ok: false, issues, durationHintMs: null };
  }

  // Error JSON/HTML treated as audio
  const head = buf.slice(0, 96).toString('utf8');
  if (
    head.trimStart().startsWith('{') ||
    head.includes('"error"') ||
    /<!doctype html|<html/i.test(head) ||
    head.startsWith('FIXTURE_TTS:')
  ) {
    issues.push({
      layer: 'payload',
      code: 'PROVIDER_ERROR_AS_AUDIO',
      severity: 'critical',
      message: 'Synthesizer returned JSON/HTML/fixture text labeled as audio.',
      remediation: 'Reject payload; fix provider adapter before retraining.',
    });
    return { ok: false, issues, durationHintMs: null };
  }

  const integrity = runAudioIntegrityChecks({
    audioBase64: buf.toString('base64'),
    audioMimeType: input.mimeType,
    requireAudio: true,
  });
  for (const f of integrity.findings) {
    const layer =
      f.reasonCode === 'NEAR_SILENT_AUDIO' || f.reasonCode === 'SHORT_OR_TONE_LIKE'
        ? 'codec'
        : f.reasonCode === 'PROVIDER_ERROR_AS_AUDIO'
          ? 'payload'
          : 'codec';
    issues.push({
      layer,
      code: f.reasonCode || f.category,
      severity: f.severity,
      message: f.uncertainty || f.category,
      remediation:
        f.reasonCode === 'SHORT_OR_TONE_LIKE'
          ? 'Likely beep/tone placeholder — check formant fallback and capability gate.'
          : f.reasonCode === 'NEAR_SILENT_AUDIO'
            ? 'Near-silent PCM — check vocoder/decoder and sample-rate headers.'
            : 'Fix codec/MIME alignment before browser playback.',
    });
  }

  // eSpeak streaming echo: absurd RIFF sizes historically caused hang/echo
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.length >= 8) {
    const declared = buf.readUInt32LE(4);
    if (declared > buf.length + 8 && declared > 100_000_000) {
      issues.push({
        layer: 'codec',
        code: 'STREAMING_WAV_SIZE_MISMATCH',
        severity: 'critical',
        message: 'WAV header claims multi‑GB stream — classic eSpeak stdout echo/hang.',
        remediation: 'Run finalizeStreamingWav before delivery (owned TTS adapter).',
      });
    }
  }

  if (input.verificationStatus === 'formant_placeholder' && input.requireIntelligible) {
    issues.push({
      layer: 'capability',
      code: 'FORMANT_BLOCKED_FOR_DEMO',
      severity: 'critical',
      message: 'Formant placeholder cannot ship on customer-facing intelligible paths.',
      remediation: 'Remap to demo-safe cultural variety or refuse with capability_unavailable.',
    });
  }

  if (input.synthEngine === 'unavailable') {
    issues.push({
      layer: 'weights',
      code: 'SYNTH_UNAVAILABLE',
      severity: 'critical',
      message: 'No compatible synthesizer/weights for this voice/language.',
      remediation: 'Publish neural checkpoint or remap demo; do not fabricate accents.',
    });
  }

  const critical = issues.some((i) => i.severity === 'critical');
  const durationHintMs = estimateDurationMs(buf, mime);
  return { ok: !critical && integrity.ok, issues, durationHintMs };
}

function estimateDurationMs(buf: Buffer, mime: string): number | null {
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.length > 44) {
    // PCM 16-bit mono @ 22050 ≈ common eSpeak
    const dataBytes = Math.max(0, buf.length - 44);
    return Math.round((dataBytes / 2 / 22050) * 1000);
  }
  if (mime.includes('mpeg') || mime.includes('mp3')) {
    // Rough 32kbps estimate for demo MP3
    return Math.round((buf.length * 8) / 32);
  }
  return null;
}

export function looksLikeAudioBuffer(buf: Buffer, mimeType: string): boolean {
  if (!buf || buf.length < 64) return false;
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('json') || mime.includes('text') || mime.includes('html')) return false;
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE') return true;
  if (buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0) return true;
  if (buf.toString('ascii', 0, 3) === 'ID3') return true;
  if (buf.toString('ascii', 0, 4) === 'OggS') return true;
  if (mime.startsWith('audio/') && buf.length > 256) return true;
  return false;
}
