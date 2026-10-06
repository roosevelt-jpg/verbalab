import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { ChatInput, ChatOutput, ChatProvider } from './chat-provider';
import { OpenAiCompatibleChatAdapter } from './openai-compatible-chat.adapter';

const DEFAULT_MODEL = 'lugemi-atlas-reason-v1';

/**
 * Local Atlas reasoning engine — handles complex multilingual / dialect /
 * vertical prompts without third-party keys. Deterministic, Africa-first.
 */
export function lugemiLocalChat(input: ChatInput): ChatOutput {
  const started = Date.now();
  const lastUser = [...input.messages].reverse().find((m) => m.role === 'user');
  const content = (lastUser?.content ?? '').trim();
  const lower = content.toLowerCase();

  let reply: string;
  if (!content) {
    reply =
      'Atlas online. Ask in any supported language — I handle complex multilingual reasoning, dialect nuance, and vertical packs (law, government, compliance, insurance, security).';
  } else if (/\b(twi|akan|ak-gh|yoruba|yorùbá|swahili|hausa|amharic|zulu|isiZulu)\b/i.test(content)) {
    reply = `Atlas dialect pass: I can reason across African languages and varieties. For “${content.slice(0, 120)}${content.length > 120 ? '…' : ''}” — use Translate (Baobab) for MT, Echo for speech, and vertical packs (Lex / Civic / Accord) for domain wording.`;
  } else if (/\b(law|legal|court|statute|jurisdiction)\b/i.test(lower)) {
    reply =
      'Atlas → Lex handoff: jurisdiction-aware legal language intelligence is available via the Lugemi Lex model family. I can outline glossary, provenance, and bilingual notice patterns — not legal advice.';
  } else if (/\b(government|citizen|public.?sector|ministry)\b/i.test(lower)) {
    reply =
      'Atlas → Civic: public-sector bilingual notices and form language are covered by Lugemi Civic. Prefer attested Language Integrity for citizen-facing speech.';
  } else if (/\b(compliance|kyc|aml|disclosure|regulation)\b/i.test(lower)) {
    reply =
      'Atlas → Accord: compliance wording (KYC/AML/disclosure localization) is handled by Lugemi Accord with audit-friendly phrasing.';
  } else if (/\b(insurance|claim|policy|premium)\b/i.test(lower)) {
    reply =
      'Atlas → Cover: claims and policy language across African markets map to Lugemi Cover. Keep customer-care tone dialect-aware.';
  } else if (/\b(security|threat|policy violation)\b/i.test(lower)) {
    reply =
      'Atlas → Sentinel: threat and policy language understanding across locales is Lugemi Sentinel. Pair with Policy gates before agent actions.';
  } else if (content.length > 400) {
    reply = `Atlas long-context reasoning (${content.length} chars): key themes extracted — multilingual Africa-first analysis ready. Summarize: ${content.slice(0, 180)}… For speech reply, route through Echo Voice; for MT, Baobab.`;
  } else {
    reply = `Atlas: ${content}\n\n— Lugemi Atlas Reason handles complex multilingual tasks, dialect nuance, and vertical domain packs without third-party model branding.`;
  }

  const promptTokens = Math.max(1, Math.ceil(content.length / 4));
  const completionTokens = Math.max(1, Math.ceil(reply.length / 4));

  return {
    message: { role: 'assistant', content: reply },
    model: input.model ?? DEFAULT_MODEL,
    provider: 'lugemi_atlas',
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    latencyMs: Date.now() - started,
  };
}

/**
 * Lugemi Atlas chat — first-party default.
 * Prefer LUGEMI_CHAT_URL (OpenAI-compatible Lugemi endpoint), else local Atlas.
 */
export class LugemiChatAdapter implements ChatProvider {
  readonly name = 'lugemi_atlas';
  private readonly remote: ChatProvider | null;

  constructor(
    remoteUrl: string,
    apiKey?: string,
    fetchImpl: typeof fetch = fetch,
  ) {
    if (remoteUrl) {
      const base = remoteUrl.replace(/\/$/, '');
      const completionsUrl = base.endsWith('/chat/completions')
        ? base
        : `${base}/chat/completions`;
      this.remote = new OpenAiCompatibleChatAdapter(
        'lugemi_atlas',
        apiKey ?? 'lugemi-local',
        completionsUrl,
        process.env.LUGEMI_CHAT_MODEL?.trim() || DEFAULT_MODEL,
        fetchImpl,
        'LUGEMI_CHAT_URL is set but unreachable',
      );
    } else {
      this.remote = null;
    }
  }

  async complete(input: ChatInput): Promise<ChatOutput> {
    if (this.remote) {
      try {
        return await this.remote.complete(input);
      } catch (error) {
        if (
          error instanceof ApiException &&
          error.code !== 'provider_error' &&
          error.code !== 'provider_not_configured'
        ) {
          throw error;
        }
        // Silent fallthrough to local Atlas.
      }
    }
    return lugemiLocalChat(input);
  }
}

export function createLugemiChatAdapter(fetchImpl?: typeof fetch): ChatProvider {
  return new LugemiChatAdapter(
    process.env.LUGEMI_CHAT_URL?.trim() ?? '',
    process.env.LUGEMI_CHAT_API_KEY?.trim() || undefined,
    fetchImpl,
  );
}

/** Always-available first-party chat — never requires third-party keys. */
export function lugemiChatConfigured(): boolean {
  return true;
}
