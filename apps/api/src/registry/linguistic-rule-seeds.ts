export type LinguisticRuleSeed = {
  code: string;
  kind: 'pronunciation' | 'grammar' | 'phonetic' | 'morphology';
  languageCode?: string;
  nameEn: string;
  description: string;
  pattern?: string;
  examples?: string[];
  notes?: string;
};

/**
 * Curated rule catalog. Supports every *registered* rule kind —
 * not a complete linguistics OS for every language on Earth.
 */
export const LINGUISTIC_RULE_SEEDS: LinguisticRuleSeed[] = [
  {
    code: 'en-pron-schwa',
    kind: 'pronunciation',
    languageCode: 'en',
    nameEn: 'Unstressed schwa',
    description: 'Unstressed vowels often reduce to schwa /ə/ in connected speech.',
    pattern: 'ə',
    examples: ['about → /əˈbaʊt/', 'sofa → /ˈsoʊfə/'],
  },
  {
    code: 'en-gram-articles',
    kind: 'grammar',
    languageCode: 'en',
    nameEn: 'Definite / indefinite articles',
    description: 'Use a/an before singular countable nouns; the for definite reference.',
    examples: ['a book', 'an apple', 'the book'],
  },
  {
    code: 'en-phon-voicing',
    kind: 'phonetic',
    languageCode: 'en',
    nameEn: 'Final consonant voicing',
    description: 'Plural / past endings assimilate voicing to the stem-final consonant.',
    examples: ['cats /s/', 'dogs /z/', 'walked /t/', 'played /d/'],
  },
  {
    code: 'en-morph-plural',
    kind: 'morphology',
    languageCode: 'en',
    nameEn: 'Regular plural -s/-es',
    description: 'Add -s or -es for regular noun plurals; irregulars are lexical.',
    pattern: '-(e)s',
    examples: ['cat→cats', 'box→boxes', 'child→children'],
  },
  {
    code: 'sw-pron-penult',
    kind: 'pronunciation',
    languageCode: 'sw',
    nameEn: 'Penultimate stress',
    description: 'Primary stress falls on the penultimate syllable in standard Kiswahili.',
    examples: ['kiSWáhili', 'naKÚja'],
  },
  {
    code: 'sw-gram-noun-class',
    kind: 'grammar',
    languageCode: 'sw',
    nameEn: 'Noun class agreement',
    description: 'Verbs and modifiers agree with the noun class prefix of the head noun.',
    examples: ['kitabu kikubwa', 'vitabu vikubwa'],
  },
  {
    code: 'sw-morph-class-prefix',
    kind: 'morphology',
    languageCode: 'sw',
    nameEn: 'ki-/vi- class',
    description: 'Class 7/8 singular/plural prefixes for many inanimate nouns.',
    pattern: 'ki-/vi-',
    examples: ['kitabu / vitabu'],
  },
  {
    code: 'yo-pron-tone',
    kind: 'pronunciation',
    languageCode: 'yo',
    nameEn: 'Lexical tone',
    description: 'Yoruba is tonal; orthographic tone marks disambiguate otherwise identical spellings.',
    examples: ['owó (money)', 'òwò (business)'],
  },
  {
    code: 'yo-gram-serial',
    kind: 'grammar',
    languageCode: 'yo',
    nameEn: 'Serial verb constructions',
    description: 'Multiple verbs may share a subject without overt conjunctions.',
    examples: ['Ó ra ìwé wá'],
  },
  {
    code: 'am-phon-ejective',
    kind: 'phonetic',
    languageCode: 'am',
    nameEn: 'Ejective consonants',
    description: 'Amharic contrasts ejectives with plain stops in the Ethiopic script.',
    examples: ['ጠ vs ተ'],
  },
  {
    code: 'am-morph-root',
    kind: 'morphology',
    languageCode: 'am',
    nameEn: 'Triliteral root patterns',
    description: 'Many verbs are built from consonantal roots with templatic vowel patterns.',
    notes: 'Catalog entry only — not a full morphology engine.',
  },
  {
    code: 'ar-pron-emphatic',
    kind: 'pronunciation',
    languageCode: 'ar',
    nameEn: 'Emphatic consonants',
    description: 'Emphatic / pharyngealized consonants color adjacent vowels.',
    examples: ['ص vs س'],
  },
  {
    code: 'ar-gram-idafa',
    kind: 'grammar',
    languageCode: 'ar',
    nameEn: 'Iḍāfa construct',
    description: 'Possessive/genitive chains mark definiteness on the final noun.',
    examples: ['kitābu l-walad'],
  },
  {
    code: 'ar-morph-root',
    kind: 'morphology',
    languageCode: 'ar',
    nameEn: 'Root-and-pattern morphology',
    description: 'Derivational patterns (wazn) apply to triliteral / quadriliteral roots.',
  },
  {
    code: 'zu-phon-click',
    kind: 'phonetic',
    languageCode: 'zu',
    nameEn: 'Click consonants',
    description: 'Zulu orthography encodes dental, alveolar, and lateral clicks.',
    examples: ['c', 'q', 'x'],
  },
  {
    code: 'ha-pron-implosive',
    kind: 'pronunciation',
    languageCode: 'ha',
    nameEn: 'Implosive /b/ /d/',
    description: 'Hausa distinguishes implosive stops from plain voiced stops in Latin orthography.',
    examples: ['ɓ', 'ɗ'],
  },
];
