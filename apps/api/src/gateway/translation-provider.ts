export type TranslateInput = {
  text: string;
  source: string;
  target: string;
};

export type TranslateOutput = {
  text: string;
  source: string;
  target: string;
  provider: string;
  characters: number;
  latencyMs: number;
};

export interface TranslationProvider {
  readonly name: string;
  translate(input: TranslateInput): Promise<TranslateOutput>;
}
