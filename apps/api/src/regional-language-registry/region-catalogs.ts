import { africanLanguageSeed } from '../african-language-registry/african-language-registry.catalog';
import type { RegionalLanguageEntry, WorldRegionId } from './regional-language-registry.types';

function entry(
  partial: Omit<RegionalLanguageEntry, 'quality' | 'notes' | 'accents'> & {
    quality?: RegionalLanguageEntry['quality'];
    notes?: string;
    accents?: string[];
  },
): RegionalLanguageEntry {
  return {
    ...partial,
    accents: partial.accents ?? [],
    quality: partial.quality ?? 'catalog',
    notes:
      partial.notes ??
      'Registered for selection/routing across translate, STT, TTS, and chat.',
  };
}

/** Southeast Asia — languages, dialects, accents, lifestyle context. */
export function seaLanguageSeed(): RegionalLanguageEntry[] {
  return [
    entry({
      code: 'th',
      name: 'Thai',
      nativeName: 'ไทย',
      family: 'Tai-Kadai',
      writingSystems: ['Thai'],
      dialects: ['Central Thai', 'Northern Thai (Lanna)', 'Isan', 'Southern Thai'],
      accents: ['Bangkok Thai (spoken)', 'Isan Thai (spoken)'],
      regions: ['Thailand'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['wai greeting', 'shoe removal indoors'],
        routines: ['temple offerings on Buddhist holy days', 'night-market dining'],
        culturalNotes: 'Hierarchy and polite particles shape address in Thai.',
      },
      quality: 'production',
    }),
    entry({
      code: 'vi',
      name: 'Vietnamese',
      nativeName: 'Tiếng Việt',
      family: 'Austroasiatic',
      writingSystems: ['Latn'],
      dialects: ['Northern (Hanoi)', 'Central (Hue)', 'Southern (Saigon)'],
      accents: ['Hanoi Vietnamese (spoken)', 'Saigon Vietnamese (spoken)'],
      regions: ['Vietnam'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['morning street coffee', 'lunar new year family visits'],
        routines: ['commute by scooter', 'evening family meals'],
        culturalNotes: 'Tone and kinship terms carry social distance.',
      },
      quality: 'production',
    }),
    entry({
      code: 'id',
      name: 'Indonesian',
      nativeName: 'Bahasa Indonesia',
      family: 'Austronesian',
      writingSystems: ['Latn'],
      dialects: ['Standard Indonesian', 'Jakarta colloquial', 'Medan'],
      accents: ['Jakarta Indonesian (spoken)'],
      regions: ['Indonesia'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['gotong royong mutual aid', 'Ramadan iftars where observed'],
        routines: ['rice-centered meals', 'Friday mosque attendance for many Muslims'],
        culturalNotes: 'Bahasa Indonesia unifies many island language communities.',
      },
      quality: 'production',
    }),
    entry({
      code: 'ms',
      name: 'Malay',
      nativeName: 'Bahasa Melayu',
      family: 'Austronesian',
      writingSystems: ['Latn', 'Arab'],
      dialects: ['Standard Malay', 'Kelantan', 'Kedah'],
      accents: ['Kuala Lumpur Malay (spoken)'],
      regions: ['Malaysia', 'Brunei', 'Singapore'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['open-house festive visiting', 'halal food norms'],
        routines: ['weekend pasar malam', 'Friday prayers'],
        culturalNotes: 'Register shifts between formal Malay and colloquial.',
      },
      quality: 'production',
    }),
    entry({
      code: 'fil',
      name: 'Filipino',
      nativeName: 'Filipino',
      family: 'Austronesian',
      writingSystems: ['Latn'],
      dialects: ['Manila Tagalog', 'Batangas', 'Cavite'],
      accents: ['Manila Filipino (spoken)'],
      regions: ['Philippines'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['fiesta patronage', 'remittance-linked family calls'],
        routines: ['jeepney and MRT commuting', 'Sunday family gatherings'],
        culturalNotes: 'Code-switching with English is common in urban speech.',
      },
      quality: 'production',
    }),
    entry({
      code: 'tl',
      name: 'Tagalog',
      nativeName: 'Tagalog',
      family: 'Austronesian',
      writingSystems: ['Latn'],
      dialects: ['Manila', 'Batangas'],
      accents: ['Manila Tagalog (spoken)'],
      regions: ['Philippines'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['respect particles po/opo'],
        routines: ['family-first weekends'],
        culturalNotes: 'Basis of Filipino; keep Tagalog selectable for dialect routing.',
      },
    }),
    entry({
      code: 'km',
      name: 'Khmer',
      nativeName: 'ខ្មែរ',
      family: 'Austroasiatic',
      writingSystems: ['Khmr'],
      dialects: ['Phnom Penh', 'Battambang'],
      accents: ['Phnom Penh Khmer (spoken)'],
      regions: ['Cambodia'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['sampeah greeting', 'pagoda offerings'],
        routines: ['rice farming calendars', 'water festival'],
        culturalNotes: 'Honorifics and Buddhist calendar references matter in copy.',
      },
    }),
    entry({
      code: 'lo',
      name: 'Lao',
      nativeName: 'ລາວ',
      family: 'Tai-Kadai',
      writingSystems: ['Laoo'],
      dialects: ['Vientiane', 'Northern Lao'],
      accents: ['Vientiane Lao (spoken)'],
      regions: ['Laos'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['baci ceremony blessings', 'temple alms giving'],
        routines: ['morning markets', 'sticky-rice meals'],
        culturalNotes: 'Close to Thai Isan; orthography differs.',
      },
    }),
    entry({
      code: 'my',
      name: 'Burmese',
      nativeName: 'မြန်မာ',
      family: 'Sino-Tibetan',
      writingSystems: ['Mymr'],
      dialects: ['Yangon', 'Mandalay', 'Rakhine'],
      accents: ['Yangon Burmese (spoken)'],
      regions: ['Myanmar'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['Thingyan water festival', 'pagoda visits'],
        routines: ['tea-shop gatherings', 'longyi daily wear'],
        culturalNotes: 'Respect registers and Buddhist calendar terms.',
      },
    }),
    entry({
      code: 'jv',
      name: 'Javanese',
      nativeName: 'Basa Jawa',
      family: 'Austronesian',
      writingSystems: ['Latn', 'Java'],
      dialects: ['Ngoko', 'Krama', 'Surakarta', 'Yogyakarta'],
      accents: ['Central Javanese (spoken)'],
      regions: ['Indonesia (Java)'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['speech-level politeness (unggah-ungguh)'],
        routines: ['gotong royong', 'wayang evenings'],
        culturalNotes: 'Speech levels are cultural, not optional decoration.',
      },
    }),
    entry({
      code: 'su',
      name: 'Sundanese',
      nativeName: 'Basa Sunda',
      family: 'Austronesian',
      writingSystems: ['Latn'],
      dialects: ['Priangan', 'Northern Sundanese'],
      accents: ['Bandung Sundanese (spoken)'],
      regions: ['Indonesia (West Java)'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['sopan santun politeness'],
        routines: ['highland farming cycles'],
        culturalNotes: 'West Java community language alongside Indonesian.',
      },
    }),
    entry({
      code: 'ceb',
      name: 'Cebuano',
      nativeName: 'Binisaya',
      family: 'Austronesian',
      writingSystems: ['Latn'],
      dialects: ['Cebu City', 'Mindanao Cebuano'],
      accents: ['Cebu Cebuano (spoken)'],
      regions: ['Philippines (Visayas / Mindanao)'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['fiesta calendars', 'seafaring trade ties'],
        routines: ['market mornings'],
        culturalNotes: 'Widely spoken Visayan language.',
      },
    }),
    entry({
      code: 'tet',
      name: 'Tetum',
      nativeName: 'Tetun',
      family: 'Austronesian',
      writingSystems: ['Latn'],
      dialects: ['Tetun Dili', 'Tetun Terik'],
      accents: ['Dili Tetum (spoken)'],
      regions: ['Timor-Leste'],
      worldRegions: ['sea', 'global'],
      lifestyle: {
        habits: ['Portuguese co-official contexts'],
        routines: ['church and community gatherings'],
        culturalNotes: 'Co-official with Portuguese in Timor-Leste.',
      },
    }),
    entry({
      code: 'hmn',
      name: 'Hmong',
      nativeName: 'Hmoob',
      family: 'Hmong-Mien',
      writingSystems: ['Latn'],
      dialects: ['White Hmong', 'Green Hmong'],
      accents: ['White Hmong (spoken)'],
      regions: ['Vietnam', 'Laos', 'Thailand', 'diaspora'],
      worldRegions: ['sea', 'global', 'na'],
      lifestyle: {
        habits: ['New Year clan gatherings', 'oral storytelling'],
        routines: ['highland agricultural cycles'],
        culturalNotes: 'Diaspora communities also strong in North America.',
      },
    }),
  ];
}

/** Middle East — Arabic shared with Africa catalog via dual worldRegions where needed. */
export function menaLanguageSeed(): RegionalLanguageEntry[] {
  return [
    entry({
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      family: 'Afro-Asiatic',
      writingSystems: ['Arab', 'Latn'],
      dialects: ['Gulf Arabic', 'Levantine', 'Iraqi', 'Hijazi', 'Najdi', 'MSA'],
      accents: ['Gulf Arabic (spoken)', 'Levantine Arabic (spoken)', 'Iraqi Arabic (spoken)'],
      regions: ['Gulf', 'Levant', 'Iraq', 'Arabian Peninsula'],
      worldRegions: ['mena', 'global'],
      lifestyle: {
        habits: ['Ramadan fasting and iftars', 'Friday congregational prayer'],
        routines: ['diwaniya / majlis visiting', 'late evening social hours in Gulf'],
        culturalNotes: 'MSA for formal; dialects for voice and chat routing.',
      },
      quality: 'production',
    }),
    entry({
      code: 'fa',
      name: 'Persian (Farsi)',
      nativeName: 'فارسی',
      family: 'Indo-European',
      writingSystems: ['Arab'],
      dialects: ['Tehrani', 'Isfahani', 'Dari bridge'],
      accents: ['Tehran Persian (spoken)'],
      regions: ['Iran'],
      worldRegions: ['mena', 'global'],
      lifestyle: {
        habits: ['taarof politeness rituals', 'Nowruz visits'],
        routines: ['tea hospitality', 'poetry and music gatherings'],
        culturalNotes: 'High-context politeness; avoid overly direct marketing tone.',
      },
      quality: 'production',
    }),
    entry({
      code: 'he',
      name: 'Hebrew',
      nativeName: 'עברית',
      family: 'Afro-Asiatic',
      writingSystems: ['Hebr'],
      dialects: ['Modern Israeli Hebrew', 'Mizrahi-influenced'],
      accents: ['Tel Aviv Hebrew (spoken)'],
      regions: ['Israel'],
      worldRegions: ['mena', 'global'],
      lifestyle: {
        habits: ['Shabbat family meals', 'holiday calendar'],
        routines: ['Sunday–Thursday work week common'],
        culturalNotes: 'RTL; mix of religious and secular registers.',
      },
      quality: 'production',
    }),
    entry({
      code: 'tr',
      name: 'Turkish',
      nativeName: 'Türkçe',
      family: 'Turkic',
      writingSystems: ['Latn'],
      dialects: ['Istanbul', 'Aegean', 'Eastern Anatolian'],
      accents: ['Istanbul Turkish (spoken)'],
      regions: ['Türkiye'],
      worldRegions: ['mena', 'eu', 'global'],
      lifestyle: {
        habits: ['çay culture', 'bayram visits'],
        routines: ['evening family meals', 'neighborhood pazar'],
        culturalNotes: 'Formal siz vs informal sen address.',
      },
      quality: 'production',
    }),
    entry({
      code: 'ur',
      name: 'Urdu',
      nativeName: 'اردو',
      family: 'Indo-European',
      writingSystems: ['Arab'],
      dialects: ['Standard Urdu', 'Dakhini'],
      accents: ['Karachi Urdu (spoken)', 'Lahore Urdu (spoken)'],
      regions: ['Pakistan', 'diaspora Gulf'],
      worldRegions: ['mena', 'global'],
      lifestyle: {
        habits: ['Ramadan and Eid hospitality', 'extended-family visiting'],
        routines: ['chai breaks', 'late dinners'],
        culturalNotes: 'Shared continuum with Hindi; script and register differ.',
      },
      quality: 'production',
    }),
    entry({
      code: 'ps',
      name: 'Pashto',
      nativeName: 'پښتو',
      family: 'Indo-European',
      writingSystems: ['Arab'],
      dialects: ['Northern Pashto', 'Southern Pashto'],
      accents: ['Kabul Pashto (spoken)'],
      regions: ['Afghanistan', 'Pakistan'],
      worldRegions: ['mena', 'global'],
      lifestyle: {
        habits: ['Pashtunwali hospitality norms'],
        routines: ['communal meals', 'jerga consultation contexts'],
        culturalNotes: 'Honor and hospitality language is culturally loaded.',
      },
    }),
    entry({
      code: 'ku',
      name: 'Kurdish (Kurmanji)',
      nativeName: 'Kurdî',
      family: 'Indo-European',
      writingSystems: ['Latn', 'Arab'],
      dialects: ['Kurmanji', 'Sorani bridge'],
      accents: ['Kurmanji (spoken)'],
      regions: ['Kurdistan region', 'Türkiye', 'Iraq', 'Syria', 'Iran'],
      worldRegions: ['mena', 'eu', 'global'],
      lifestyle: {
        habits: ['Newroz celebrations', 'oral epic traditions'],
        routines: ['tea hospitality'],
        culturalNotes: 'Multiple scripts; prefer Latn for Kurmanji product UI.',
      },
    }),
    entry({
      code: 'ckb',
      name: 'Central Kurdish (Sorani)',
      nativeName: 'کوردیی ناوەندی',
      family: 'Indo-European',
      writingSystems: ['Arab'],
      dialects: ['Sulaymaniyah', 'Erbil'],
      accents: ['Sorani (spoken)'],
      regions: ['Iraq', 'Iran'],
      worldRegions: ['mena', 'global'],
      lifestyle: {
        habits: ['Newroz', 'family compound visiting'],
        routines: ['market mornings'],
        culturalNotes: 'Arabic-script Sorani for Iraqi Kurdistan routing.',
      },
    }),
  ];
}

export function euLanguageSeed(): RegionalLanguageEntry[] {
  const romanceGermanic: RegionalLanguageEntry[] = [
    entry({
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard German', 'Bavarian', 'Swiss German bridge', 'Austrian'],
      accents: ['Berlin German (spoken)', 'Bavarian German (spoken)'],
      regions: ['Germany', 'Austria', 'Belgium', 'Luxembourg'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['punctual appointments', 'formal Sie address until invited'],
        routines: ['Sunday quiet hours', 'Christmas markets'],
        culturalNotes: 'Formality and data-privacy tone matter in product copy.',
      },
      quality: 'production',
    }),
    entry({
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Metropolitan French', 'Belgian French', 'Swiss French'],
      accents: ['Parisian French (spoken)', 'Belgian French (spoken)'],
      regions: ['France', 'Belgium', 'Luxembourg'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['long midday meals', 'vous/tu register'],
        routines: ['August holiday season', 'café culture'],
        culturalNotes: 'Also strategic in African francophone markets via Africa catalog.',
      },
      quality: 'production',
    }),
    entry({
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Castilian', 'Andalusian', 'Catalan bilingual zones'],
      accents: ['Madrid Spanish (spoken)', 'Andalusian Spanish (spoken)'],
      regions: ['Spain'],
      worldRegions: ['eu', 'latam', 'global'],
      lifestyle: {
        habits: ['late dinners', 'siesta-era afternoon rhythm in some regions'],
        routines: ['paseo', 'festival calendars'],
        culturalNotes: 'EU Castilian vs LATAM varieties — prefer locale packs.',
      },
      quality: 'production',
    }),
    entry({
      code: 'it',
      name: 'Italian',
      nativeName: 'Italiano',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Italian', 'Neapolitan bridge', 'Sicilian bridge'],
      accents: ['Rome Italian (spoken)', 'Milan Italian (spoken)'],
      regions: ['Italy'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['family Sunday lunches', 'formal Lei address'],
        routines: ['passeggiata', 'festa patronale'],
        culturalNotes: 'Regional varieties exist; standard Italian for UI.',
      },
      quality: 'production',
    }),
    entry({
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['European Portuguese', 'Brazilian Portuguese bridge'],
      accents: ['Lisbon Portuguese (spoken)'],
      regions: ['Portugal'],
      worldRegions: ['eu', 'latam', 'global'],
      lifestyle: {
        habits: ['coffee culture', 'saints festivals'],
        routines: ['late dinners'],
        culturalNotes: 'pt-PT vs pt-BR differ sharply — use locale packs.',
      },
      quality: 'production',
    }),
    entry({
      code: 'nl',
      name: 'Dutch',
      nativeName: 'Nederlands',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Netherlands Dutch', 'Flemish'],
      accents: ['Amsterdam Dutch (spoken)', 'Flemish Dutch (spoken)'],
      regions: ['Netherlands', 'Belgium'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['direct communication norms', 'cycling commutes'],
        routines: ['early dinners', 'Sinterklaas season'],
        culturalNotes: 'Flemish and Netherlands Dutch share standard with tone differences.',
      },
      quality: 'production',
    }),
  ];

  const northernEastern: RegionalLanguageEntry[] = [
    entry({
      code: 'pl',
      name: 'Polish',
      nativeName: 'Polski',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Polish', 'Silesian bridge'],
      accents: ['Warsaw Polish (spoken)'],
      regions: ['Poland'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['name-day celebrations', 'Sunday family dinners'],
        routines: ['Catholic holiday calendar'],
        culturalNotes: 'Formal Pan/Pani address in services.',
      },
      quality: 'production',
    }),
    entry({
      code: 'sv',
      name: 'Swedish',
      nativeName: 'Svenska',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Swedish', 'Scanian'],
      accents: ['Stockholm Swedish (spoken)'],
      regions: ['Sweden', 'Finland'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['fika coffee breaks', 'allemansrätt outdoor norms'],
        routines: ['early evenings in winter', 'Midsummer'],
        culturalNotes: 'Low-hierarchy tone; avoid over-formal marketing.',
      },
    }),
    entry({
      code: 'da',
      name: 'Danish',
      nativeName: 'Dansk',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Danish', 'Jutlandic'],
      accents: ['Copenhagen Danish (spoken)'],
      regions: ['Denmark'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['hygge social evenings'],
        routines: ['cycling and early workdays'],
        culturalNotes: 'Informal address is common in product UX.',
      },
    }),
    entry({
      code: 'fi',
      name: 'Finnish',
      nativeName: 'Suomi',
      family: 'Uralic',
      writingSystems: ['Latn'],
      dialects: ['Standard Finnish', 'Western', 'Eastern'],
      accents: ['Helsinki Finnish (spoken)'],
      regions: ['Finland'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['sauna culture', 'summer cottage weekends'],
        routines: ['quiet public spaces', 'berry/mushroom seasons'],
        culturalNotes: 'Comfortable with silence; avoid pushy CTA copy.',
      },
    }),
    entry({
      code: 'el',
      name: 'Greek',
      nativeName: 'Ελληνικά',
      family: 'Indo-European',
      writingSystems: ['Grek'],
      dialects: ['Standard Modern Greek', 'Cypriot bridge'],
      accents: ['Athens Greek (spoken)'],
      regions: ['Greece', 'Cyprus'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['name-day celebrations', 'late dinners'],
        routines: ['café culture', 'August holidays'],
        culturalNotes: 'Orthodox calendar references in cultural packs.',
      },
    }),
    entry({
      code: 'cs',
      name: 'Czech',
      nativeName: 'Čeština',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Czech', 'Moravian'],
      accents: ['Prague Czech (spoken)'],
      regions: ['Czechia'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['name days', 'beer-hall socializing'],
        routines: ['weekend countryside trips'],
        culturalNotes: 'Formal vy vs informal ty.',
      },
    }),
    entry({
      code: 'ro',
      name: 'Romanian',
      nativeName: 'Română',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Romanian', 'Moldavian bridge'],
      accents: ['Bucharest Romanian (spoken)'],
      regions: ['Romania'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['Orthodox holidays', 'extended family gatherings'],
        routines: ['market shopping'],
        culturalNotes: 'Romance language with Slavic contact influence.',
      },
    }),
    entry({
      code: 'hu',
      name: 'Hungarian',
      nativeName: 'Magyar',
      family: 'Uralic',
      writingSystems: ['Latn'],
      dialects: ['Standard Hungarian'],
      accents: ['Budapest Hungarian (spoken)'],
      regions: ['Hungary'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['name-day celebrations', 'thermal bath culture'],
        routines: ['Sunday family lunches'],
        culturalNotes: 'Formal Ön vs informal te.',
      },
    }),
    entry({
      code: 'bg',
      name: 'Bulgarian',
      nativeName: 'Български',
      family: 'Indo-European',
      writingSystems: ['Cyrl'],
      dialects: ['Standard Bulgarian'],
      accents: ['Sofia Bulgarian (spoken)'],
      regions: ['Bulgaria'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['name-day celebrations', 'Orthodox Easter'],
        routines: ['evening café culture'],
        culturalNotes: 'Cyrillic orthography for UI.',
      },
    }),
    entry({
      code: 'hr',
      name: 'Croatian',
      nativeName: 'Hrvatski',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Shtokavian standard', 'Kajkavian bridge', 'Chakavian bridge'],
      accents: ['Zagreb Croatian (spoken)'],
      regions: ['Croatia'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['coastal summer tourism cycles', 'saint days'],
        routines: ['café culture'],
        culturalNotes: 'Closely related BCS continuum — keep locale distinct.',
      },
    }),
    entry({
      code: 'sk',
      name: 'Slovak',
      nativeName: 'Slovenčina',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Slovak'],
      accents: ['Bratislava Slovak (spoken)'],
      regions: ['Slovakia'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['name days', 'mountain weekend trips'],
        routines: ['Sunday family meals'],
        culturalNotes: 'Close to Czech; keep separate locale routing.',
      },
    }),
    entry({
      code: 'sl',
      name: 'Slovenian',
      nativeName: 'Slovenščina',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Slovenian'],
      accents: ['Ljubljana Slovenian (spoken)'],
      regions: ['Slovenia'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['Alpine outdoor weekends'],
        routines: ['café culture'],
        culturalNotes: 'Dual number grammar is distinctive.',
      },
    }),
    entry({
      code: 'lt',
      name: 'Lithuanian',
      nativeName: 'Lietuvių',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Aukštaitian', 'Samogitian'],
      accents: ['Vilnius Lithuanian (spoken)'],
      regions: ['Lithuania'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['Song Festival traditions', 'Joninės midsummer'],
        routines: ['forest berry seasons'],
        culturalNotes: 'Baltic language; preserve diacritics.',
      },
    }),
    entry({
      code: 'lv',
      name: 'Latvian',
      nativeName: 'Latviešu',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Standard Latvian', 'Latgalian bridge'],
      accents: ['Riga Latvian (spoken)'],
      regions: ['Latvia'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['Jāņi midsummer', 'choir traditions'],
        routines: ['sauna and countryside weekends'],
        culturalNotes: 'Baltic language; preserve diacritics.',
      },
    }),
    entry({
      code: 'et',
      name: 'Estonian',
      nativeName: 'Eesti',
      family: 'Uralic',
      writingSystems: ['Latn'],
      dialects: ['Standard Estonian', 'Võro bridge'],
      accents: ['Tallinn Estonian (spoken)'],
      regions: ['Estonia'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['sauna', 'Song Festival'],
        routines: ['digital-first public services'],
        culturalNotes: 'Low small-talk culture; clear concise UX copy.',
      },
    }),
    entry({
      code: 'ga',
      name: 'Irish',
      nativeName: 'Gaeilge',
      family: 'Celtic',
      writingSystems: ['Latn'],
      dialects: ['Connacht', 'Munster', 'Ulster'],
      accents: ['Connacht Irish (spoken)'],
      regions: ['Ireland'],
      worldRegions: ['eu', 'uk', 'global'],
      lifestyle: {
        habits: ['Gaeltacht summer colleges', 'trad music sessions'],
        routines: ['GAA sports weekends'],
        culturalNotes: 'Official EU language; bilingual Irish/English contexts.',
      },
    }),
    entry({
      code: 'ca',
      name: 'Catalan',
      nativeName: 'Català',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Central Catalan', 'Valencian', 'Balearic'],
      accents: ['Barcelona Catalan (spoken)'],
      regions: ['Spain (Catalonia / Valencia / Balearics)', 'Andorra'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['Sant Jordi book day', 'castellers'],
        routines: ['bilingual Catalan/Spanish public life'],
        culturalNotes: 'Co-official contexts — prefer Catalan when locale is ca-*.',
      },
    }),
    entry({
      code: 'eu',
      name: 'Basque',
      nativeName: 'Euskara',
      family: 'Language isolate',
      writingSystems: ['Latn'],
      dialects: ['Batua standard', 'Gipuzkoan', 'Bizkaian'],
      accents: ['Batua Basque (spoken)'],
      regions: ['Spain / France Basque Country'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['txoko gastronomic societies', 'festival calendars'],
        routines: ['mountain and coastal weekends'],
        culturalNotes: 'Isolate language; Batua for product UI.',
      },
    }),
    entry({
      code: 'mt',
      name: 'Maltese',
      nativeName: 'Malti',
      family: 'Afro-Asiatic',
      writingSystems: ['Latn'],
      dialects: ['Standard Maltese'],
      accents: ['Valletta Maltese (spoken)'],
      regions: ['Malta'],
      worldRegions: ['eu', 'global'],
      lifestyle: {
        habits: ['festa parish celebrations', 'bilingual Maltese/English'],
        routines: ['Mediterranean meal times'],
        culturalNotes: 'Semitic language in Latin script; EU official.',
      },
    }),
  ];

  return [...romanceGermanic, ...northernEastern];
}

export function ukLanguageSeed(): RegionalLanguageEntry[] {
  return [
    entry({
      code: 'en',
      name: 'English',
      nativeName: 'English',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['British English', 'Scottish English', 'Welsh English', 'Northern English'],
      accents: ['Received Pronunciation (spoken)', 'Estuary English (spoken)', 'Scottish English (spoken)'],
      regions: ['United Kingdom'],
      worldRegions: ['uk', 'global', 'na'],
      lifestyle: {
        habits: ['queueing norms', 'tea breaks'],
        routines: ['Sunday roast traditions', 'bank-holiday weekends'],
        culturalNotes: 'Default global English remains en; prefer en-GB for UK locale packs.',
      },
      quality: 'production',
    }),
    entry({
      code: 'cy',
      name: 'Welsh',
      nativeName: 'Cymraeg',
      family: 'Celtic',
      writingSystems: ['Latn'],
      dialects: ['North Welsh', 'South Welsh'],
      accents: ['North Welsh (spoken)', 'South Welsh (spoken)'],
      regions: ['Wales'],
      worldRegions: ['uk', 'global'],
      lifestyle: {
        habits: ['Eisteddfod cultural festivals', 'bilingual signage norms'],
        routines: ['community chapel/choir traditions in many areas'],
        culturalNotes: 'Official in Wales; bilingual Welsh/English public services.',
      },
      quality: 'production',
    }),
    entry({
      code: 'gd',
      name: 'Scottish Gaelic',
      nativeName: 'Gàidhlig',
      family: 'Celtic',
      writingSystems: ['Latn'],
      dialects: ['Hebridean', 'Highland'],
      accents: ['Hebridean Gaelic (spoken)'],
      regions: ['Scotland'],
      worldRegions: ['uk', 'global'],
      lifestyle: {
        habits: ['Mòd festivals', 'ceilidh socials'],
        routines: ['island ferry-linked travel patterns'],
        culturalNotes: 'Prefer Gaelic in Gaelic-medium contexts; English otherwise.',
      },
    }),
    entry({
      code: 'ga',
      name: 'Irish',
      nativeName: 'Gaeilge',
      family: 'Celtic',
      writingSystems: ['Latn'],
      dialects: ['Ulster Irish'],
      accents: ['Ulster Irish (spoken)'],
      regions: ['Northern Ireland', 'Ireland'],
      worldRegions: ['uk', 'eu', 'global'],
      lifestyle: {
        habits: ['trad sessions', 'Gaeltacht links'],
        routines: ['cross-border bilingual services'],
        culturalNotes: 'Appears in both EU and UK regional tabs.',
      },
    }),
  ];
}

export function latamLanguageSeed(): RegionalLanguageEntry[] {
  return [
    entry({
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Mexican Spanish', 'Rioplatense', 'Andean Spanish', 'Caribbean Spanish', 'Chilean Spanish'],
      accents: ['Mexico City Spanish (spoken)', 'Buenos Aires Spanish (spoken)', 'Bogotá Spanish (spoken)'],
      regions: ['Mexico', 'Central America', 'South America', 'Caribbean'],
      worldRegions: ['latam', 'na', 'global'],
      lifestyle: {
        habits: ['compadrazgo social ties', 'saint-day and carnival calendars'],
        routines: ['family almuerzo', 'late dinners in Southern Cone'],
        culturalNotes: 'Prefer country locale packs (es-MX, es-AR, …) over generic es.',
      },
      quality: 'production',
    }),
    entry({
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Brazilian Portuguese', 'Nordestino', 'Carioca', 'Paulista'],
      accents: ['São Paulo Portuguese (spoken)', 'Rio Portuguese (spoken)'],
      regions: ['Brazil'],
      worldRegions: ['latam', 'global'],
      lifestyle: {
        habits: ['weekend churrasco', 'Carnival season'],
        routines: ['late dinners', 'football match social viewing'],
        culturalNotes: 'pt-BR is the LATAM default Portuguese locale.',
      },
      quality: 'production',
    }),
    entry({
      code: 'qu',
      name: 'Quechua',
      nativeName: 'Runa Simi',
      family: 'Quechuan',
      writingSystems: ['Latn'],
      dialects: ['Southern Quechua', 'Cusco', 'Bolivian Quechua'],
      accents: ['Cusco Quechua (spoken)'],
      regions: ['Peru', 'Bolivia', 'Ecuador'],
      worldRegions: ['latam', 'global'],
      lifestyle: {
        habits: ['Andean reciprocity (ayni)', 'Inti Raymi calendars'],
        routines: ['highland market days', 'agricultural seasons'],
        culturalNotes: 'Indigenous language — community consent for cultural corpora.',
      },
      quality: 'preview',
    }),
    entry({
      code: 'gn',
      name: 'Guarani',
      nativeName: "Avañe'ẽ",
      family: 'Tupian',
      writingSystems: ['Latn'],
      dialects: ['Paraguayan Guarani', 'Jopará bridge'],
      accents: ['Asunción Guarani (spoken)'],
      regions: ['Paraguay', 'Argentina', 'Brazil border'],
      worldRegions: ['latam', 'global'],
      lifestyle: {
        habits: ['tereré sharing', 'bilingual Guarani/Spanish daily life'],
        routines: ['extended family compounds'],
        culturalNotes: 'Co-official in Paraguay; Jopará mixing is common.',
      },
      quality: 'preview',
    }),
    entry({
      code: 'ay',
      name: 'Aymara',
      nativeName: 'Aymar aru',
      family: 'Aymaran',
      writingSystems: ['Latn'],
      dialects: ['Central Aymara', 'Southern Aymara'],
      accents: ['La Paz Aymara (spoken)'],
      regions: ['Bolivia', 'Peru', 'Chile'],
      worldRegions: ['latam', 'global'],
      lifestyle: {
        habits: ['Andean reciprocal labor', 'festival calendars'],
        routines: ['highland market cycles'],
        culturalNotes: 'Indigenous language — culture fields require community care.',
      },
    }),
    entry({
      code: 'ht',
      name: 'Haitian Creole',
      nativeName: 'Kreyòl ayisyen',
      family: 'Creole / Contact',
      writingSystems: ['Latn'],
      dialects: ['Standard Kreyòl', 'Northern'],
      accents: ['Port-au-Prince Kreyòl (spoken)'],
      regions: ['Haiti', 'diaspora'],
      worldRegions: ['latam', 'na', 'global'],
      lifestyle: {
        habits: ['konbit communal work', 'rara and carnival seasons'],
        routines: ['market mornings', 'church/community gatherings'],
        culturalNotes: 'Primary everyday language in Haiti; French is formal register.',
      },
      quality: 'production',
    }),
    entry({
      code: 'nah',
      name: 'Nahuatl',
      nativeName: 'Nāhuatl',
      family: 'Uto-Aztecan',
      writingSystems: ['Latn'],
      dialects: ['Central Nahuatl', 'Huasteca'],
      accents: ['Central Nahuatl (spoken)'],
      regions: ['Mexico'],
      worldRegions: ['latam', 'na', 'global'],
      lifestyle: {
        habits: ['community festival calendars', 'milpa agriculture'],
        routines: ['market days'],
        culturalNotes: 'Many varieties — catalog entry for routing, not a single dialect claim.',
      },
    }),
  ];
}

export function naLanguageSeed(): RegionalLanguageEntry[] {
  return [
    entry({
      code: 'en',
      name: 'English',
      nativeName: 'English',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['General American', 'Southern US', 'African American Vernacular English bridge', 'Canadian English'],
      accents: ['General American (spoken)', 'Southern US English (spoken)', 'Canadian English (spoken)'],
      regions: ['United States', 'Canada'],
      worldRegions: ['na', 'global', 'uk'],
      lifestyle: {
        habits: ['weekend sports viewing', 'Thanksgiving family travel'],
        routines: ['commuter schedules', 'coffee-shop remote work'],
        culturalNotes: 'Prefer en-US / en-CA locale packs for regional spelling.',
      },
      quality: 'production',
    }),
    entry({
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['US Mexican Spanish', 'Caribbean US Spanish', 'US Salvadoran Spanish'],
      accents: ['US Mexican Spanish (spoken)', 'Miami Spanish (spoken)'],
      regions: ['United States', 'Mexico border'],
      worldRegions: ['na', 'latam', 'global'],
      lifestyle: {
        habits: ['bilingual household media', 'quinceañera and family celebrations'],
        routines: ['weekend family gatherings'],
        culturalNotes: 'es-US / es-MX locale packs for North American Spanish.',
      },
      quality: 'production',
    }),
    entry({
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      family: 'Indo-European',
      writingSystems: ['Latn'],
      dialects: ['Québécois', 'Acadian', 'Franco-Ontarian'],
      accents: ['Québécois French (spoken)'],
      regions: ['Canada'],
      worldRegions: ['na', 'global'],
      lifestyle: {
        habits: ['Saint-Jean-Baptiste', 'cabane à sucre season'],
        routines: ['winter indoor social life', 'summer cottage culture'],
        culturalNotes: 'fr-CA spelling and vocabulary differ from Metropolitan French.',
      },
      quality: 'production',
    }),
    entry({
      code: 'chr',
      name: 'Cherokee',
      nativeName: 'ᏣᎳᎩ',
      family: 'Iroquoian',
      writingSystems: ['Cher', 'Latn'],
      dialects: ['Oklahoma Cherokee', 'Eastern Cherokee'],
      accents: ['Oklahoma Cherokee (spoken)'],
      regions: ['United States'],
      worldRegions: ['na', 'global'],
      lifestyle: {
        habits: ['stomp dance and community gatherings'],
        routines: ['tribal nation civic calendars'],
        culturalNotes: 'Indigenous language — cultural fields require community consent.',
      },
    }),
    entry({
      code: 'nv',
      name: 'Navajo',
      nativeName: 'Diné bizaad',
      family: 'Na-Dene',
      writingSystems: ['Latn'],
      dialects: ['Western Navajo', 'Eastern Navajo'],
      accents: ['Navajo (spoken)'],
      regions: ['United States (Navajo Nation)'],
      worldRegions: ['na', 'global'],
      lifestyle: {
        habits: ['hogán and clan introductions', 'ceremonial calendars'],
        routines: ['ranching and chapter-house community life'],
        culturalNotes: 'Indigenous language — not for extractive cultural scrapes.',
      },
    }),
    entry({
      code: 'haw',
      name: 'Hawaiian',
      nativeName: 'ʻŌlelo Hawaiʻi',
      family: 'Austronesian',
      writingSystems: ['Latn'],
      dialects: ['Standard Hawaiian', 'Niʻihau'],
      accents: ['Hawaiian (spoken)'],
      regions: ['United States (Hawaiʻi)'],
      worldRegions: ['na', 'global'],
      lifestyle: {
        habits: ['aloha and kokua community norms', 'makahiki season'],
        routines: ['family lūʻau gatherings'],
        culturalNotes: 'Official in Hawaiʻi; ʻokina and kahakō must be preserved.',
      },
    }),
    entry({
      code: 'iu',
      name: 'Inuktitut',
      nativeName: 'ᐃᓄᒃᑎᑐᑦ',
      family: 'Eskimo-Aleut',
      writingSystems: ['Cans', 'Latn'],
      dialects: ['South Qikiqtaaluk', 'North Qikiqtaaluk', 'Nunavik'],
      accents: ['Iqaluit Inuktitut (spoken)'],
      regions: ['Canada (Inuit Nunangat)'],
      worldRegions: ['na', 'global'],
      lifestyle: {
        habits: ['country-food sharing', 'seasonal hunting/fishing cycles'],
        routines: ['community radio and hamlet services'],
        culturalNotes: 'Syllabics and Latin orthographies both appear — locale packs note script.',
      },
    }),
    entry({
      code: 'hmn',
      name: 'Hmong',
      nativeName: 'Hmoob',
      family: 'Hmong-Mien',
      writingSystems: ['Latn'],
      dialects: ['White Hmong', 'Green Hmong'],
      accents: ['Midwest Hmong (spoken)'],
      regions: ['United States diaspora'],
      worldRegions: ['na', 'sea', 'global'],
      lifestyle: {
        habits: ['New Year clan gatherings'],
        routines: ['extended-family households'],
        culturalNotes: 'Strong US Midwest diaspora communities.',
      },
    }),
  ];
}


/** High-traffic global vendor languages not owned by a single regional tab. */
export function globalVendorLanguageSeed(): RegionalLanguageEntry[] {
  return [
    entry({
      code: 'zh',
      name: 'Chinese (Simplified)',
      nativeName: '中文',
      family: 'Sino-Tibetan',
      writingSystems: ['Hans'],
      dialects: ['Mandarin', 'Cantonese bridge'],
      accents: ['Beijing Mandarin (spoken)', 'Shanghai Mandarin (spoken)'],
      regions: ['China', 'Global'],
      worldRegions: ['global', 'sea'],
      lifestyle: {
        habits: ['Spring Festival family travel'],
        routines: ['WeChat-centric daily messaging'],
        culturalNotes: 'Prefer zh-CN locale packs for Simplified Chinese product UI.',
      },
      quality: 'production',
    }),
    entry({
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      family: 'Japonic',
      writingSystems: ['Jpan'],
      dialects: ['Standard Japanese', 'Kansai'],
      accents: ['Tokyo Japanese (spoken)'],
      regions: ['Japan', 'Global'],
      worldRegions: ['global'],
      lifestyle: {
        habits: ['seasonal gift-giving', 'train commuting'],
        routines: ['convenience-store meals', 'golden week travel'],
        culturalNotes: 'Keigo politeness levels matter in customer copy.',
      },
      quality: 'production',
    }),
    entry({
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      family: 'Koreanic',
      writingSystems: ['Kore'],
      dialects: ['Seoul', 'Gyeongsang bridge'],
      accents: ['Seoul Korean (spoken)'],
      regions: ['Korea', 'Global'],
      worldRegions: ['global'],
      lifestyle: {
        habits: ['cafe culture', 'holiday family travel (Chuseok)'],
        routines: ['late dinners', 'delivery food'],
        culturalNotes: 'Honorific speech levels shape UX tone.',
      },
      quality: 'production',
    }),
    entry({
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      family: 'Indo-European',
      writingSystems: ['Deva'],
      dialects: ['Standard Hindi', 'Bombay Hindi'],
      accents: ['Delhi Hindi (spoken)', 'Mumbai Hindi (spoken)'],
      regions: ['India', 'Global'],
      worldRegions: ['global'],
      lifestyle: {
        habits: ['festival calendars (Diwali, Holi)'],
        routines: ['extended-family gatherings'],
        culturalNotes: 'Shared continuum with Urdu; Devanagari for Hindi UI.',
      },
      quality: 'production',
    }),
    entry({
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      family: 'Indo-European',
      writingSystems: ['Cyrl'],
      dialects: ['Standard Russian'],
      accents: ['Moscow Russian (spoken)'],
      regions: ['Russia', 'Global'],
      worldRegions: ['global', 'eu'],
      lifestyle: {
        habits: ['dacha weekends', 'New Year family focus'],
        routines: ['tea hospitality'],
        culturalNotes: 'Formal vy vs informal ty in service copy.',
      },
      quality: 'production',
    }),
  ];
}

/** Map African registry rows into regional entries (Africa + Global). */
export function africaAsRegionalEntries(): RegionalLanguageEntry[] {
  return africanLanguageSeed().map((l) =>
    entry({
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      family: l.family,
      writingSystems: l.writingSystems,
      dialects: l.dialects,
      accents: [],
      regions: l.regions,
      worldRegions: ['africa', 'global'],
      lifestyle: {
        culturalNotes: 'Africa-first registry entry. Default demo pair remains English → Twi.',
      },
      quality: l.quality,
      notes: l.notes,
    }),
  );
}

/** Merge regional catalogs; Global is the deduped union. Africa stays first in sort prominence. */
export function allRegionalLanguageEntries(): RegionalLanguageEntry[] {
  const byCode = new Map<string, RegionalLanguageEntry>();

  const merge = (row: RegionalLanguageEntry) => {
    const existing = byCode.get(row.code);
    if (!existing) {
      byCode.set(row.code, row);
      return;
    }
    const worldRegions = Array.from(
      new Set<WorldRegionId>([...existing.worldRegions, ...row.worldRegions]),
    );
    const dialects = Array.from(new Set([...existing.dialects, ...row.dialects]));
    const accents = Array.from(new Set([...existing.accents, ...row.accents]));
    const regions = Array.from(new Set([...existing.regions, ...row.regions]));
    byCode.set(row.code, {
      ...existing,
      ...row,
      worldRegions,
      dialects,
      accents,
      regions,
      lifestyle: {
        habits: Array.from(
          new Set([...(existing.lifestyle?.habits ?? []), ...(row.lifestyle?.habits ?? [])]),
        ),
        routines: Array.from(
          new Set([...(existing.lifestyle?.routines ?? []), ...(row.lifestyle?.routines ?? [])]),
        ),
        culturalNotes: [existing.lifestyle?.culturalNotes, row.lifestyle?.culturalNotes]
          .filter(Boolean)
          .join(' '),
      },
      // Prefer production if either side is production.
      quality:
        existing.quality === 'production' || row.quality === 'production'
          ? 'production'
          : existing.quality === 'preview' || row.quality === 'preview'
            ? 'preview'
            : 'catalog',
    });
  };

  // Africa first for merge prominence of African metadata.
  for (const row of africaAsRegionalEntries()) merge(row);
  for (const row of seaLanguageSeed()) merge(row);
  for (const row of menaLanguageSeed()) merge(row);
  for (const row of euLanguageSeed()) merge(row);
  for (const row of ukLanguageSeed()) merge(row);
  for (const row of latamLanguageSeed()) merge(row);
  for (const row of naLanguageSeed()) merge(row);
  for (const row of globalVendorLanguageSeed()) merge(row);

  return Array.from(byCode.values()).sort((a, b) => {
    const aAfrica = a.worldRegions.includes('africa') ? 0 : 1;
    const bAfrica = b.worldRegions.includes('africa') ? 0 : 1;
    if (aAfrica !== bAfrica) return aAfrica - bAfrica;
    return a.name.localeCompare(b.name);
  });
}

export function languagesForRegion(region: WorldRegionId): RegionalLanguageEntry[] {
  const all = allRegionalLanguageEntries();
  if (region === 'global') return all;
  return all.filter((l) => l.worldRegions.includes(region));
}

export function regionalCountsByRegion(): Record<WorldRegionId, number> {
  const ids: WorldRegionId[] = ['africa', 'sea', 'mena', 'eu', 'uk', 'latam', 'na', 'global'];
  const counts = {} as Record<WorldRegionId, number>;
  for (const id of ids) counts[id] = languagesForRegion(id).length;
  return counts;
}
