/**
 * Hand-authored EN→African golden segments for VL-100.
 * Short everyday / public-sector phrases — not a licensed FLORES dump.
 * Expand with licensed datasets under VL-101.
 */
export type GoldenSegment = {
  id: string;
  source: string;
  reference: string;
  domain?: string;
};

export type GoldenPair = {
  sourceLang: string;
  targetLang: string;
  segments: GoldenSegment[];
};

export const GOLDEN_PAIRS: GoldenPair[] = [
  {
    sourceLang: 'en',
    targetLang: 'sw',
    segments: [
      { id: 'en-sw-01', source: 'Hello', reference: 'Habari', domain: 'greetings' },
      { id: 'en-sw-02', source: 'Thank you', reference: 'Asante', domain: 'greetings' },
      { id: 'en-sw-03', source: 'How are you?', reference: 'Habari yako?', domain: 'greetings' },
      { id: 'en-sw-04', source: 'Good morning', reference: 'Habari za asubuhi', domain: 'greetings' },
      { id: 'en-sw-05', source: 'Where is the clinic?', reference: 'Kliniki iko wapi?', domain: 'health' },
      { id: 'en-sw-06', source: 'Please wait here', reference: 'Tafadhali subiri hapa', domain: 'public' },
      { id: 'en-sw-07', source: 'I need help', reference: 'Nahitaji msaada', domain: 'public' },
      { id: 'en-sw-08', source: 'The office is closed', reference: 'Ofisi imefungwa', domain: 'public' },
      { id: 'en-sw-09', source: 'Bring your identity card', reference: 'Lete kitambulisho chako', domain: 'public' },
      { id: 'en-sw-10', source: 'Water is available', reference: 'Maji yanapatikana', domain: 'public' },
      { id: 'en-sw-11', source: 'School starts tomorrow', reference: 'Shule inaanza kesho', domain: 'education' },
      { id: 'en-sw-12', source: 'The meeting is at noon', reference: 'Mkutano ni saa sita mchana', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'yo',
    segments: [
      { id: 'en-yo-01', source: 'Hello', reference: 'Báwo', domain: 'greetings' },
      { id: 'en-yo-02', source: 'Thank you', reference: 'E ṣé', domain: 'greetings' },
      { id: 'en-yo-03', source: 'How are you?', reference: 'Báwo ni?', domain: 'greetings' },
      { id: 'en-yo-04', source: 'Good morning', reference: 'Ẹ káàárọ̀', domain: 'greetings' },
      { id: 'en-yo-05', source: 'Where is the clinic?', reference: 'Ibi ìtọ́jú wà níbo?', domain: 'health' },
      { id: 'en-yo-06', source: 'Please wait here', reference: 'Jọ̀wọ́ dúró níbí', domain: 'public' },
      { id: 'en-yo-07', source: 'I need help', reference: 'Mo nílò ìrànlọ́wọ́', domain: 'public' },
      { id: 'en-yo-08', source: 'The office is closed', reference: 'Ọ́fíìsì ti padé', domain: 'public' },
      { id: 'en-yo-09', source: 'Bring your identity card', reference: 'Mú káàdì ìdánimọ̀ rẹ wá', domain: 'public' },
      { id: 'en-yo-10', source: 'Water is available', reference: 'Omi wà', domain: 'public' },
      { id: 'en-yo-11', source: 'School starts tomorrow', reference: 'Ilé-ìwé yóò bẹ̀rẹ̀ lọ́la', domain: 'education' },
      { id: 'en-yo-12', source: 'The meeting is at noon', reference: 'Ìpàdé wà ní ọ̀sán', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'am',
    segments: [
      { id: 'en-am-01', source: 'Hello', reference: 'ሰላም', domain: 'greetings' },
      { id: 'en-am-02', source: 'Thank you', reference: 'አመሰግናለሁ', domain: 'greetings' },
      { id: 'en-am-03', source: 'How are you?', reference: 'እንደምን አደርክ?', domain: 'greetings' },
      { id: 'en-am-04', source: 'Good morning', reference: 'እንደምን አደሩ', domain: 'greetings' },
      { id: 'en-am-05', source: 'Where is the clinic?', reference: 'ክሊኒኩ የት ነው?', domain: 'health' },
      { id: 'en-am-06', source: 'Please wait here', reference: 'እባክዎ እዚህ ይጠብቁ', domain: 'public' },
      { id: 'en-am-07', source: 'I need help', reference: 'እርዳታ እፈልጋለሁ', domain: 'public' },
      { id: 'en-am-08', source: 'The office is closed', reference: 'ቢሮው ተዘግቷል', domain: 'public' },
      { id: 'en-am-09', source: 'Bring your identity card', reference: 'መታወቂያዎን ያምጡ', domain: 'public' },
      { id: 'en-am-10', source: 'Water is available', reference: 'ውሃ አለ', domain: 'public' },
      { id: 'en-am-11', source: 'School starts tomorrow', reference: 'ትምህርት ቤት ነገ ይጀምራል', domain: 'education' },
      { id: 'en-am-12', source: 'The meeting is at noon', reference: 'ስብሰባው እኩለ ቀን ነው', domain: 'business' },
    ],
  },
];

export function pairKey(sourceLang: string, targetLang: string) {
  return `${sourceLang}-${targetLang}`;
}
