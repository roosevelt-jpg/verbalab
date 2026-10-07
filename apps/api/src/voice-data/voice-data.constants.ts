export type VoiceDataDialect = {
  code: string;
  languageCode: string;
  name: string;
  country: string;
};

/** Each dialect is collected and modelled separately so the voice sounds like that community. */
export const VOICE_DATA_DIALECTS: VoiceDataDialect[] = [
  { code: 'ak-gh-asante', languageCode: 'ak', name: 'Asante Twi', country: 'GH' },
  { code: 'ak-gh-akuapem', languageCode: 'ak', name: 'Akuapem Twi', country: 'GH' },
  { code: 'ak-gh-fante', languageCode: 'ak', name: 'Fante', country: 'GH' },
  { code: 'ee-gh', languageCode: 'ee', name: 'Ewe (Ghana)', country: 'GH' },
  { code: 'gaa-gh', languageCode: 'gaa', name: 'Ga', country: 'GH' },
  { code: 'dag-gh', languageCode: 'dag', name: 'Dagbani', country: 'GH' },
  { code: 'en-gh', languageCode: 'en', name: 'Ghanaian English', country: 'GH' },
  { code: 'yo-ng', languageCode: 'yo', name: 'Yorùbá', country: 'NG' },
  { code: 'ha-ng', languageCode: 'ha', name: 'Hausa', country: 'NG' },
  { code: 'ig-ng', languageCode: 'ig', name: 'Igbo', country: 'NG' },
  { code: 'pcm-ng', languageCode: 'pcm', name: 'Nigerian Pidgin', country: 'NG' },
  { code: 'sw-ke', languageCode: 'sw', name: 'Kiswahili (Kenya)', country: 'KE' },
  { code: 'sw-tz', languageCode: 'sw', name: 'Kiswahili (Tanzania)', country: 'TZ' },
  { code: 'zu-za', languageCode: 'zu', name: 'isiZulu', country: 'ZA' },
  { code: 'xh-za', languageCode: 'xh', name: 'isiXhosa', country: 'ZA' },
  { code: 'am-et', languageCode: 'am', name: 'Amharic', country: 'ET' },
  { code: 'wo-sn', languageCode: 'wo', name: 'Wolof', country: 'SN' },
];

export function findDialect(code: string): VoiceDataDialect | undefined {
  return VOICE_DATA_DIALECTS.find((d) => d.code === code);
}

/** Bump the version whenever the wording changes; each speaker's accepted version is stored. */
export const VOICE_DATA_CONSENT_VERSION = '2026-10-07';

export const VOICE_DATA_CONSENT_TEXT = [
  'Lugemi is building voices that sound like real native speakers of each language. You are being asked to record yourself reading short sentences in your own language.',
  'How your recordings are used: to train and test Lugemi speech models (text-to-speech and speech recognition) so they speak and understand your language the way your community does. Lugemi may create a synthetic voice based on your recordings and use it in Lugemi products.',
  'What is stored: your recordings, the sentences you read, your name, the contact details you gave us, the dialect, gender, age range and hometown you shared, and the time and device details of this consent.',
  'Your choices: taking part is voluntary. You can stop at any time. You can withdraw from this page or by contacting Lugemi; after withdrawal no new recordings are accepted, and on request your recordings are deleted and excluded from future model training.',
  'You confirm that you are 18 or older, that you grew up speaking this language, and that the voice in the recordings is your own.',
];
