export type TtsVoice = {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  languages: string[];
  provider: string;
  /** Country/accent the speaker is native to, e.g. `en-AU`, `ak-GH`. */
  locale?: string;
  /** Lugemi voices: whether the speech engine can speak it now, or it is still being trained. */
  status?: 'live' | 'training';
};

export type TtsInput = {
  text: string;
  voice: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
};

export type TtsOutput = {
  audio: Buffer;
  mimeType: string;
  format: string;
  voice: string;
  characters: number;
  provider: string;
  latencyMs: number;
};

export interface TtsProvider {
  readonly name: string;
  listVoices(): TtsVoice[];
  synthesize(input: TtsInput): Promise<TtsOutput>;
}
