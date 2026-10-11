/**
 * Hand-authored EN→African golden segments for the eval harness.
 * Short everyday / public-sector phrases — not a licensed FLORES dump.
 * Expand with licensed datasets under a licensed corpus program.
 * Ghana pairs (ak/ee/gaa/ada/dag) need native review before corridor quality claims.
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
  // Ghana major-school corridors (MeetingBridge en-ak / en-ee + school languages).
  {
    sourceLang: 'en',
    targetLang: 'ak',
    segments: [
      { id: 'en-ak-01', source: 'Hello', reference: 'Agoo', domain: 'greetings' },
      { id: 'en-ak-02', source: 'Thank you', reference: 'Medaase', domain: 'greetings' },
      { id: 'en-ak-03', source: 'How are you?', reference: 'Ɛte sɛn?', domain: 'greetings' },
      { id: 'en-ak-04', source: 'Good morning', reference: 'Maakye', domain: 'greetings' },
      { id: 'en-ak-05', source: 'Where is the clinic?', reference: 'Ayaresabea no wɔ he?', domain: 'health' },
      { id: 'en-ak-06', source: 'Please wait here', reference: 'Mepa wo kyɛw twɛn ha', domain: 'public' },
      { id: 'en-ak-07', source: 'I need help', reference: 'Mepɛ mmoa', domain: 'public' },
      { id: 'en-ak-08', source: 'The office is closed', reference: 'Ofese no ato mu', domain: 'public' },
      { id: 'en-ak-09', source: 'Bring your identity card', reference: 'Fa wo krataa a ɛkyerɛ wo din bra', domain: 'public' },
      { id: 'en-ak-10', source: 'Water is available', reference: 'Nsuo wɔ hɔ', domain: 'public' },
      { id: 'en-ak-11', source: 'School starts tomorrow', reference: 'Sukuu bɛhyɛ ase ɔkyena', domain: 'education' },
      { id: 'en-ak-12', source: 'The meeting is at noon', reference: 'Nhyiam no yɛ awia', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'ee',
    segments: [
      { id: 'en-ee-01', source: 'Hello', reference: 'Woezɔ', domain: 'greetings' },
      { id: 'en-ee-02', source: 'Thank you', reference: 'Akpe', domain: 'greetings' },
      { id: 'en-ee-03', source: 'How are you?', reference: 'Aleke nèle?', domain: 'greetings' },
      { id: 'en-ee-04', source: 'Good morning', reference: 'Ŋdi', domain: 'greetings' },
      { id: 'en-ee-05', source: 'Where is the clinic?', reference: 'Klinik la le afika?', domain: 'health' },
      { id: 'en-ee-06', source: 'Please wait here', reference: 'Meɖe kuku nɔte afisia', domain: 'public' },
      { id: 'en-ee-07', source: 'I need help', reference: 'Mehiã kpekpeɖeŋu', domain: 'public' },
      { id: 'en-ee-08', source: 'The office is closed', reference: 'Ɔfis la tu', domain: 'public' },
      { id: 'en-ee-09', source: 'Bring your identity card', reference: 'Tsɔ wò ɖeɖefiaŋutinunya kɔta vɛ', domain: 'public' },
      { id: 'en-ee-10', source: 'Water is available', reference: 'Tsi li', domain: 'public' },
      { id: 'en-ee-11', source: 'School starts tomorrow', reference: 'Sukuu adze egɔme etsɔ', domain: 'education' },
      { id: 'en-ee-12', source: 'The meeting is at noon', reference: 'Takpekpe la le ŋdɔ me', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'gaa',
    segments: [
      { id: 'en-gaa-01', source: 'Hello', reference: 'Teɛ ngɛ?', domain: 'greetings' },
      { id: 'en-gaa-02', source: 'Thank you', reference: 'Oyiwala don', domain: 'greetings' },
      { id: 'en-gaa-03', source: 'How are you?', reference: 'Teɛ oye?', domain: 'greetings' },
      { id: 'en-gaa-04', source: 'Good morning', reference: 'Ojekoo', domain: 'greetings' },
      { id: 'en-gaa-05', source: 'Where is the clinic?', reference: 'Clinic lɛ yɛ mɛni?', domain: 'health' },
      { id: 'en-gaa-06', source: 'Please wait here', reference: 'Ofainɛ ota shi biɛ', domain: 'public' },
      { id: 'en-gaa-07', source: 'I need help', reference: 'Mi sumɔɔ yeɔɔ', domain: 'public' },
      { id: 'en-gaa-08', source: 'The office is closed', reference: 'Office lɛ ejoo', domain: 'public' },
      { id: 'en-gaa-09', source: 'Bring your identity card', reference: 'Ha o identity card ba', domain: 'public' },
      { id: 'en-gaa-10', source: 'Water is available', reference: 'Nu yɛ', domain: 'public' },
      { id: 'en-gaa-11', source: 'School starts tomorrow', reference: 'Sukuu baaje nwɛ', domain: 'education' },
      { id: 'en-gaa-12', source: 'The meeting is at noon', reference: 'Kpee lɛ yɛ shwane', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'ada',
    segments: [
      { id: 'en-ada-01', source: 'Hello', reference: 'Ngmɛɛ', domain: 'greetings' },
      { id: 'en-ada-02', source: 'Thank you', reference: 'Tɔɔ wa', domain: 'greetings' },
      { id: 'en-ada-03', source: 'How are you?', reference: 'Te o ye?', domain: 'greetings' },
      { id: 'en-ada-04', source: 'Good morning', reference: 'Nyɛ mi', domain: 'greetings' },
      { id: 'en-ada-05', source: 'Where is the clinic?', reference: 'Clinic ɔ lɛ mɛ?', domain: 'health' },
      { id: 'en-ada-06', source: 'Please wait here', reference: 'Ofainɛ ohiɛ biɛ', domain: 'public' },
      { id: 'en-ada-07', source: 'I need help', reference: 'I suɔ yeɔ', domain: 'public' },
      { id: 'en-ada-08', source: 'The office is closed', reference: 'Office ɔ ejo', domain: 'public' },
      { id: 'en-ada-09', source: 'Bring your identity card', reference: 'Ha o ID card ba', domain: 'public' },
      { id: 'en-ada-10', source: 'Water is available', reference: 'Nu ɔ ngɛ', domain: 'public' },
      { id: 'en-ada-11', source: 'School starts tomorrow', reference: 'Sukuu baaje hwɔ', domain: 'education' },
      { id: 'en-ada-12', source: 'The meeting is at noon', reference: 'Kpee ɔ ngɛ shwane', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'dag',
    segments: [
      { id: 'en-dag-01', source: 'Hello', reference: 'Desiba', domain: 'greetings' },
      { id: 'en-dag-02', source: 'Thank you', reference: 'Mbo', domain: 'greetings' },
      { id: 'en-dag-03', source: 'How are you?', reference: 'A wuhira?', domain: 'greetings' },
      { id: 'en-dag-04', source: 'Good morning', reference: 'Dasiba', domain: 'greetings' },
      { id: 'en-dag-05', source: 'Where is the clinic?', reference: 'Clinic maa be ya?', domain: 'health' },
      { id: 'en-dag-06', source: 'Please wait here', reference: 'Machiɛn ka a jili kpeŋ', domain: 'public' },
      { id: 'en-dag-07', source: 'I need help', reference: 'N bɔri sɔŋsim', domain: 'public' },
      { id: 'en-dag-08', source: 'The office is closed', reference: 'Office maa yooya', domain: 'public' },
      { id: 'en-dag-09', source: 'Bring your identity card', reference: 'Tahima a ID card', domain: 'public' },
      { id: 'en-dag-10', source: 'Water is available', reference: 'Kom be', domain: 'public' },
      { id: 'en-dag-11', source: 'School starts tomorrow', reference: 'Shikuru yɛn pili suhila', domain: 'education' },
      { id: 'en-dag-12', source: 'The meeting is at noon', reference: 'Laɣingu maa be wuntaŋni', domain: 'business' },
    ],
  },
];

export function pairKey(sourceLang: string, targetLang: string) {
  return `${sourceLang}-${targetLang}`;
}
