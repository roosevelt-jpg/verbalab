export type FamilySeed = {
  code: string;
  nameEn: string;
  parentCode?: string;
  notes?: string;
};

/** Curated families covering Lugemi registry languages. */
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
  { code: 'creole', nameEn: 'Creole / Contact', notes: 'Naijá, Krio, Kriolu, Seselwa, Forro, Angolar, Haitian Creole, and related contact languages.' },
  { code: 'nilo_saharan', nameEn: 'Nilo-Saharan', notes: 'Nilotic and Saharan languages (Dinka, Nuer, Kanuri, Lugbara, …).' },
  { code: 'khoisan', nameEn: 'Khoe-Kwadi / Kxʼa', notes: 'Click-language families represented by Khoekhoegowab and related entries.' },
  { code: 'tai_kadai', nameEn: 'Tai–Kadai', notes: 'Thai, Lao, and related Southeast Asian languages.' },
  { code: 'austroasiatic', nameEn: 'Austroasiatic', notes: 'Vietnamese, Khmer, and related languages.' },
  { code: 'uralic', nameEn: 'Uralic', notes: 'Finnish, Hungarian, Estonian.' },
  { code: 'celtic', nameEn: 'Celtic', notes: 'Welsh, Irish, Scottish Gaelic.' },
  { code: 'quechuan', nameEn: 'Quechuan', notes: 'Quechua varieties of the Andes.' },
  { code: 'aymaran', nameEn: 'Aymaran', notes: 'Aymara.' },
  { code: 'tupian', nameEn: 'Tupian', notes: 'Guarani and related.' },
  { code: 'uto_aztecan', nameEn: 'Uto-Aztecan', notes: 'Nahuatl and related.' },
  { code: 'na_dene', nameEn: 'Na-Dene', notes: 'Navajo (Diné bizaad).' },
  { code: 'iroquoian', nameEn: 'Iroquoian', notes: 'Cherokee.' },
  { code: 'eskimo_aleut', nameEn: 'Eskimo–Aleut', notes: 'Inuktitut.' },
  { code: 'hmong_mien', nameEn: 'Hmong–Mien', notes: 'Hmong.' },
  { code: 'language_isolate', nameEn: 'Language isolate', notes: 'Basque and other isolates in the registry.' },
];
