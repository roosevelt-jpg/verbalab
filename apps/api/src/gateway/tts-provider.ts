export type TtsVoice = {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  languages: string[];
  provider: string;
  /** Country/accent the speaker is native to, e.g. `en-AU`, `ak-GH`. */
  locale?: string;
  /**
   * `live` = neural checkpoint available on the speech engine.
   * `demo` = eSpeak-backed intelligible demo speech (not native-reviewed neural).
   * `placeholder` = formant-only — not customer-demo-safe without neural weights.
   * `training` retained for legacy clients.
   */
  status?: 'live' | 'demo' | 'placeholder' | 'training';
  verificationStatus?:
    | 'native_reviewed'
    | 'espeak_demo'
    | 'formant_placeholder'
    | 'neural_unreviewed'
    | 'unsupported';
  synthEngine?: string;
  limitations?: string;
};

export type TtsInput = {
  text: string;
  voice: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
  /** When true, refuse formant placeholders instead of fabricating speech-like audio. */
  requireIntelligible?: boolean;
};

export type TtsOutput = {
  audio: Buffer;
  mimeType: string;
  format: string;
  voice: string;
  characters: number;
  provider: string;
  latencyMs: number;
  synthEngine?: string;
  verificationStatus?: string;
};

export interface TtsProvider {
  readonly name: string;
  listVoices(): TtsVoice[];
  synthesize(input: TtsInput): Promise<TtsOutput>;
}
