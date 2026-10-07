'use client';

import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from './use-demo-player';

export function AgentChatDemo({
  title,
  userText,
  agentText,
  userVoiceId = 'user',
  agentVoiceId = 'agent',
  userLang = 'en',
  agentLang = 'en',
}: {
  title: string;
  userText: string;
  agentText: string;
  userVoiceId?: string;
  agentVoiceId?: string;
  userLang?: string;
  agentLang?: string;
}) {
  const { play, stop, playingId, loadingId, status, error } = useDemoPlayer();
  const convActive = playingId === 'chat-user' || playingId === 'chat-agent';
  const convLoading = loadingId === 'chat-user' || loadingId === 'chat-agent';

  return (
    <div className="mkt-fake-chat mkt-chat-demo">
      <div className="mkt-fake-ui-bar">{title}</div>
      <div className="mkt-chat-row">
        <div className="mkt-chat-bubble mkt-chat-user">{userText}</div>
        <DemoPlayStopButton
          active={playingId === 'chat-user'}
          loading={loadingId === 'chat-user'}
          variant="icon"
          label="Play user message"
          stopLabel="Stop user message"
          ariaLabel={
            playingId === 'chat-user' || loadingId === 'chat-user'
              ? 'Stop user message'
              : 'Play user message'
          }
          onStop={stop}
          onPlay={() => {
            void play({ id: 'chat-user', text: userText, voiceId: userVoiceId, lang: userLang });
          }}
        />
      </div>
      <div className="mkt-chat-row mkt-chat-row-agent">
        <div className="mkt-chat-bubble mkt-chat-agent">{agentText}</div>
        <DemoPlayStopButton
          active={playingId === 'chat-agent'}
          loading={loadingId === 'chat-agent'}
          variant="icon"
          label="Play agent reply"
          stopLabel="Stop agent reply"
          ariaLabel={
            playingId === 'chat-agent' || loadingId === 'chat-agent'
              ? 'Stop agent reply'
              : 'Play agent reply'
          }
          onStop={stop}
          onPlay={() => {
            void play({
              id: 'chat-agent',
              text: agentText,
              voiceId: agentVoiceId,
              lang: agentLang,
            });
          }}
        />
      </div>
      <div className="mkt-chat-demo-actions">
        <DemoPlayStopButton
          active={convActive}
          loading={convLoading}
          variant="primary"
          label="Play conversation"
          stopLabel="Stop"
          onStop={stop}
          onPlay={async () => {
            await play({ id: 'chat-user', text: userText, voiceId: userVoiceId, lang: userLang });
            await play({
              id: 'chat-agent',
              text: agentText,
              voiceId: agentVoiceId,
              lang: agentLang,
            });
          }}
        />
        <p className="mkt-tts-hint" role="status" aria-live="polite">
          {error ?? status ?? 'Play each turn, or play the full agent conversation.'}
        </p>
      </div>
    </div>
  );
}
