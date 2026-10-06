export type DetectInput = {
  text: string;
};

export type DetectOutput = {
  language: string;
  confidence: number;
  provider: string;
};

export interface LanguageDetectProvider {
  readonly name: string;
  detect(input: DetectInput): Promise<DetectOutput>;
}
