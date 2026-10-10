/**
 * Customer-facing demo catalogue — only languages/varieties with verified
 * intelligible synthesis without neural weights (eSpeak) or with neural live.
 *
 * Voices for Yoruba, Zulu, Akan, Igbo, Wolof, etc. stay in the Echo catalog for
 * when Piper/Kokoro weights publish, but are excluded here until then.
 */

export type DemoCatalogueEntry = {
  id: string;
  label: string;
  locale: string;
  voiceId: string;
  scripts: {
    greeting: string;
    everyday: string;
    business: string;
  };
  nativeReviewed: boolean;
  notes: string;
};

export const DEMO_CATALOGUE: DemoCatalogueEntry[] = [
  {
    id: 'en-us',
    label: 'Ava · American English',
    locale: 'en-US',
    voiceId: 'own:en-us-female',
    scripts: {
      greeting: 'Hello, and welcome to Lugemi.',
      everyday: 'How was your day at the market?',
      business: 'We can deliver fifty bags by Friday for two hundred dollars.',
    },
    nativeReviewed: false,
    notes: 'eSpeak en-us demo; Kokoro af_heart when OWN_TTS weights are live.',
  },
  {
    id: 'en-gb',
    label: 'Emma · British English',
    locale: 'en-GB',
    voiceId: 'own:en-gb-female',
    scripts: {
      greeting: 'Good afternoon, and welcome to Lugemi.',
      everyday: 'Shall we meet near the station at three?',
      business: 'The invoice covers twelve units at forty-five pounds each.',
    },
    nativeReviewed: false,
    notes: 'eSpeak en-gb demo; distinct from American English voice selection.',
  },
  {
    id: 'en-au',
    label: 'Mia · Australian English',
    locale: 'en-AU',
    voiceId: 'own:en-au-female',
    scripts: {
      greeting: 'G’day — thanks for trying Lugemi.',
      everyday: 'Can you pick up the parcel this arvo?',
      business: 'Delivery is scheduled for Monday; total is three hundred dollars.',
    },
    nativeReviewed: false,
    notes: 'eSpeak en-au. Not a uniform national accent claim — one available voice.',
  },
  {
    id: 'en-nz',
    label: 'Ruby · New Zealand English',
    locale: 'en-NZ',
    voiceId: 'own:en-nz-female',
    scripts: {
      greeting: 'Kia ora — welcome to Lugemi.',
      everyday: 'Are you free for a quick catch-up tomorrow?',
      business: 'Please confirm the quantity: twenty crates by Wednesday.',
    },
    nativeReviewed: false,
    notes: 'eSpeak en-nz. Separate selection from Australian English.',
  },
  {
    id: 'en-gh',
    label: 'Ama · Ghanaian English',
    locale: 'en-GH',
    voiceId: 'own:en-gh-female',
    scripts: {
      greeting: 'Welcome. Thank you for joining Lugemi.',
      everyday: 'Please come to the shop in the afternoon.',
      business: 'We have fifty bags of rice ready for delivery on Friday.',
    },
    nativeReviewed: false,
    notes: 'eSpeak Caribbean English (en-029) as closest stock voice — not a trained GH neural accent.',
  },
  {
    id: 'en-ng',
    label: 'Chioma · Nigerian English',
    locale: 'en-NG',
    voiceId: 'own:en-ng-female',
    scripts: {
      greeting: 'You’re welcome. This is Lugemi speaking.',
      everyday: 'How far? Did you reach the market safely?',
      business: 'Payment is one hundred thousand naira for twenty cartons.',
    },
    nativeReviewed: false,
    notes: 'eSpeak en-029 demo approximation until NG neural checkpoint publishes.',
  },
  {
    id: 'sw-ke',
    label: 'Aisha · Kiswahili (Kenya)',
    locale: 'sw-KE',
    voiceId: 'own:sw-ke-female',
    scripts: {
      greeting: 'Karibu sana. Jina langu ni Aisha.',
      everyday: 'Habari yako leo? Umeenda sokoni?',
      business: 'Tunaweza kuleta mifuko hamsini siku ya Ijumaa kwa shilingi elfu mbili.',
    },
    nativeReviewed: false,
    notes: 'eSpeak Swahili — intelligible demo, not native-reviewed neural.',
  },
  {
    id: 'am-et',
    label: 'Hanna · Amharic (Ethiopia)',
    locale: 'am-ET',
    voiceId: 'own:am-et-female',
    scripts: {
      greeting: 'እንኳን ደህና መጡ ወደ ሉጌሚ።',
      everyday: 'ዛሬ እንዴት ነህ? ወደ ገበያ ሄደህ ነበር?',
      business: 'ሐሙስ እስከ ሃያሁለት ቦርሳ ማድረስ እንችላለን።',
    },
    nativeReviewed: false,
    notes: 'eSpeak Amharic demo.',
  },
  {
    id: 'ar-eg',
    label: 'Omar · Arabic (Egypt)',
    locale: 'ar-EG',
    voiceId: 'own:ar-eg-male',
    scripts: {
      greeting: 'أهلاً وسهلاً بكم في لوجيمي.',
      everyday: 'كيف يومك؟ هل ذهبت إلى السوق؟',
      business: 'يمكننا تسليم خمسين شوالاً يوم الجمعة مقابل ألفي جنيه.',
    },
    nativeReviewed: false,
    notes: 'eSpeak Arabic demo; Egyptian variety label is routing metadata, not a dedicated EG neural model.',
  },
  {
    id: 'fr-fr',
    label: 'Camille · French (France)',
    locale: 'fr-FR',
    voiceId: 'own:fr-fr-female',
    scripts: {
      greeting: 'Bonjour, et bienvenue sur Lugemi.',
      everyday: 'Comment s’est passée votre journée au marché ?',
      business: 'Nous pouvons livrer cinquante sacs vendredi pour deux cents euros.',
    },
    nativeReviewed: false,
    notes: 'eSpeak fr-fr. Distinct from West African French selections.',
  },
  {
    id: 'fr-sn',
    label: 'Awa · French (Senegal)',
    locale: 'fr-SN',
    voiceId: 'own:fr-sn-female',
    scripts: {
      greeting: 'Bonjour, bienvenue chez Lugemi.',
      everyday: 'Tu es allé au marché ce matin ?',
      business: 'On peut livrer cinquante sacs vendredi pour deux cent mille francs.',
    },
    nativeReviewed: false,
    notes: 'Uses eSpeak fr-fr acoustics with SN locale routing — not a separate SN neural accent until weights publish.',
  },
  {
    id: 'af-za',
    label: 'Annelie · Afrikaans',
    locale: 'af-ZA',
    voiceId: 'own:af-za-female',
    scripts: {
      greeting: 'Goeiedag, welkom by Lugemi.',
      everyday: 'Hoe was jou dag by die mark?',
      business: 'Ons kan Vrydag vyftig sakke lewer vir twee honderd rand.',
    },
    nativeReviewed: false,
    notes: 'eSpeak Afrikaans. Must not be used as a Zulu substitute.',
  },
];
