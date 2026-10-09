/**
 * Accent Identity Packs — tribe/culture/religion-linked speech identity for Lugemi Echo Voice.
 * Plain-text metadata; pronunciation markers are illustrative, not phonetic transcriptions.
 * culturalIdentity / speechVariety / lifestyleTags make cultural nativeness first-class in routing.
 */
import { ISO_COUNTRY_BY_CODE, isoCountryName } from '../country-packs/iso-countries';

export type AccentIdentitySeed = {
  id: string;
  nameEn: string;
  languageCode: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  regionTags: string[];
  accentCode?: string;
  dialectCode?: string;
  identityProfile: string;
  pronunciationMarkers: string[];
  samplePhrase: string;
  /** Lugemi Echo Voice own:* id for synthesis */
  echoVoiceId?: string;
  /** Model registry variant slug */
  echoModelVariant?: string;
  bcp47?: string;
  /**
   * Human cultural identity label (e.g. "Ghanaian English · Accra professional").
   * When omitted, derived at DTO time from name + region tags.
   */
  culturalIdentity?: string;
  /**
   * Machine speech variety slug (e.g. ghanaian_english, nigerian_pidgin, filipino_english).
   * When omitted, derived at DTO time.
   */
  speechVariety?: string;
  /** Lifestyle / culture tags a listener associates with this speech identity. */
  lifestyleTags?: string[];
};

export const ACCENT_IDENTITY_SEEDS: AccentIdentitySeed[] = [
  // —— Ghana ——
  {
    id: 'gh-twi-asante',
    nameEn: 'Asante Twi (Ghana)',
    languageCode: 'ak',
    country: 'GH',
    regionTags: ['Ghana', 'West Africa', 'Akan'],
    accentCode: 'ak-gh',
    dialectCode: 'ak-gh-asante',
    identityProfile:
      'Akan / Asante Twi speakers from Ashanti Region and urban Accra. Christian and traditional Akan cultural contexts; elder honorifics (Nana, Papa, Maame) shape polite speech.',
    pronunciationMarkers: ['medaase', 'akwaaba', 'ɛte sɛn', 'me pɛ', 'yɛ'],
    samplePhrase: 'Akwaaba! Medaase pa. Ɛte sɛn? Me din de Akosua, firi Kumasi.',
    echoVoiceId: 'own:ak-gh-female',
    echoModelVariant: 'lugemi-echo-voice-gh-twi',
    bcp47: 'ak-GH',
  },
  {
    id: 'gh-ghanaian-english',
    nameEn: 'Ghanaian English',
    languageCode: 'en',
    country: 'GH',
    regionTags: ['Ghana', 'West Africa', 'Ghanaian English'],
    accentCode: 'en-gh',
    dialectCode: 'en-gh-ghanaian-english',
    identityProfile:
      'Standard Ghanaian English — Accra and Kumasi professional, media, and classroom speech. Akan-influenced rhythm and polite register; listeners hear Ghanaian lifestyle (church, market, family honorifics) without Pidgin slang.',
    pronunciationMarkers: ['please', 'somehow', 'at all', 'medaase', 'you are welcome', 'small'],
    samplePhrase:
      'Good morning. You are welcome — somehow we can start now. Please, take your time; we will finish at all before lunch.',
    echoVoiceId: 'own:en-gh-female',
    echoModelVariant: 'lugemi-echo-voice-gh-english',
    bcp47: 'en-GH',
    culturalIdentity: 'Ghanaian English · Accra professional · Akan etiquette',
    speechVariety: 'ghanaian_english',
    lifestyleTags: ['accra_professional', 'akan_etiquette', 'west_african_english', 'church_and_market'],
  },
  {
    id: 'gh-pidgin',
    nameEn: 'Ghanaian Pidgin',
    languageCode: 'en',
    country: 'GH',
    regionTags: ['Ghana', 'West Africa', 'Pidgin'],
    accentCode: 'en-gh',
    dialectCode: 'en-gh-ghanaian-pidgin',
    identityProfile:
      'Urban Ghanaian Pidgin English — chale, charley, small-small rhythm. Cross-tribal street and market speech in Accra, Kumasi, and Takoradi.',
    pronunciationMarkers: ['chale', 'charley', 'small small', 'ɛ', 'please', 'how far'],
    samplePhrase: 'Chale, how far? I dey come small small. Charley, the thing be sweet paa!',
    echoVoiceId: 'own:en-gh-male',
    echoModelVariant: 'lugemi-echo-voice-gh-pidgin',
    bcp47: 'en-GH',
    culturalIdentity: 'Ghanaian Pidgin · Accra street · Cross-tribal',
    speechVariety: 'ghanaian_pidgin',
    lifestyleTags: ['chale_street', 'urban_ghana', 'market_rhythm', 'cross_tribal'],
  },
  {
    id: 'gh-fante',
    nameEn: 'Fante (Central Ghana)',
    languageCode: 'ak',
    country: 'GH',
    regionTags: ['Ghana', 'West Africa', 'Fante', 'Central Region'],
    dialectCode: 'ak-gh-fante',
    identityProfile:
      'Fante (Mfantse) speakers from Central and Western Ghana — Cape Coast, Elmina, Sekondi. Fishing and coastal trading communities; Akan family with distinct vowel coloring.',
    pronunciationMarkers: ['medaase', 'akwaaba', 'me din de', 'wo ho te sɛn'],
    samplePhrase: 'Akwaaba! Me din de Kofi. Medaase for welcoming me to Cape Coast.',
    echoVoiceId: 'own:ak-gh-female',
    echoModelVariant: 'lugemi-echo-voice-gh-fante',
    bcp47: 'ak-GH',
  },

  // —— Nigeria ——
  {
    id: 'ng-nigerian-english',
    nameEn: 'Nigerian English',
    languageCode: 'en',
    country: 'NG',
    regionTags: ['Nigeria', 'West Africa', 'Nigerian English'],
    accentCode: 'en-ng',
    dialectCode: 'en-ng',
    identityProfile:
      'Standard Nigerian English — Lagos, Abuja, and national media. Distinct from Pidgin and from UK/US English; listeners hear Naija lifestyle (traffic, family address, broadcast cadence) without requiring ethnic substrate markers.',
    pronunciationMarkers: ['please', 'somehow', 'at all', 'you people', 'I dey', 'ok na'],
    samplePhrase:
      'Good afternoon. Somehow we can begin now — please, you people should take your seats. We will finish at all before five.',
    echoVoiceId: 'own:en-ng-female',
    echoModelVariant: 'lugemi-echo-voice-ng-english',
    bcp47: 'en-NG',
    culturalIdentity: 'Nigerian English · Lagos / Abuja broadcast · Naija lifestyle',
    speechVariety: 'nigerian_english',
    lifestyleTags: ['lagos_professional', 'naija_english', 'west_african_english', 'media_broadcast'],
  },
  {
    id: 'ng-pidgin',
    nameEn: 'Nigerian Pidgin (Naijá)',
    languageCode: 'pcm',
    country: 'NG',
    regionTags: ['Nigeria', 'West Africa', 'Pidgin', 'Naijá'],
    accentCode: 'pcm-ng',
    dialectCode: 'pcm-ng-lagos',
    identityProfile:
      'Nigerian Pidgin — Lagos, Port Harcourt, Benin City street speech. Pan-ethnic urban identity cutting across Yoruba, Igbo, Hausa, and minority groups.',
    pronunciationMarkers: ['how far', 'abeg', 'wahala', 'dey', 'wetin', 'sabi', 'abi'],
    samplePhrase: 'How far, my guy? Abeg no vex — I dey find the place wey dem dey sell jollof.',
    echoVoiceId: 'own:pcm-ng-female',
    echoModelVariant: 'lugemi-echo-voice-ng-pidgin',
    bcp47: 'pcm-NG',
    culturalIdentity: 'Nigerian Pidgin · Lagos street · Pan-ethnic Naijá',
    speechVariety: 'nigerian_pidgin',
    lifestyleTags: ['naija', 'lagos_street', 'pan_ethnic', 'jollof_culture'],
  },
  {
    id: 'ng-yoruba-influence',
    nameEn: 'Yoruba-influenced English (Lagos)',
    languageCode: 'en',
    country: 'NG',
    regionTags: ['Nigeria', 'West Africa', 'Yoruba', 'Lagos'],
    accentCode: 'en-ng',
    dialectCode: 'yo-ng',
    identityProfile:
      'Yoruba-first speakers in Lagos and southwest Nigeria. English carries Yoruba tone patterns, syllable timing, and honorifics (Ẹ káàárọ̀, Bàbá, Ìyá).',
    pronunciationMarkers: ['abi', 'na wa', 'jare', 'sef', 'oya', 'wetin dey'],
    samplePhrase: 'Good morning o! Abi you don hear the news? Oya make we go before traffic catch us.',
    echoVoiceId: 'own:en-ng-male',
    echoModelVariant: 'lugemi-echo-voice-ng-yoruba',
    bcp47: 'en-NG',
    culturalIdentity: 'Yoruba-influenced English · Lagos · Southwest Nigeria',
    speechVariety: 'yoruba_influenced_english',
    lifestyleTags: ['lagos', 'yoruba_honorifics', 'southwest_nigeria'],
  },
  {
    id: 'ng-igbo-influence',
    nameEn: 'Igbo-influenced English (Southeast)',
    languageCode: 'en',
    country: 'NG',
    regionTags: ['Nigeria', 'West Africa', 'Igbo', 'Enugu'],
    accentCode: 'ig-ng',
    dialectCode: 'ig-ng-owerri',
    identityProfile:
      'Igbo speakers from Enugu, Onitsha, and Owerri. Distinct consonant clarity and syllable stress when code-switching to English in markets and schools.',
    pronunciationMarkers: ['ndewo', 'biko', 'kedu', 'how far', 'it is well'],
    samplePhrase: 'Ndewo! Biko, how far? Kedu? The meeting will start by four o’clock prompt.',
    echoVoiceId: 'own:ig-ng-female',
    echoModelVariant: 'lugemi-echo-voice-ng-igbo',
    bcp47: 'en-NG',
    culturalIdentity: 'Igbo-influenced English · Enugu · Southeast Nigeria',
    speechVariety: 'igbo_influenced_english',
    lifestyleTags: ['southeast_nigeria', 'market_clarity', 'enugu'],
  },
  {
    id: 'ng-hausa-influence',
    nameEn: 'Hausa-influenced English (North)',
    languageCode: 'en',
    country: 'NG',
    regionTags: ['Nigeria', 'West Africa', 'Hausa', 'Kano'],
    accentCode: 'ha-ng',
    dialectCode: 'ha-ng-kano',
    identityProfile:
      'Hausa speakers from Kano, Kaduna, and Sokoto. English shaped by Hausa vowel system and Islamic greeting culture (Sannu, Barka da safe).',
    pronunciationMarkers: ['sannu', 'na gode', 'lafiya', 'yaya', 'in sha Allah'],
    samplePhrase: 'Sannu! Lafiya lau. Na gode for your patience — we will begin shortly, in sha Allah.',
    echoVoiceId: 'own:ha-ng-male',
    echoModelVariant: 'lugemi-echo-voice-ng-hausa',
    bcp47: 'en-NG',
    culturalIdentity: 'Hausa-influenced English · Kano · Northern Nigeria',
    speechVariety: 'hausa_influenced_english',
    lifestyleTags: ['kano', 'islamic_greetings', 'northern_nigeria'],
  },
  {
    id: 'ng-yoruba-native',
    nameEn: 'Yoruba (native)',
    languageCode: 'yo',
    country: 'NG',
    regionTags: ['Nigeria', 'West Africa', 'Yoruba'],
    dialectCode: 'yo-ng',
    identityProfile:
      'Standard Nigerian Yorùbá — tonal language with three level tones plus contour. Used in ceremonies, media, and bilingual education.',
    pronunciationMarkers: ['Ẹ káàárọ̀', 'Ẹ kú', 'Béẹ̀ni', 'Jọ̀ọ́', 'O ṣeun'],
    samplePhrase: 'Ẹ káàárọ̀! Ẹ kú àárọ̀. Jọ̀ọ́, ṣe o lè sọ fun mi ni ibi ti a ti ń ta ọ̀gẹ̀dẹ̀?',
    echoVoiceId: 'own:yo-ng-male',
    echoModelVariant: 'lugemi-echo-voice-yo-native',
    bcp47: 'yo-NG',
  },

  // —— Philippines ——
  {
    id: 'ph-filipino-english',
    nameEn: 'Filipino English',
    languageCode: 'en',
    country: 'PH',
    regionTags: ['Philippines', 'Southeast Asia', 'Filipino English'],
    accentCode: 'en-ph',
    dialectCode: 'en-ph-filipino-english',
    identityProfile:
      'Filipino English — Tagalog substrate, Spanish loanwords, and American English schooling. Po/opo honorifics signal respect; common in BPO, nursing, and diaspora. Listeners immediately hear Philippine lifestyle and care culture.',
    pronunciationMarkers: ['po', 'opo', 'already', 'for a while', 'comfort room', 'salamat po'],
    samplePhrase:
      'Good morning po! I am already here for a while. Salamat po for waiting — shall we start the briefing now?',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-ph-english',
    bcp47: 'en-PH',
    culturalIdentity: 'Filipino English · Manila BPO / care · Po/opo respect',
    speechVariety: 'filipino_english',
    lifestyleTags: ['manila_bpo', 'po_opo_respect', 'nursing_diaspora', 'tagalog_substrate'],
  },
  {
    id: 'ph-tagalog',
    nameEn: 'Tagalog / Filipino (Manila)',
    languageCode: 'fil',
    country: 'PH',
    regionTags: ['Philippines', 'Southeast Asia', 'Tagalog'],
    dialectCode: 'tl-ph-manila',
    identityProfile:
      'Manila Tagalog — national Filipino base with po/opo respect particles. Catholic and folk-Catholic cultural references in daily speech.',
    pronunciationMarkers: ['po', 'opo', 'salamat', 'kumusta', 'magandang umaga'],
    samplePhrase: 'Magandang umaga po! Kumusta po kayo? Salamat po sa inyong oras ngayong umaga.',
    echoVoiceId: 'own:en-ph-female',
    echoModelVariant: 'lugemi-echo-voice-ph-tagalog',
    bcp47: 'fil-PH',
    culturalIdentity: 'Tagalog · Manila · National Filipino',
    speechVariety: 'tagalog',
    lifestyleTags: ['manila', 'catholic_folk', 'national_filipino'],
  },
  {
    id: 'ph-cebuano',
    nameEn: 'Cebuano (Visayas)',
    languageCode: 'ceb',
    country: 'PH',
    regionTags: ['Philippines', 'Southeast Asia', 'Cebuano', 'Visayas'],
    dialectCode: 'ceb-ph-cebu',
    identityProfile:
      'Cebuano speakers from Cebu City and Central Visayas. Distinct from Tagalog in rhythm and vocabulary; strong regional pride and Sinulog cultural identity.',
    pronunciationMarkers: ['salamat', 'kumusta', 'day', 'dong', 'palangga'],
    samplePhrase: 'Kumusta day! Salamat kaayo sa imong pag-abot. Andam na ta sa atong meeting.',
    echoVoiceId: 'own:en-ph-male',
    echoModelVariant: 'lugemi-echo-voice-ph-cebuano',
    bcp47: 'ceb-PH',
    culturalIdentity: 'Cebuano · Visayas · Sinulog regional pride',
    speechVariety: 'cebuano',
    lifestyleTags: ['visayas', 'sinulog', 'regional_pride'],
  },

  // —— South Africa ——
  {
    id: 'za-south-african-english',
    nameEn: 'South African English',
    languageCode: 'en',
    country: 'ZA',
    regionTags: ['South Africa', 'Southern Africa', 'South African English'],
    accentCode: 'en-za',
    dialectCode: 'en-za',
    identityProfile:
      'General South African English — Johannesburg, Cape Town, and national broadcast. Distinct vowel system and lexical markers (howzit, robot, just now); listeners hear rainbow-nation lifestyle without requiring a single ethnic substrate.',
    pronunciationMarkers: ['howzit', 'lekker', 'robot', 'just now', 'sharp', 'eish'],
    samplePhrase:
      'Howzit! Sharp — we can start just now. Turn left at the robot; the coffee is lekker today.',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-za-english',
    bcp47: 'en-ZA',
    culturalIdentity: 'South African English · National broadcast · Rainbow lifestyle',
    speechVariety: 'south_african_english',
    lifestyleTags: ['rainbow_nation', 'howzit', 'urban_professional', 'southern_africa'],
  },
  {
    id: 'za-zulu-english',
    nameEn: 'Zulu-influenced English',
    languageCode: 'en',
    country: 'ZA',
    regionTags: ['South Africa', 'Southern Africa', 'Zulu', 'KwaZulu-Natal'],
    accentCode: 'en-za',
    dialectCode: 'zu-za',
    identityProfile:
      'isiZulu-first speakers in Durban and KZN. English carries Zulu click-adjacent consonants and rhythmic stress; ubuntu values shape polite address.',
    pronunciationMarkers: ['sawubona', 'yebo', 'sharp sharp', 'howzit', 'lekker', 'just now'],
    samplePhrase: 'Sawubona! Howzit, my friend? Sharp sharp — we can start just now, it will be lekker.',
    echoVoiceId: 'own:en-za-female',
    echoModelVariant: 'lugemi-echo-voice-za-zulu',
    bcp47: 'en-ZA',
    culturalIdentity: 'Zulu-influenced English · Durban / KZN · Ubuntu',
    speechVariety: 'zulu_influenced_english',
    lifestyleTags: ['kwazulu_natal', 'ubuntu', 'durban'],
  },
  {
    id: 'za-xhosa-english',
    nameEn: 'Xhosa-influenced English',
    languageCode: 'en',
    country: 'ZA',
    regionTags: ['South Africa', 'Southern Africa', 'Xhosa', 'Eastern Cape'],
    accentCode: 'xh-za',
    dialectCode: 'xh-za-isixhosa',
    identityProfile:
      'isiXhosa speakers from Eastern Cape and Cape Town townships. Distinct click consonants influence English; strong oral tradition and clan identity (Molo, Unjani).',
    pronunciationMarkers: ['molo', 'enkosi', 'unjani', 'sharp', 'eish', 'now now'],
    samplePhrase: 'Molo! Unjani? Enkosi for coming — eish, the taxi was late but we are here now now.',
    echoVoiceId: 'own:en-za-male',
    echoModelVariant: 'lugemi-echo-voice-za-xhosa',
    bcp47: 'en-ZA',
    culturalIdentity: 'Xhosa-influenced English · Eastern Cape · Clan identity',
    speechVariety: 'xhosa_influenced_english',
    lifestyleTags: ['eastern_cape', 'clan_identity', 'oral_tradition'],
  },
  {
    id: 'za-afrikaans-english',
    nameEn: 'Afrikaans-influenced English',
    languageCode: 'en',
    country: 'ZA',
    regionTags: ['South Africa', 'Southern Africa', 'Afrikaans', 'Western Cape'],
    accentCode: 'en-za',
    identityProfile:
      'Afrikaans-English bilingual speakers in Cape Town and Western Cape. Dutch-Germanic vowel coloring on English; braai, robot (traffic light), and lekker are signature markers.',
    pronunciationMarkers: ['lekker', 'braai', 'robot', 'howzit', 'ag', 'sommer'],
    samplePhrase: 'Howzit! Lekker to see you. Turn left at the robot, then we can have a braai sommer.',
    echoVoiceId: 'own:af-za-female',
    echoModelVariant: 'lugemi-echo-voice-za-afrikaans',
    bcp47: 'en-ZA',
    culturalIdentity: 'Afrikaans-influenced English · Western Cape · Braai culture',
    speechVariety: 'afrikaans_influenced_english',
    lifestyleTags: ['western_cape', 'braai', 'cape_town'],
  },
  {
    id: 'za-township',
    nameEn: 'Township English patterns',
    languageCode: 'en',
    country: 'ZA',
    regionTags: ['South Africa', 'Southern Africa', 'Township', 'Soweto'],
    accentCode: 'en-za',
    identityProfile:
      'Urban township English — Soweto, Alexandra, Khayelitsha. Multilingual code-mixing (Zulu, Sotho, Tswana, Afrikaans) with distinct rhythm and slang (sharp sharp, eish, yebo).',
    pronunciationMarkers: ['sharp sharp', 'eish', 'yebo', 'howzit', 'chommie', 'now now'],
    samplePhrase: 'Eish chommie, sharp sharp! Yebo, I am on my way — howzit, are you still at the spot?',
    echoVoiceId: 'own:en-za-male',
    echoModelVariant: 'lugemi-echo-voice-za-township',
    bcp47: 'en-ZA',
    culturalIdentity: 'Township English · Soweto · Multilingual urban youth',
    speechVariety: 'township_english',
    lifestyleTags: ['soweto', 'multilingual_mix', 'urban_youth'],
  },
  {
    id: 'za-zulu-native',
    nameEn: 'isiZulu (native)',
    languageCode: 'zu',
    country: 'ZA',
    regionTags: ['South Africa', 'Southern Africa', 'Zulu'],
    accentCode: 'zu-za',
    dialectCode: 'zu-za',
    identityProfile:
      'Standard isiZulu — tonal language with noun classes. Used in KZN media, schools, and traditional ceremonies.',
    pronunciationMarkers: ['sawubona', 'ngiyabonga', 'unjani', 'yebo', 'cha'],
    samplePhrase: 'Sawubona! Ngiyabonga kakhulu. Unjani namhlanje? Yebo, siyakwamukela.',
    echoVoiceId: 'own:zu-za-female',
    echoModelVariant: 'lugemi-echo-voice-zu-native',
    bcp47: 'zu-ZA',
  },

  // —— Kenya ——
  {
    id: 'ke-swahili-sheng',
    nameEn: 'Kenyan Swahili / Sheng',
    languageCode: 'sw',
    country: 'KE',
    regionTags: ['Kenya', 'East Africa', 'Swahili', 'Sheng'],
    accentCode: 'sw-ke',
    dialectCode: 'sw-ke',
    identityProfile:
      'Urban Kenyan Swahili with Sheng street mix — Nairobi, Mombasa. Younger speakers blend English, Swahili, and local languages.',
    pronunciationMarkers: ['sasa', 'poa', 'niaje', 'safi', 'bro', 'msee'],
    samplePhrase: 'Niaje bro! Safi sana. Sasa tuende town — poa, niko ready.',
    echoVoiceId: 'own:sw-ke-female',
    echoModelVariant: 'lugemi-echo-voice-ke-swahili',
    bcp47: 'sw-KE',
  },
  {
    id: 'ke-english',
    nameEn: 'Kenyan English',
    languageCode: 'en',
    country: 'KE',
    regionTags: ['Kenya', 'East Africa'],
    accentCode: 'en-ke',
    identityProfile:
      'Kenyan English — Bantu-influenced rhythm, British schooling legacy. Pole, sasa, and hakuna are common loanwords in English sentences.',
    pronunciationMarkers: ['sasa', 'pole', 'hakuna', 'niaje', 'mzungu', 'kwani'],
    samplePhrase: 'Sasa, pole for the delay. Kwani, did you get my message? Hakuna matata — we can reschedule.',
    echoVoiceId: 'own:sw-ke-female',
    echoModelVariant: 'lugemi-echo-voice-ke-english',
    bcp47: 'en-KE',
  },

  // —— Senegal ——
  {
    id: 'sn-wolof-french',
    nameEn: 'Wolof-influenced French (Dakar)',
    languageCode: 'fr',
    country: 'SN',
    regionTags: ['Senegal', 'West Africa', 'Wolof', 'Francophone'],
    accentCode: 'fr-sn',
    dialectCode: 'wo-sn-dakar',
    identityProfile:
      'Dakar French with Wolof substrate — teranga hospitality, Muslim greetings (As-salamu alaykum / Waaw), and Wolof particles in French sentences.',
    pronunciationMarkers: ['nanga def', 'jërëjëf', 'waaw', 'yow', 'dégg na'],
    samplePhrase: 'Bonjour! Nanga def? Jërëjëf pour votre patience — on peut commencer maintenant, waaw?',
    echoVoiceId: 'own:fr-sn-female',
    echoModelVariant: 'lugemi-echo-voice-sn-wolof-fr',
    bcp47: 'fr-SN',
  },

  // —— Egypt ——
  {
    id: 'eg-arabic',
    nameEn: 'Egyptian Arabic (Cairene)',
    languageCode: 'ar',
    country: 'EG',
    regionTags: ['Egypt', 'North Africa', 'MENA', 'Arabic'],
    accentCode: 'ar-eg',
    dialectCode: 'ar-eg',
    identityProfile:
      'Cairene colloquial Arabic — Muslim-majority urban culture. Distinct from MSA in pronunciation of ج, ق, and vowel quality.',
    pronunciationMarkers: ['ازيك', 'كده', 'مش', 'علشان', 'يعني', 'دلوقتي'],
    samplePhrase: 'ازيك؟ أنا كويس، الحمد لله. دلوقتي نقدر نبدأ الاجتماع — مش كده؟',
    echoVoiceId: 'own:ar-eg-male',
    echoModelVariant: 'lugemi-echo-voice-eg-arabic',
    bcp47: 'ar-EG',
  },

  // —— Ethiopia ——
  {
    id: 'et-amharic',
    nameEn: 'Amharic (Addis Ababa)',
    languageCode: 'am',
    country: 'ET',
    regionTags: ['Ethiopia', 'East Africa', 'Amharic', 'Orthodox Christian'],
    dialectCode: 'am-et',
    identityProfile:
      'Amharic — Ethiopian Orthodox Christian and Muslim communities. Ge’ez script; distinct ejective consonants and seven-vowel system.',
    pronunciationMarkers: ['ሰላም', 'አመሰግናለሁ', 'እባክህ', 'እንዴት', 'ደህና'],
    samplePhrase: 'ሰላም! እንዴት ናችሁ? አመሰግናለሁ — እባክህ, ስብሰባውን እንጀምር.',
    echoVoiceId: 'own:am-et-female',
    echoModelVariant: 'lugemi-echo-voice-et-amharic',
    bcp47: 'am-ET',
  },

  // —— Southeast Asia ——
  {
    id: 'th-central',
    nameEn: 'Central Thai (Bangkok)',
    languageCode: 'th',
    country: 'TH',
    regionTags: ['Thailand', 'Southeast Asia', 'Buddhist'],
    accentCode: 'th-th',
    dialectCode: 'th-th-central',
    identityProfile:
      'Bangkok Central Thai — Buddhist greeting culture (wai), polite particles khráp/khâ for gendered respect.',
    pronunciationMarkers: ['khrap', 'kha', 'sawatdee', 'kop khun', 'mai pen rai'],
    samplePhrase: 'Sawatdee khrap! Kop khun mak khrap — mai pen rai, we can start the demo now.',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-th-central',
    bcp47: 'th-TH',
  },
  {
    id: 'vn-hanoi',
    nameEn: 'Northern Vietnamese (Hanoi)',
    languageCode: 'vi',
    country: 'VN',
    regionTags: ['Vietnam', 'Southeast Asia'],
    accentCode: 'vi-vn',
    dialectCode: 'vi-vn-hanoi',
    identityProfile:
      'Hanoi Vietnamese — six tones, distinct from Saigon in vowel quality. Confucian-influenced honorifics in formal speech.',
    pronunciationMarkers: ['a', 'nhe', 'cam on', 'xin chao', 'vang a'],
    samplePhrase: 'Xin chao! Cam on ban da den. Vang a, chung ta co the bat dau bay gio nhe.',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-vn-hanoi',
    bcp47: 'vi-VN',
  },
  {
    id: 'my-kuala-lumpur',
    nameEn: 'Malaysian Malay (KL)',
    languageCode: 'ms',
    country: 'MY',
    regionTags: ['Malaysia', 'Southeast Asia', 'Malay', 'Muslim'],
    accentCode: 'ms-my',
    dialectCode: 'ms-my-standard',
    identityProfile:
      'Kuala Lumpur Malay — Bahasa Malaysia with English code-mixing (Manglish). Muslim greeting Assalamualaikum common; lah particle for emphasis.',
    pronunciationMarkers: ['lah', 'terima kasih', 'boleh', 'jom', 'macam mana'],
    samplePhrase: 'Assalamualaikum! Terima kasih lah. Jom, we can start the briefing now — boleh?',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-my-malay',
    bcp47: 'ms-MY',
  },
  {
    id: 'id-javanese',
    nameEn: 'Central Javanese',
    languageCode: 'jv',
    country: 'ID',
    regionTags: ['Indonesia', 'Southeast Asia', 'Javanese', 'Muslim'],
    dialectCode: 'jv-id-central',
    identityProfile:
      'Central Javanese — Yogyakarta and Solo. Distinct levels of speech (kromo, madya, ngoko) for social hierarchy; strong batik and gamelan cultural identity.',
    pronunciationMarkers: ['matur nuwun', 'sugeng enjing', 'kula', 'sampeyan', 'mangga'],
    samplePhrase: 'Sugeng enjing! Matur nuwun sanget. Mangga, kita bisa mulai demo saiki.',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-id-javanese',
    bcp47: 'jv-ID',
  },

  // —— MENA ——
  {
    id: 'sa-gulf-arabic',
    nameEn: 'Gulf Arabic',
    languageCode: 'ar',
    country: 'SA',
    regionTags: ['Saudi Arabia', 'MENA', 'Gulf', 'Arabic', 'Muslim'],
    accentCode: 'ar-sa',
    dialectCode: 'ar-sa-hijazi',
    identityProfile:
      'Gulf / Hijazi Arabic — distinct from Egyptian and Levantine. Muslim prayer-time greetings shape daily rhythm.',
    pronunciationMarkers: ['shlonak', 'zain', 'yalla', 'inshallah', 'mashallah'],
    samplePhrase: 'Marhaba! Shlonak? Zain, yalla — inshallah we can begin the session now.',
    echoVoiceId: 'own:ar-eg-male',
    echoModelVariant: 'lugemi-echo-voice-sa-gulf',
    bcp47: 'ar-SA',
  },
  {
    id: 'lb-levantine',
    nameEn: 'Levantine Arabic',
    languageCode: 'ar',
    country: 'LB',
    regionTags: ['Lebanon', 'MENA', 'Levantine', 'Arabic'],
    accentCode: 'ar-lb',
    identityProfile:
      'Levantine Arabic — Beirut and coastal Lebanon. French and English code-mixing in urban speech; Christian and Muslim communities.',
    pronunciationMarkers: ['kifak', 'yalla', 'habibi', 'khalas', 'ahla'],
    samplePhrase: 'Ahla! Kifak? Yalla habibi, khalas — we can start the demo whenever you are ready.',
    echoVoiceId: 'own:ar-eg-male',
    echoModelVariant: 'lugemi-echo-voice-lb-levantine',
    bcp47: 'ar-LB',
  },

  // —— Europe / Americas ——
  {
    id: 'gb-british',
    nameEn: 'British English',
    languageCode: 'en',
    country: 'GB',
    regionTags: ['United Kingdom', 'Europe'],
    accentCode: 'en-gb',
    dialectCode: 'en-gb-british',
    identityProfile:
      'Received Pronunciation and general British English — BBC-influenced standard with regional variants across England, Scotland, and Wales.',
    pronunciationMarkers: ['cheers', 'brilliant', 'quite', 'rather', 'mate'],
    samplePhrase: 'Cheers! Brilliant — shall we crack on with the demo? Quite straightforward, really.',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-gb-english',
    bcp47: 'en-GB',
  },
  {
    id: 'us-general-american',
    nameEn: 'General American English',
    languageCode: 'en',
    country: 'US',
    regionTags: ['United States', 'North America'],
    accentCode: 'en-us',
    dialectCode: 'en-us-general-american',
    identityProfile:
      'General American — broadcast and tech-industry baseline. Neutral rhotic vowels; diverse ethnic communities add regional coloring.',
    pronunciationMarkers: ['yeah', 'okay', 'awesome', 'got it', 'sure thing'],
    samplePhrase: 'Hey, yeah — okay, awesome! Got it. Sure thing, we can kick off the demo right now.',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-us-english',
    bcp47: 'en-US',
  },
  {
    id: 'mx-spanish',
    nameEn: 'Mexican Spanish',
    languageCode: 'es',
    country: 'MX',
    regionTags: ['Mexico', 'Latin America'],
    accentCode: 'es-mx',
    dialectCode: 'es-mx-mexican',
    identityProfile:
      'Mexico City Spanish — indigenous Nahuatl loanwords, Catholic cultural references, distinct seseo and rhythm from Spain.',
    pronunciationMarkers: ['orale', 'que onda', 'chido', 'ahorita', 'mande'],
    samplePhrase: 'Que onda! Orale, ahorita empezamos la demo — esta chido, vamos.',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-mx-spanish',
    bcp47: 'es-MX',
  },
  {
    id: 'br-portuguese',
    nameEn: 'Brazilian Portuguese (São Paulo)',
    languageCode: 'pt',
    country: 'BR',
    regionTags: ['Brazil', 'Latin America'],
    accentCode: 'pt-br',
    dialectCode: 'pt-br-brazilian',
    identityProfile:
      'São Paulo Brazilian Portuguese — African and indigenous influences. Distinct vowel reduction and rhythm from European Portuguese.',
    pronunciationMarkers: ['cara', 'valeu', 'beleza', 'e ai', 'legal'],
    samplePhrase: 'E ai, cara! Beleza? Valeu por vir — legal, vamos comecar a demo agora.',
    echoVoiceId: 'own:pt-ao-male',
    echoModelVariant: 'lugemi-echo-voice-br-portuguese',
    bcp47: 'pt-BR',
  },
  {
    id: 'ht-creole',
    nameEn: 'Haitian Creole',
    languageCode: 'ht',
    country: 'HT',
    regionTags: ['Haiti', 'Caribbean', 'Creole'],
    accentCode: 'ht-ht',
    dialectCode: 'ht-ht-standard',
    identityProfile:
      'Haitian Kreyòl — French-African substrate, Vodou and Catholic cultural layers. National language alongside French.',
    pronunciationMarkers: ['mesi', 'sak pase', 'bonjou', 'kijan ou ye', 'wi'],
    samplePhrase: 'Bonjou! Sak pase? Mesi anpil — wi, nou ka kòmanse demo a kounye a.',
    echoVoiceId: 'own:en-kofi',
    echoModelVariant: 'lugemi-echo-voice-ht-creole',
    bcp47: 'ht-HT',
  },

  // —— Additional African ——
  {
    id: 'tz-swahili-coastal',
    nameEn: 'Tanzanian coastal Swahili',
    languageCode: 'sw',
    country: 'TZ',
    regionTags: ['Tanzania', 'East Africa', 'Swahili', 'Coastal'],
    accentCode: 'sw-ke',
    dialectCode: 'sw-tz',
    identityProfile:
      'Coastal Tanzanian Kiswahili — Zanzibar and Dar es Salaam. Reference standard for East African Swahili media and education.',
    pronunciationMarkers: ['asante sana', 'karibu', 'tafadhali', 'sana', 'labda'],
    samplePhrase: 'Karibu sana! Asante kwa kufika. Tafadhali, tuweze kuanza demo sasa hivi.',
    echoVoiceId: 'own:sw-ke-female',
    echoModelVariant: 'lugemi-echo-voice-tz-swahili',
    bcp47: 'sw-TZ',
  },
  {
    id: 'ci-ivorian-french',
    nameEn: 'Ivorian French (Nouchi)',
    languageCode: 'fr',
    country: 'CI',
    regionTags: ['Côte d\'Ivoire', 'West Africa', 'Francophone'],
    accentCode: 'fr-ci',
    dialectCode: 'fr-ci-ivorian-french',
    identityProfile:
      'Abidjan French with Nouchi street slang — multi-ethnic urban identity (Baoulé, Dioula, Bété). "On est ensemble" solidarity phrase.',
    pronunciationMarkers: ['yako', 'on est ensemble', 'c\'est comment', 'ca va', 'meme'],
    samplePhrase: 'Ca va, yako! On est ensemble — c\'est comment? On peut commencer la demo maintenant.',
    echoVoiceId: 'own:fr-sn-female',
    echoModelVariant: 'lugemi-echo-voice-ci-french',
    bcp47: 'fr-CI',
  },
  {
    id: 'cm-pidgin',
    nameEn: 'Cameroonian Pidgin',
    languageCode: 'en',
    country: 'CM',
    regionTags: ['Cameroon', 'Central Africa', 'Pidgin'],
    dialectCode: 'en-cm-cameroonian-pidgin',
    identityProfile:
      'Cameroonian Pidgin English — Douala and Yaoundé. Francophone-Anglophone bridge language with distinct vocabulary from Nigerian Pidgin.',
    pronunciationMarkers: ['how far', 'na so', 'wetin', 'make we', 'sabi'],
    samplePhrase: 'How far my friend? Make we start the demo na so — I sabi say you dey ready.',
    echoVoiceId: 'own:pcm-ng-female',
    echoModelVariant: 'lugemi-echo-voice-cm-pidgin',
    bcp47: 'en-CM',
  },
  {
    id: 'rw-kinyarwanda',
    nameEn: 'Kinyarwanda (Kigali)',
    languageCode: 'rw',
    country: 'RW',
    regionTags: ['Rwanda', 'East Africa', 'Kinyarwanda'],
    identityProfile:
      'Kinyarwanda — tonal Bantu language of Rwanda. Post-genocide reconciliation culture shapes polite and inclusive address.',
    pronunciationMarkers: ['muraho', 'murakoze', 'amakuru', 'yego', 'oya'],
    samplePhrase: 'Muraho! Murakoze cyane. Amakuru? Yego, dushobora gutangira demo ubu.',
    echoVoiceId: 'own:rw-rw-female',
    echoModelVariant: 'lugemi-echo-voice-rw-kinyarwanda',
    bcp47: 'rw-RW',
  },
  {
    id: 'ao-portuguese',
    nameEn: 'Angolan Portuguese',
    languageCode: 'pt',
    country: 'AO',
    regionTags: ['Angola', 'Southern Africa', 'Lusophone'],
    dialectCode: 'pt-ao-angolan-portuguese',
    identityProfile:
      'Luanda Portuguese — Kimbundu and Umbundu substrate. Distinct nasal vowels and rhythm from Brazil and Portugal.',
    pronunciationMarkers: ['obrigado', 'esta bem', 'pois', 'fixe', 'bué'],
    samplePhrase: 'Ola! Esta bem? Obrigado por vir — pois, podemos comecar a demo agora, fixe.',
    echoVoiceId: 'own:pt-ao-male',
    echoModelVariant: 'lugemi-echo-voice-ao-portuguese',
    bcp47: 'pt-AO',
  },
];

/** Full ISO labels for accent identity filters. */
export const COUNTRY_LABELS: Record<string, string> = Object.fromEntries(
  Object.keys(ISO_COUNTRY_BY_CODE).map((code) => [code, isoCountryName(code)]),
);

export function countryFlag(country: string): string {
  const code = country.toUpperCase();
  if (code.length !== 2) return '🌍';
  const offset = 0x1f1e6;
  const chars = [...code].map((c) => String.fromCodePoint(offset + c.charCodeAt(0) - 65));
  return chars.join('');
}
