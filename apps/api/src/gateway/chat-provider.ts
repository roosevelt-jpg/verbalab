export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatInput = {
  messages: ChatMessage[];
  model?: string;
};

export type ChatOutput = {
  message: ChatMessage;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
};

export interface ChatProvider {
  readonly name: string;
  complete(input: ChatInput): Promise<ChatOutput>;
}
