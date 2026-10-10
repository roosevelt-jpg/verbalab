export type SttSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  /** 0–1 confidence when the vendor exposes a proxy (e.g. Whisper avg_logprob). */
  confidence?: number;
};

export type SttInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  /** ISO-639-1 hint. Omit for automatic language detection when the vendor supports it. */
  language?: string;
  /** Vendor prompt / phrase boost (Whisper prompt; other vendors may map differently). */
  prompt?: string;
};

export type SttOutput = {
  text: string;
  language?: string;
  durationSeconds: number;
  provider: string;
  latencyMs: number;
  segments?: SttSegment[];
  /** Aggregate 0–1 confidence across segments when available. */
  confidence?: number;
};

export interface SttProvider {
  readonly name: string;
  transcribe(input: SttInput): Promise<SttOutput>;
}
