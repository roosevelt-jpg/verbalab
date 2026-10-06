/** ISO 3166-1 alpha-2 country catalog for Country Engine + Studio pickers.
 * Worldwide coverage list with Africa-first region labels. Not a CLDR dialect dump.
 */
export type IsoCountryDef = {
  code: string;
  nameEn: string;
  region: string;
  currencyCode: string;
  /** Preferred official / working languages (ISO 639) when composing packs. */
  officialLanguages: string[];
};

export const ISO_COUNTRIES: IsoCountryDef[] = [
  {
    "code": "AD",
    "nameEn": "Andorra",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "ca"
    ]
  },
  {
    "code": "AE",
    "nameEn": "United Arab Emirates",
    "region": "Western Asia",
    "currencyCode": "AED",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "AF",
    "nameEn": "Afghanistan",
    "region": "Southern Asia",
    "currencyCode": "AFN",
    "officialLanguages": [
      "ps",
      "fa"
    ]
  },
  {
    "code": "AG",
    "nameEn": "Antigua & Barbuda",
    "region": "Caribbean",
    "currencyCode": "XCD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "AL",
    "nameEn": "Albania",
    "region": "Southern Europe",
    "currencyCode": "ALL",
    "officialLanguages": [
      "sq"
    ]
  },
  {
    "code": "AM",
    "nameEn": "Armenia",
    "region": "Western Asia",
    "currencyCode": "AMD",
    "officialLanguages": [
      "hy"
    ]
  },
  {
    "code": "AO",
    "nameEn": "Angola",
    "region": "Middle Africa",
    "currencyCode": "AOA",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "AR",
    "nameEn": "Argentina",
    "region": "South America",
    "currencyCode": "ARS",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "AS",
    "nameEn": "American Samoa",
    "region": "Polynesia",
    "currencyCode": "USD",
    "officialLanguages": [
      "en",
      "sm"
    ]
  },
  {
    "code": "AT",
    "nameEn": "Austria",
    "region": "Western Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "de"
    ]
  },
  {
    "code": "AU",
    "nameEn": "Australia",
    "region": "Australia and New Zealand",
    "currencyCode": "AUD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "AW",
    "nameEn": "Aruba",
    "region": "Caribbean",
    "currencyCode": "AWG",
    "officialLanguages": [
      "nl"
    ]
  },
  {
    "code": "AZ",
    "nameEn": "Azerbaijan",
    "region": "Western Asia",
    "currencyCode": "AZN",
    "officialLanguages": [
      "az"
    ]
  },
  {
    "code": "BA",
    "nameEn": "Bosnia & Herzegovina",
    "region": "Southern Europe",
    "currencyCode": "BAM",
    "officialLanguages": [
      "bs",
      "hr",
      "sr"
    ]
  },
  {
    "code": "BB",
    "nameEn": "Barbados",
    "region": "Caribbean",
    "currencyCode": "BBD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "BD",
    "nameEn": "Bangladesh",
    "region": "Southern Asia",
    "currencyCode": "BDT",
    "officialLanguages": [
      "bn"
    ]
  },
  {
    "code": "BE",
    "nameEn": "Belgium",
    "region": "Western Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "nl",
      "fr",
      "de"
    ]
  },
  {
    "code": "BF",
    "nameEn": "Burkina Faso",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "BG",
    "nameEn": "Bulgaria",
    "region": "Eastern Europe",
    "currencyCode": "BGN",
    "officialLanguages": [
      "bg"
    ]
  },
  {
    "code": "BH",
    "nameEn": "Bahrain",
    "region": "Western Asia",
    "currencyCode": "BHD",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "BI",
    "nameEn": "Burundi",
    "region": "East Africa",
    "currencyCode": "BIF",
    "officialLanguages": [
      "rn",
      "fr"
    ]
  },
  {
    "code": "BJ",
    "nameEn": "Benin",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "BN",
    "nameEn": "Brunei",
    "region": "Southeast Asia",
    "currencyCode": "BND",
    "officialLanguages": [
      "ms"
    ]
  },
  {
    "code": "BO",
    "nameEn": "Bolivia",
    "region": "South America",
    "currencyCode": "BOB",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "BR",
    "nameEn": "Brazil",
    "region": "South America",
    "currencyCode": "BRL",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "BS",
    "nameEn": "Bahamas",
    "region": "Caribbean",
    "currencyCode": "BSD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "BT",
    "nameEn": "Bhutan",
    "region": "Southern Asia",
    "currencyCode": "BTN",
    "officialLanguages": [
      "dz"
    ]
  },
  {
    "code": "BW",
    "nameEn": "Botswana",
    "region": "Southern Africa",
    "currencyCode": "BWP",
    "officialLanguages": [
      "en",
      "tn"
    ]
  },
  {
    "code": "BY",
    "nameEn": "Belarus",
    "region": "Eastern Europe",
    "currencyCode": "BYN",
    "officialLanguages": [
      "be",
      "ru"
    ]
  },
  {
    "code": "BZ",
    "nameEn": "Belize",
    "region": "Central America",
    "currencyCode": "BZD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "CA",
    "nameEn": "Canada",
    "region": "Northern America",
    "currencyCode": "CAD",
    "officialLanguages": [
      "en",
      "fr"
    ]
  },
  {
    "code": "CD",
    "nameEn": "Congo - Kinshasa",
    "region": "Middle Africa",
    "currencyCode": "CDF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "CF",
    "nameEn": "Central African Republic",
    "region": "Middle Africa",
    "currencyCode": "XAF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "CG",
    "nameEn": "Congo - Brazzaville",
    "region": "Middle Africa",
    "currencyCode": "XAF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "CH",
    "nameEn": "Switzerland",
    "region": "Western Europe",
    "currencyCode": "CHF",
    "officialLanguages": [
      "de",
      "fr",
      "it"
    ]
  },
  {
    "code": "CI",
    "nameEn": "Côte d'Ivoire",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "CL",
    "nameEn": "Chile",
    "region": "South America",
    "currencyCode": "CLP",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "CM",
    "nameEn": "Cameroon",
    "region": "Middle Africa",
    "currencyCode": "XAF",
    "officialLanguages": [
      "fr",
      "en"
    ]
  },
  {
    "code": "CN",
    "nameEn": "China",
    "region": "Eastern Asia",
    "currencyCode": "CNY",
    "officialLanguages": [
      "zh"
    ]
  },
  {
    "code": "CO",
    "nameEn": "Colombia",
    "region": "South America",
    "currencyCode": "COP",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "CR",
    "nameEn": "Costa Rica",
    "region": "Central America",
    "currencyCode": "CRC",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "CU",
    "nameEn": "Cuba",
    "region": "Caribbean",
    "currencyCode": "CUP",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "CV",
    "nameEn": "Cape Verde",
    "region": "West Africa",
    "currencyCode": "CVE",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "CW",
    "nameEn": "Curaçao",
    "region": "Caribbean",
    "currencyCode": "ANG",
    "officialLanguages": [
      "nl",
      "en"
    ]
  },
  {
    "code": "CY",
    "nameEn": "Cyprus",
    "region": "Western Asia",
    "currencyCode": "EUR",
    "officialLanguages": [
      "el",
      "tr"
    ]
  },
  {
    "code": "CZ",
    "nameEn": "Czechia",
    "region": "Eastern Europe",
    "currencyCode": "CZK",
    "officialLanguages": [
      "cs"
    ]
  },
  {
    "code": "DE",
    "nameEn": "Germany",
    "region": "Western Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "de"
    ]
  },
  {
    "code": "DJ",
    "nameEn": "Djibouti",
    "region": "East Africa",
    "currencyCode": "DJF",
    "officialLanguages": [
      "ar",
      "fr"
    ]
  },
  {
    "code": "DK",
    "nameEn": "Denmark",
    "region": "Northern Europe",
    "currencyCode": "DKK",
    "officialLanguages": [
      "da"
    ]
  },
  {
    "code": "DM",
    "nameEn": "Dominica",
    "region": "Caribbean",
    "currencyCode": "XCD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "DO",
    "nameEn": "Dominican Republic",
    "region": "Caribbean",
    "currencyCode": "DOP",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "DZ",
    "nameEn": "Algeria",
    "region": "North Africa",
    "currencyCode": "DZD",
    "officialLanguages": [
      "ar",
      "ber",
      "fr"
    ]
  },
  {
    "code": "EC",
    "nameEn": "Ecuador",
    "region": "South America",
    "currencyCode": "USD",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "EE",
    "nameEn": "Estonia",
    "region": "Northern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "et"
    ]
  },
  {
    "code": "EG",
    "nameEn": "Egypt",
    "region": "North Africa",
    "currencyCode": "EGP",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "ER",
    "nameEn": "Eritrea",
    "region": "East Africa",
    "currencyCode": "ERN",
    "officialLanguages": [
      "ti",
      "ar",
      "en"
    ]
  },
  {
    "code": "ES",
    "nameEn": "Spain",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "ET",
    "nameEn": "Ethiopia",
    "region": "East Africa",
    "currencyCode": "ETB",
    "officialLanguages": [
      "am"
    ]
  },
  {
    "code": "FI",
    "nameEn": "Finland",
    "region": "Northern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "fi",
      "sv"
    ]
  },
  {
    "code": "FJ",
    "nameEn": "Fiji",
    "region": "Melanesia",
    "currencyCode": "FJD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "FM",
    "nameEn": "Micronesia",
    "region": "Micronesia",
    "currencyCode": "USD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "FR",
    "nameEn": "France",
    "region": "Western Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "GA",
    "nameEn": "Gabon",
    "region": "Middle Africa",
    "currencyCode": "XAF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "GB",
    "nameEn": "United Kingdom",
    "region": "Northern Europe",
    "currencyCode": "GBP",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "GD",
    "nameEn": "Grenada",
    "region": "Caribbean",
    "currencyCode": "XCD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "GE",
    "nameEn": "Georgia",
    "region": "Western Asia",
    "currencyCode": "GEL",
    "officialLanguages": [
      "ka"
    ]
  },
  {
    "code": "GH",
    "nameEn": "Ghana",
    "region": "West Africa",
    "currencyCode": "GHS",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "GM",
    "nameEn": "Gambia",
    "region": "West Africa",
    "currencyCode": "GMD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "GN",
    "nameEn": "Guinea",
    "region": "West Africa",
    "currencyCode": "GNF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "GQ",
    "nameEn": "Equatorial Guinea",
    "region": "Middle Africa",
    "currencyCode": "XAF",
    "officialLanguages": [
      "es",
      "fr",
      "pt"
    ]
  },
  {
    "code": "GR",
    "nameEn": "Greece",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "el"
    ]
  },
  {
    "code": "GT",
    "nameEn": "Guatemala",
    "region": "Central America",
    "currencyCode": "GTQ",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "GU",
    "nameEn": "Guam",
    "region": "Micronesia",
    "currencyCode": "USD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "GW",
    "nameEn": "Guinea-Bissau",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "GY",
    "nameEn": "Guyana",
    "region": "South America",
    "currencyCode": "GYD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "HK",
    "nameEn": "Hong Kong SAR China",
    "region": "Eastern Asia",
    "currencyCode": "HKD",
    "officialLanguages": [
      "zh",
      "en"
    ]
  },
  {
    "code": "HN",
    "nameEn": "Honduras",
    "region": "Central America",
    "currencyCode": "HNL",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "HR",
    "nameEn": "Croatia",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "hr"
    ]
  },
  {
    "code": "HT",
    "nameEn": "Haiti",
    "region": "Caribbean",
    "currencyCode": "HTG",
    "officialLanguages": [
      "ht",
      "fr"
    ]
  },
  {
    "code": "HU",
    "nameEn": "Hungary",
    "region": "Eastern Europe",
    "currencyCode": "HUF",
    "officialLanguages": [
      "hu"
    ]
  },
  {
    "code": "ID",
    "nameEn": "Indonesia",
    "region": "Southeast Asia",
    "currencyCode": "IDR",
    "officialLanguages": [
      "id"
    ]
  },
  {
    "code": "IE",
    "nameEn": "Ireland",
    "region": "Northern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "IL",
    "nameEn": "Israel",
    "region": "Western Asia",
    "currencyCode": "ILS",
    "officialLanguages": [
      "he",
      "ar"
    ]
  },
  {
    "code": "IN",
    "nameEn": "India",
    "region": "Southern Asia",
    "currencyCode": "INR",
    "officialLanguages": [
      "hi",
      "en"
    ]
  },
  {
    "code": "IQ",
    "nameEn": "Iraq",
    "region": "Western Asia",
    "currencyCode": "IQD",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "IR",
    "nameEn": "Iran",
    "region": "Southern Asia",
    "currencyCode": "IRR",
    "officialLanguages": [
      "fa"
    ]
  },
  {
    "code": "IS",
    "nameEn": "Iceland",
    "region": "Northern Europe",
    "currencyCode": "ISK",
    "officialLanguages": [
      "is"
    ]
  },
  {
    "code": "IT",
    "nameEn": "Italy",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "it"
    ]
  },
  {
    "code": "JM",
    "nameEn": "Jamaica",
    "region": "Caribbean",
    "currencyCode": "JMD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "JO",
    "nameEn": "Jordan",
    "region": "Western Asia",
    "currencyCode": "JOD",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "JP",
    "nameEn": "Japan",
    "region": "Eastern Asia",
    "currencyCode": "JPY",
    "officialLanguages": [
      "ja"
    ]
  },
  {
    "code": "KE",
    "nameEn": "Kenya",
    "region": "East Africa",
    "currencyCode": "KES",
    "officialLanguages": [
      "sw",
      "en"
    ]
  },
  {
    "code": "KG",
    "nameEn": "Kyrgyzstan",
    "region": "Central Asia",
    "currencyCode": "KGS",
    "officialLanguages": [
      "ky",
      "ru"
    ]
  },
  {
    "code": "KH",
    "nameEn": "Cambodia",
    "region": "Southeast Asia",
    "currencyCode": "KHR",
    "officialLanguages": [
      "km"
    ]
  },
  {
    "code": "KI",
    "nameEn": "Kiribati",
    "region": "Micronesia",
    "currencyCode": "AUD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "KM",
    "nameEn": "Comoros",
    "region": "East Africa",
    "currencyCode": "KMF",
    "officialLanguages": [
      "ar",
      "fr"
    ]
  },
  {
    "code": "KN",
    "nameEn": "St. Kitts & Nevis",
    "region": "Caribbean",
    "currencyCode": "XCD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "KP",
    "nameEn": "North Korea",
    "region": "Eastern Asia",
    "currencyCode": "KPW",
    "officialLanguages": [
      "ko"
    ]
  },
  {
    "code": "KR",
    "nameEn": "South Korea",
    "region": "Eastern Asia",
    "currencyCode": "KRW",
    "officialLanguages": [
      "ko"
    ]
  },
  {
    "code": "KW",
    "nameEn": "Kuwait",
    "region": "Western Asia",
    "currencyCode": "KWD",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "KZ",
    "nameEn": "Kazakhstan",
    "region": "Central Asia",
    "currencyCode": "KZT",
    "officialLanguages": [
      "kk",
      "ru"
    ]
  },
  {
    "code": "LA",
    "nameEn": "Laos",
    "region": "Southeast Asia",
    "currencyCode": "LAK",
    "officialLanguages": [
      "lo"
    ]
  },
  {
    "code": "LB",
    "nameEn": "Lebanon",
    "region": "Western Asia",
    "currencyCode": "LBP",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "LC",
    "nameEn": "St. Lucia",
    "region": "Caribbean",
    "currencyCode": "XCD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "LI",
    "nameEn": "Liechtenstein",
    "region": "Western Europe",
    "currencyCode": "CHF",
    "officialLanguages": [
      "de"
    ]
  },
  {
    "code": "LK",
    "nameEn": "Sri Lanka",
    "region": "Southern Asia",
    "currencyCode": "LKR",
    "officialLanguages": [
      "si",
      "ta"
    ]
  },
  {
    "code": "LR",
    "nameEn": "Liberia",
    "region": "West Africa",
    "currencyCode": "LRD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "LS",
    "nameEn": "Lesotho",
    "region": "Southern Africa",
    "currencyCode": "LSL",
    "officialLanguages": [
      "st",
      "en"
    ]
  },
  {
    "code": "LT",
    "nameEn": "Lithuania",
    "region": "Northern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "lt"
    ]
  },
  {
    "code": "LU",
    "nameEn": "Luxembourg",
    "region": "Western Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "fr",
      "de"
    ]
  },
  {
    "code": "LV",
    "nameEn": "Latvia",
    "region": "Northern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "lv"
    ]
  },
  {
    "code": "LY",
    "nameEn": "Libya",
    "region": "North Africa",
    "currencyCode": "LYD",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "MA",
    "nameEn": "Morocco",
    "region": "North Africa",
    "currencyCode": "MAD",
    "officialLanguages": [
      "ar",
      "fr",
      "ber"
    ]
  },
  {
    "code": "MC",
    "nameEn": "Monaco",
    "region": "Western Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "MD",
    "nameEn": "Moldova",
    "region": "Eastern Europe",
    "currencyCode": "MDL",
    "officialLanguages": [
      "ro"
    ]
  },
  {
    "code": "ME",
    "nameEn": "Montenegro",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "sr"
    ]
  },
  {
    "code": "MG",
    "nameEn": "Madagascar",
    "region": "East Africa",
    "currencyCode": "MGA",
    "officialLanguages": [
      "mg",
      "fr"
    ]
  },
  {
    "code": "MH",
    "nameEn": "Marshall Islands",
    "region": "Micronesia",
    "currencyCode": "USD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "MK",
    "nameEn": "North Macedonia",
    "region": "Southern Europe",
    "currencyCode": "MKD",
    "officialLanguages": [
      "mk"
    ]
  },
  {
    "code": "ML",
    "nameEn": "Mali",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "MM",
    "nameEn": "Myanmar (Burma)",
    "region": "Southeast Asia",
    "currencyCode": "MMK",
    "officialLanguages": [
      "my"
    ]
  },
  {
    "code": "MN",
    "nameEn": "Mongolia",
    "region": "Eastern Asia",
    "currencyCode": "MNT",
    "officialLanguages": [
      "mn"
    ]
  },
  {
    "code": "MO",
    "nameEn": "Macao SAR China",
    "region": "Eastern Asia",
    "currencyCode": "MOP",
    "officialLanguages": [
      "zh",
      "pt"
    ]
  },
  {
    "code": "MP",
    "nameEn": "Northern Mariana Islands",
    "region": "Micronesia",
    "currencyCode": "USD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "MR",
    "nameEn": "Mauritania",
    "region": "West Africa",
    "currencyCode": "MRU",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "MT",
    "nameEn": "Malta",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "mt",
      "en"
    ]
  },
  {
    "code": "MU",
    "nameEn": "Mauritius",
    "region": "East Africa",
    "currencyCode": "MUR",
    "officialLanguages": [
      "en",
      "fr"
    ]
  },
  {
    "code": "MV",
    "nameEn": "Maldives",
    "region": "Southern Asia",
    "currencyCode": "MVR",
    "officialLanguages": [
      "dv"
    ]
  },
  {
    "code": "MW",
    "nameEn": "Malawi",
    "region": "East Africa",
    "currencyCode": "MWK",
    "officialLanguages": [
      "ny",
      "en"
    ]
  },
  {
    "code": "MX",
    "nameEn": "Mexico",
    "region": "Central America",
    "currencyCode": "MXN",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "MY",
    "nameEn": "Malaysia",
    "region": "Southeast Asia",
    "currencyCode": "MYR",
    "officialLanguages": [
      "ms"
    ]
  },
  {
    "code": "MZ",
    "nameEn": "Mozambique",
    "region": "East Africa",
    "currencyCode": "MZN",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "NA",
    "nameEn": "Namibia",
    "region": "Southern Africa",
    "currencyCode": "NAD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "NE",
    "nameEn": "Niger",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "NG",
    "nameEn": "Nigeria",
    "region": "West Africa",
    "currencyCode": "NGN",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "NI",
    "nameEn": "Nicaragua",
    "region": "Central America",
    "currencyCode": "NIO",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "NL",
    "nameEn": "Netherlands",
    "region": "Western Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "nl"
    ]
  },
  {
    "code": "NO",
    "nameEn": "Norway",
    "region": "Northern Europe",
    "currencyCode": "NOK",
    "officialLanguages": [
      "no"
    ]
  },
  {
    "code": "NP",
    "nameEn": "Nepal",
    "region": "Southern Asia",
    "currencyCode": "NPR",
    "officialLanguages": [
      "ne"
    ]
  },
  {
    "code": "NR",
    "nameEn": "Nauru",
    "region": "Micronesia",
    "currencyCode": "AUD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "NZ",
    "nameEn": "New Zealand",
    "region": "Australia and New Zealand",
    "currencyCode": "NZD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "OM",
    "nameEn": "Oman",
    "region": "Western Asia",
    "currencyCode": "OMR",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "PA",
    "nameEn": "Panama",
    "region": "Central America",
    "currencyCode": "PAB",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "PE",
    "nameEn": "Peru",
    "region": "South America",
    "currencyCode": "PEN",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "PG",
    "nameEn": "Papua New Guinea",
    "region": "Melanesia",
    "currencyCode": "PGK",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "PH",
    "nameEn": "Philippines",
    "region": "Southeast Asia",
    "currencyCode": "PHP",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "PK",
    "nameEn": "Pakistan",
    "region": "Southern Asia",
    "currencyCode": "PKR",
    "officialLanguages": [
      "ur",
      "en"
    ]
  },
  {
    "code": "PL",
    "nameEn": "Poland",
    "region": "Eastern Europe",
    "currencyCode": "PLN",
    "officialLanguages": [
      "pl"
    ]
  },
  {
    "code": "PR",
    "nameEn": "Puerto Rico",
    "region": "Caribbean",
    "currencyCode": "USD",
    "officialLanguages": [
      "es",
      "en"
    ]
  },
  {
    "code": "PS",
    "nameEn": "Palestinian Territories",
    "region": "Western Asia",
    "currencyCode": "ILS",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "PT",
    "nameEn": "Portugal",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "PW",
    "nameEn": "Palau",
    "region": "Micronesia",
    "currencyCode": "USD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "PY",
    "nameEn": "Paraguay",
    "region": "South America",
    "currencyCode": "PYG",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "QA",
    "nameEn": "Qatar",
    "region": "Western Asia",
    "currencyCode": "QAR",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "RO",
    "nameEn": "Romania",
    "region": "Eastern Europe",
    "currencyCode": "RON",
    "officialLanguages": [
      "ro"
    ]
  },
  {
    "code": "RS",
    "nameEn": "Serbia",
    "region": "Southern Europe",
    "currencyCode": "RSD",
    "officialLanguages": [
      "sr"
    ]
  },
  {
    "code": "RU",
    "nameEn": "Russia",
    "region": "Eastern Europe",
    "currencyCode": "RUB",
    "officialLanguages": [
      "ru"
    ]
  },
  {
    "code": "RW",
    "nameEn": "Rwanda",
    "region": "East Africa",
    "currencyCode": "RWF",
    "officialLanguages": [
      "rw",
      "en",
      "fr"
    ]
  },
  {
    "code": "SA",
    "nameEn": "Saudi Arabia",
    "region": "Western Asia",
    "currencyCode": "SAR",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "SB",
    "nameEn": "Solomon Islands",
    "region": "Melanesia",
    "currencyCode": "SBD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "SC",
    "nameEn": "Seychelles",
    "region": "East Africa",
    "currencyCode": "SCR",
    "officialLanguages": [
      "en",
      "fr"
    ]
  },
  {
    "code": "SD",
    "nameEn": "Sudan",
    "region": "North Africa",
    "currencyCode": "SDG",
    "officialLanguages": [
      "ar",
      "en"
    ]
  },
  {
    "code": "SE",
    "nameEn": "Sweden",
    "region": "Northern Europe",
    "currencyCode": "SEK",
    "officialLanguages": [
      "sv"
    ]
  },
  {
    "code": "SG",
    "nameEn": "Singapore",
    "region": "Southeast Asia",
    "currencyCode": "SGD",
    "officialLanguages": [
      "en",
      "ms",
      "zh"
    ]
  },
  {
    "code": "SI",
    "nameEn": "Slovenia",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "sl"
    ]
  },
  {
    "code": "SK",
    "nameEn": "Slovakia",
    "region": "Eastern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "sk"
    ]
  },
  {
    "code": "SL",
    "nameEn": "Sierra Leone",
    "region": "West Africa",
    "currencyCode": "SLE",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "SM",
    "nameEn": "San Marino",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "it"
    ]
  },
  {
    "code": "SN",
    "nameEn": "Senegal",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "SO",
    "nameEn": "Somalia",
    "region": "East Africa",
    "currencyCode": "SOS",
    "officialLanguages": [
      "so",
      "ar"
    ]
  },
  {
    "code": "SR",
    "nameEn": "Suriname",
    "region": "South America",
    "currencyCode": "SRD",
    "officialLanguages": [
      "nl"
    ]
  },
  {
    "code": "SS",
    "nameEn": "South Sudan",
    "region": "East Africa",
    "currencyCode": "SSP",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "ST",
    "nameEn": "São Tomé & Príncipe",
    "region": "Middle Africa",
    "currencyCode": "STN",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "SV",
    "nameEn": "El Salvador",
    "region": "Central America",
    "currencyCode": "USD",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "SX",
    "nameEn": "Sint Maarten",
    "region": "Caribbean",
    "currencyCode": "ANG",
    "officialLanguages": [
      "en",
      "nl"
    ]
  },
  {
    "code": "SY",
    "nameEn": "Syria",
    "region": "Western Asia",
    "currencyCode": "SYP",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "SZ",
    "nameEn": "Eswatini",
    "region": "Southern Africa",
    "currencyCode": "SZL",
    "officialLanguages": [
      "en",
      "ss"
    ]
  },
  {
    "code": "TD",
    "nameEn": "Chad",
    "region": "Middle Africa",
    "currencyCode": "XAF",
    "officialLanguages": [
      "fr",
      "ar"
    ]
  },
  {
    "code": "TG",
    "nameEn": "Togo",
    "region": "West Africa",
    "currencyCode": "XOF",
    "officialLanguages": [
      "fr"
    ]
  },
  {
    "code": "TH",
    "nameEn": "Thailand",
    "region": "Southeast Asia",
    "currencyCode": "THB",
    "officialLanguages": [
      "th"
    ]
  },
  {
    "code": "TJ",
    "nameEn": "Tajikistan",
    "region": "Central Asia",
    "currencyCode": "TJS",
    "officialLanguages": [
      "tg"
    ]
  },
  {
    "code": "TL",
    "nameEn": "Timor-Leste",
    "region": "Southeast Asia",
    "currencyCode": "USD",
    "officialLanguages": [
      "pt"
    ]
  },
  {
    "code": "TM",
    "nameEn": "Turkmenistan",
    "region": "Central Asia",
    "currencyCode": "TMT",
    "officialLanguages": [
      "tk"
    ]
  },
  {
    "code": "TN",
    "nameEn": "Tunisia",
    "region": "North Africa",
    "currencyCode": "TND",
    "officialLanguages": [
      "ar",
      "fr"
    ]
  },
  {
    "code": "TO",
    "nameEn": "Tonga",
    "region": "Polynesia",
    "currencyCode": "TOP",
    "officialLanguages": [
      "to",
      "en"
    ]
  },
  {
    "code": "TR",
    "nameEn": "Türkiye",
    "region": "Western Asia",
    "currencyCode": "TRY",
    "officialLanguages": [
      "tr"
    ]
  },
  {
    "code": "TT",
    "nameEn": "Trinidad & Tobago",
    "region": "Caribbean",
    "currencyCode": "TTD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "TV",
    "nameEn": "Tuvalu",
    "region": "Polynesia",
    "currencyCode": "AUD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "TW",
    "nameEn": "Taiwan",
    "region": "Eastern Asia",
    "currencyCode": "TWD",
    "officialLanguages": [
      "zh"
    ]
  },
  {
    "code": "TZ",
    "nameEn": "Tanzania",
    "region": "East Africa",
    "currencyCode": "TZS",
    "officialLanguages": [
      "sw",
      "en"
    ]
  },
  {
    "code": "UA",
    "nameEn": "Ukraine",
    "region": "Eastern Europe",
    "currencyCode": "UAH",
    "officialLanguages": [
      "uk"
    ]
  },
  {
    "code": "UG",
    "nameEn": "Uganda",
    "region": "East Africa",
    "currencyCode": "UGX",
    "officialLanguages": [
      "en",
      "sw"
    ]
  },
  {
    "code": "US",
    "nameEn": "United States",
    "region": "Northern America",
    "currencyCode": "USD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "UY",
    "nameEn": "Uruguay",
    "region": "South America",
    "currencyCode": "UYU",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "UZ",
    "nameEn": "Uzbekistan",
    "region": "Central Asia",
    "currencyCode": "UZS",
    "officialLanguages": [
      "uz"
    ]
  },
  {
    "code": "VA",
    "nameEn": "Vatican City",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "it"
    ]
  },
  {
    "code": "VC",
    "nameEn": "St. Vincent & Grenadines",
    "region": "Caribbean",
    "currencyCode": "XCD",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "VE",
    "nameEn": "Venezuela",
    "region": "South America",
    "currencyCode": "VES",
    "officialLanguages": [
      "es"
    ]
  },
  {
    "code": "VN",
    "nameEn": "Vietnam",
    "region": "Southeast Asia",
    "currencyCode": "VND",
    "officialLanguages": [
      "vi"
    ]
  },
  {
    "code": "VU",
    "nameEn": "Vanuatu",
    "region": "Melanesia",
    "currencyCode": "VUV",
    "officialLanguages": [
      "en",
      "fr"
    ]
  },
  {
    "code": "WS",
    "nameEn": "Samoa",
    "region": "Polynesia",
    "currencyCode": "WST",
    "officialLanguages": [
      "sm",
      "en"
    ]
  },
  {
    "code": "XK",
    "nameEn": "Kosovo",
    "region": "Southern Europe",
    "currencyCode": "EUR",
    "officialLanguages": [
      "sq",
      "sr"
    ]
  },
  {
    "code": "YE",
    "nameEn": "Yemen",
    "region": "Western Asia",
    "currencyCode": "YER",
    "officialLanguages": [
      "ar"
    ]
  },
  {
    "code": "ZA",
    "nameEn": "South Africa",
    "region": "Southern Africa",
    "currencyCode": "ZAR",
    "officialLanguages": [
      "en",
      "zu",
      "af"
    ]
  },
  {
    "code": "ZM",
    "nameEn": "Zambia",
    "region": "Southern Africa",
    "currencyCode": "ZMW",
    "officialLanguages": [
      "en"
    ]
  },
  {
    "code": "ZW",
    "nameEn": "Zimbabwe",
    "region": "Southern Africa",
    "currencyCode": "ZWG",
    "officialLanguages": [
      "en"
    ]
  }
];

export const ISO_COUNTRY_BY_CODE: Record<string, IsoCountryDef> = Object.fromEntries(
  ISO_COUNTRIES.map((c) => [c.code, c]),
);

export function isoCountryName(code: string): string {
  return ISO_COUNTRY_BY_CODE[code.toUpperCase()]?.nameEn ?? code;
}

/** Africa subregions first, then other regions alphabetically, then code. */
export function africaFirstCountrySort(
  a: { region: string; code: string },
  b: { region: string; code: string },
): number {
  const aAf = a.region.includes('Africa') ? 0 : 1;
  const bAf = b.region.includes('Africa') ? 0 : 1;
  if (aAf !== bAf) return aAf - bAf;
  const r = a.region.localeCompare(b.region);
  if (r !== 0) return r;
  return a.code.localeCompare(b.code);
}
