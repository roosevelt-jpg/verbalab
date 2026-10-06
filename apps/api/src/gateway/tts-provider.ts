export type TtsVoice = {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  languages: string[];
  provider: string;
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
  listVoices: TtsVoice[];
  synthesize(input: TtsInput): Promise<TtsOutput>;
}
