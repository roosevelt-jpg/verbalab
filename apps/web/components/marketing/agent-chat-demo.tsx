'use client';

import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { resolveVoiceDemoScript } from '@/lib/native-demo-scripts';
import { useDemoPlayer } from './use-demo-player';

export function AgentChatDemo({
  title,
  userText,
  agentText,
  userVoiceId = 'user',
  agentVoiceId = 'agent',
  userLang,
  agentLang,
}: {
  title: string;
  userText: string;
  agentText: string;
  userVoiceId?: string;
  agentVoiceId?: string;
  userLang?: string;
  agentLang?: string;
}) {
  const { play, playSequence, stop, playingId, loadingId, status, error } = useDemoPlayer();
  const convActive = playingId === 'chat-user' || playingId === 'chat-agent';
  const convLoading = loadingId === 'chat-user' || loadingId === 'chat-agent';
  // Lang follows the voice profile when callers omit it — never default to bare "en"
  // while the agent voice speaks Kiswahili (or another L1).
  const resolvedUserLang = userLang ?? resolveVoiceDemoScript(userVoiceId).lang;
  const resolvedAgentLang = agentLang ?? resolveVoiceDemoScript(agentVoiceId).lang;

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
            void play({
              id: 'chat-user',
              text: userText,
              voiceId: userVoiceId,
              lang: resolvedUserLang,
            });
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
              lang: resolvedAgentLang,
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
          onPlay={() => {
            void playSequence([
              {
                id: 'chat-user',
                text: userText,
                voiceId: userVoiceId,
                lang: resolvedUserLang,
              },
              {
                id: 'chat-agent',
                text: agentText,
                voiceId: agentVoiceId,
                lang: resolvedAgentLang,
              },
            ]);
          }}
        />
        <p className="mkt-tts-hint" role="status" aria-live="polite">
          {error ?? status ?? 'Play each turn, or play the full agent conversation.'}
        </p>
      </div>
    </div>
  );
}
