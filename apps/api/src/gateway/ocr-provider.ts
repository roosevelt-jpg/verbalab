export type OcrInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  languageHints?: string[];
};

export type OcrOutput = {
  text: string;
  pages: number;
  provider: string;
  latencyMs: number;
  confidence?: number;
};

export interface OcrProvider {
  readonly name: string;
  extract(input: OcrInput): Promise<OcrOutput>;
}
