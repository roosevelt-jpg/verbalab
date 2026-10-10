export type EmbedInput = {
  /** One or more texts to embed. */
  input: string | string[];
  model?: string;
};

export type EmbeddingItem = {
  index: number;
  embedding: number[];
};

export type EmbedOutput = {
  data: EmbeddingItem[];
  model: string;
  provider: string;
  promptTokens: number;
  totalTokens: number;
  latencyMs: number;
};

export interface EmbeddingProvider {
  readonly name: string;
  embed(input: EmbedInput): Promise<EmbedOutput>;
}
