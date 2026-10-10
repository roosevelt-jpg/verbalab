import { VoiceStudioClient } from './voice-studio-client';

export const metadata = {
  title: 'Voice Studio · Lugemi',
  description:
    'Collaborative Lugemi Voice Studio — script to translated speech with native review and approved exports.',
};

export default function VoiceStudioPage() {
  return <VoiceStudioClient />;
}
