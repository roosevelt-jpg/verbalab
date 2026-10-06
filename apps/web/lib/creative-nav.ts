/** LugemiCreative workspace navigation — primary + pinned tools. */

export type CreativeNavItem = {
  href: string;
  label: string;
  icon: string;
  /** External product deep-link (same app, different shell). */
  external?: boolean;
};

export const CREATIVE_PRIMARY: CreativeNavItem[] = [
  { href: '/creative', label: 'Home', icon: 'home' },
  { href: '/creative/voices', label: 'Voices', icon: 'voices' },
  { href: '/creative/studio', label: 'Studio', icon: 'studio' },
  { href: '/creative/flows', label: 'Flows', icon: 'flows' },
  { href: '/creative/chat', label: 'Chat', icon: 'chat' },
  { href: '/creative/assets', label: 'Assets', icon: 'assets' },
];

export const CREATIVE_PINNED: CreativeNavItem[] = [
  { href: '/creative/text-to-speech', label: 'Text to Speech', icon: 'tts' },
  { href: '/creative/voice-creation', label: 'Voice Creation', icon: 'clone' },
  { href: '/creative/sound-effects', label: 'Sound Effects', icon: 'sfx' },
  { href: '/creative/image-video', label: 'Image & Video', icon: 'media' },
  { href: '/creative/voice-isolator', label: 'Voice Isolator', icon: 'isolator' },
  { href: '/creative/voice-changer', label: 'Voice Changer', icon: 'changer' },
  { href: '/creative/music', label: 'Music', icon: 'music' },
  { href: '/creative/speech-to-text', label: 'Speech to Text', icon: 'stt' },
  { href: '/creative/dubbing', label: 'Dubbing', icon: 'dub' },
  { href: '/creative/audiobooks', label: 'Audiobooks', icon: 'book' },
  { href: '/creative/subscription', label: 'Subscription', icon: 'subscription' },
  { href: '/creative/more', label: 'More tools', icon: 'more' },
];

export const CREATIVE_QUICK_TOOLS: { href: string; label: string; icon: string }[] = [
  { href: '/creative/text-to-speech', label: 'Speech', icon: 'tts' },
  { href: '/creative/music', label: 'Music', icon: 'music' },
  { href: '/creative/voice-creation', label: 'Voice Clone', icon: 'clone' },
  { href: '/creative/image-video', label: 'Image', icon: 'image' },
  { href: '/creative/image-video', label: 'Video', icon: 'video' },
  { href: '/creative/dubbing', label: 'Dubbing', icon: 'dub' },
  { href: '/creative/voice-creation', label: 'Avatar', icon: 'avatar' },
  { href: '/creative/speech-to-text', label: 'Transcribe', icon: 'stt' },
  { href: '/creative/audiobooks', label: 'Audiobooks', icon: 'book' },
  { href: '/creative/more', label: 'More', icon: 'more' },
];

export const CREATIVE_SEARCH_INDEX: { href: string; label: string; hint: string }[] = [
  ...CREATIVE_PRIMARY.map((i) => ({ href: i.href, label: i.label, hint: 'Workspace' })),
  ...CREATIVE_PINNED.map((i) => ({ href: i.href, label: i.label, hint: 'Tool' })),
  { href: '/baobab', label: 'Baobab', hint: 'Next model' },
  { href: '/neural-tts', label: 'Neural TTS console', hint: 'Platform' },
  { href: '/voice-cloning', label: 'Voice cloning console', hint: 'Platform' },
  { href: '/voice-marketplace', label: 'Voice marketplace', hint: 'Platform' },
  { href: '/workflows', label: 'Workflows console', hint: 'Platform' },
  { href: '/audio-intelligence', label: 'Audio intelligence', hint: 'Platform' },
  { href: '/chat', label: 'Chat Studio immersive', hint: 'Agents' },
  { href: '/dashboard', label: 'Platform ops dashboard', hint: 'Ops' },
  { href: '/creative/subscription', label: 'Subscription', hint: 'Plans & credits' },
  { href: '/billing', label: 'Billing', hint: 'Account' },
];

export function creativeTitleForPath(pathname: string): string {
  const all = [...CREATIVE_PRIMARY, ...CREATIVE_PINNED];
  const exact = all.find((i) => i.href === pathname);
  if (exact) return exact.label;
  if (pathname.startsWith('/creative/voices')) return 'Voices';
  if (pathname.startsWith('/creative/studio')) return 'Studio';
  if (pathname.startsWith('/creative/flows')) return 'Flows';
  if (pathname.startsWith('/creative/assets')) return 'Assets';
  if (pathname.startsWith('/creative/subscription')) return 'Subscription';
  if (pathname.startsWith('/creative')) return 'Home';
  return 'LugemiCreative';
}
