/** Thin Web Speech Recognition helpers for Chat Studio live translate. */

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

/** Map BCP-47 / ISO language codes to a recognition locale hint. */
export function recognitionLangFor(code: string): string {
  const map: Record<string, string> = {
    en: 'en-US',
    sw: 'sw-KE',
    yo: 'en-NG',
    ha: 'en-NG',
    am: 'am-ET',
    zu: 'zu-ZA',
    af: 'af-ZA',
    fr: 'fr-FR',
    ar: 'ar-EG',
    pt: 'pt-BR',
    es: 'es-ES',
    de: 'de-DE',
    hi: 'hi-IN',
  };
  if (code.includes('-')) return code;
  return map[code] ?? 'en-US';
}
