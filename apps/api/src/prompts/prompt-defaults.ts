import { VERBALAB_CHAT_SYSTEM } from '../chat/chat-prompt';
import { VOICE_FAQ_SYSTEM } from '../voice/faq-prompt';

export const PROMPT_KEYS = ['chat', 'rag', 'voice_faq'] as const;
export type PromptKey = (typeof PROMPT_KEYS)[number];

export function isPromptKey(value: string): value is PromptKey {
  return (PROMPT_KEYS as readonly string[]).includes(value);
}

/** RAG system prompt built from chat persona + citation rules (code fallback). */
export const VERBALAB_RAG_SYSTEM = [
  VERBALAB_CHAT_SYSTEM,
  'You answer using ONLY the provided context passages from the workspace knowledge base.',
  'Cite sources as [n] matching the passage numbers. If the context is insufficient, say so.',
  'Do not invent facts outside the context.',
].join(' ');

export function defaultPromptBody(key: PromptKey): string {
  switch (key) {
    case 'chat':
      return VERBALAB_CHAT_SYSTEM;
    case 'rag':
      return VERBALAB_RAG_SYSTEM;
    case 'voice_faq':
      return VOICE_FAQ_SYSTEM;
  }
}
