import { ChatInput, ChatOutput, ChatProvider } from './chat-provider';
import { createOpenAiChatAdapter } from './openai-compatible-chat.adapter';

/** OpenAI Chat Completions adapter (wraps OpenAI-compatible HTTP client). */
export class OpenAiChatAdapter implements ChatProvider {
  readonly name = 'openai_chat';
  private readonly inner: ChatProvider;

  constructor(apiKey: string, fetchImpl: typeof fetch = fetch) {
    this.inner = createOpenAiChatAdapter(apiKey, fetchImpl);
  }

  complete(input: ChatInput): Promise<ChatOutput> {
    return this.inner.complete(input);
  }
}
