export type FamilySeed = {
  code: string;
  nameEn: string;
  parentCode?: string;
  notes?: string;
};

/** Curated families covering Lugemi registry languages (VL-139). */
export const FAMILY_SEEDS: FamilySeed[] = [
  {
    code: 'indo_european',
    nameEn: 'Indo-European',
    notes: 'Includes Germanic and Romance languages in the vendor set.',
  },
  {
    code: 'afro_asiatic',
    nameEn: 'Afro-Asiatic',
    notes: 'Arabic, Amharic, Hausa, Somali and related.',
  },
  {
    code: 'niger_congo',
    nameEn: 'Niger–Congo',
    notes: 'Largest African family; Bantu and West African registry languages.',
  },
  {
    code: 'sino_tibetan',
    nameEn: 'Sino-Tibetan',
    notes: 'Vendor Chinese coverage.',
  },
  {
    code: 'japonic',
    nameEn: 'Japonic',
  },
  {
    code: 'koreanic',
    nameEn: 'Koreanic',
  },
  {
    code: 'turkic',
    nameEn: 'Turkic',
  },
  {
    code: 'austronesian',
    nameEn: 'Austronesian',
  },
];
