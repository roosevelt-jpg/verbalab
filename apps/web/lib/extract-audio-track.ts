/**
 * Browser-side helpers to pull a mono WAV sample from uploaded audio/video
 * when the runtime can decode the container. Not neural stem separation.
 */

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

export function encodeWavMono(samples: Float32Array, sampleRate: number): Blob {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, Math.round(s * 32767), true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const out = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      out[i] = (out[i] ?? 0) + (data[i] ?? 0) / channels;
    }
  }
  return out;
}

export type ExtractedAudioTrack = {
  file: File;
  blobUrl: string;
  durationSeconds: number;
  sampleRate: number;
  note: string;
};

/**
 * Decode an uploaded media file in-browser and emit a mono WAV File.
 * Works for many audio/* and some video/* containers the browser can decode.
 */
export async function extractAudioTrackClient(file: File): Promise<ExtractedAudioTrack> {
  const Ctx =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!Ctx) {
    throw new Error('Web Audio is not available in this browser');
  }
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const mono = mixToMono(decoded);
    const wav = encodeWavMono(mono, decoded.sampleRate);
    const base = file.name.replace(/\.[^.]+$/, '') || 'extracted';
    const out = new File([wav], `${base}-voice-track.wav`, { type: 'audio/wav' });
    return {
      file: out,
      blobUrl: URL.createObjectURL(wav),
      durationSeconds: decoded.duration,
      sampleRate: decoded.sampleRate,
      note:
        'Client-side audio-track extract (browser decode → mono WAV). Not neural voice isolation or stem separation.',
    };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}
