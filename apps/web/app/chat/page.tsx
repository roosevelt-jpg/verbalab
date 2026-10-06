import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ChatClient } from './chat-client';

export default function ChatPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ChatClient />;
}
