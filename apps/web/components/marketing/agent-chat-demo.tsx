'use client';

import { useDemoPlayer } from './use-demo-player';

export function AgentChatDemo({
  title,
  userText,
  agentText,
  userVoiceId = 'user',
  agentVoiceId = 'agent',
  userLang = 'sw',
  agentLang = 'sw',
}: {
  title: string;
  userText: string;
  agentText: string;
  userVoiceId?: string;
  agentVoiceId?: string;
  userLang?: string;
  agentLang?: string;
}) {
  const { play, stop, playingId, status, error } = useDemoPlayer;

  return (
    <div className="mkt-fake-chat mkt-chat-demo">
      <div className="mkt-fake-ui-bar">{title}</div>
      <div className="mkt-chat-row">
        <div className="mkt-chat-bubble mkt-chat-user">{userText}</div>
        <button
          type="button"
          className="mkt-play-chip"
          aria-label="Play user message"
          onClick={ => {
            if (playingId === 'chat-user') {
              stop;
              return;
            }
            void play({ id: 'chat-user', text: userText, voiceId: userVoiceId, lang: userLang });
          }}
        >
          {playingId === 'chat-user' ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="mkt-chat-row mkt-chat-row-agent">
        <div className="mkt-chat-bubble mkt-chat-agent">{agentText}</div>
        <button
          type="button"
          className="mkt-play-chip"
          aria-label="Play agent reply"
          onClick={ => {
            if (playingId === 'chat-agent') {
              stop;
              return;
            }
            void play({
              id: 'chat-agent',
              text: agentText,
              voiceId: agentVoiceId,
              lang: agentLang,
            });
          }}
        >
          {playingId === 'chat-agent' ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="mkt-chat-demo-actions">
        <button
          type="button"
          className="vl-btn vl-btn-primary"
          onClick={async  => {
            await play({ id: 'chat-user', text: userText, voiceId: userVoiceId, lang: userLang });
            await play({
              id: 'chat-agent',
              text: agentText,
              voiceId: agentVoiceId,
              lang: agentLang,
            });
          }}
        >
          Play conversation
        </button>
        <p className="mkt-tts-hint" role="status" aria-live="polite">
          {error ?? status ?? 'Play each turn, or play the full agent conversation.'}
        </p>
      </div>
    </div>
  );
}
