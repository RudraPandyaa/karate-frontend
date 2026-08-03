export const COUNTRY_CODE_MAP: Record<string, string> = {
  IND: 'IN',
  JPN: 'JP',
  KOR: 'KR',
  PRK: 'KP',
  CHN: 'CN',
  TPE: 'TW',
  HKG: 'HK',
  MAC: 'MO',

  THA: 'TH',
  VNM: 'VN',
  MYS: 'MY',
  SGP: 'SG',
  IDN: 'ID',
  PHL: 'PH',

  NPL: 'NP',
  BTN: 'BT',
  LKA: 'LK',
  BGD: 'BD',
  PAK: 'PK',

  KAZ: 'KZ',
  UZB: 'UZ',
  KGZ: 'KG',
  TJK: 'TJ',
  TKM: 'TM',

  MGL: 'MN',

  IRN: 'IR',
  IRQ: 'IQ',
  JOR: 'JO',
  KWT: 'KW',
  QAT: 'QA',
  ARE: 'AE',
  SAU: 'SA',

  TUR: 'TR',

  USA: 'US',
  CAN: 'CA',
  GBR: 'GB',
  FRA: 'FR',
  DEU: 'DE',
  ITA: 'IT',
  ESP: 'ES',
  BRA: 'BR',
  AUS: 'AU',
  NZL: 'NZ',
}

export const COUNTRIES = [
  { code: 'IND', name: 'India', phoneCode: '+91' },
  { code: 'JPN', name: 'Japan', phoneCode: '+81' },
  { code: 'CHN', name: 'China', phoneCode: '+86' },
  { code: 'KOR', name: 'South Korea', phoneCode: '+82' },
  { code: 'PRK', name: 'North Korea', phoneCode: '+850' },
  { code: 'TPE', name: 'Chinese Taipei', phoneCode: '+886' },
  { code: 'HKG', name: 'Hong Kong', phoneCode: '+852' },
  { code: 'MAC', name: 'Macau', phoneCode: '+853' },

  { code: 'THA', name: 'Thailand', phoneCode: '+66' },
  { code: 'VNM', name: 'Vietnam', phoneCode: '+84' },
  { code: 'MYS', name: 'Malaysia', phoneCode: '+60' },
  { code: 'SGP', name: 'Singapore', phoneCode: '+65' },
  { code: 'IDN', name: 'Indonesia', phoneCode: '+62' },
  { code: 'PHL', name: 'Philippines', phoneCode: '+63' },

  { code: 'NPL', name: 'Nepal', phoneCode: '+977' },
  { code: 'BTN', name: 'Bhutan', phoneCode: '+975' },
  { code: 'LKA', name: 'Sri Lanka', phoneCode: '+94' },
  { code: 'BGD', name: 'Bangladesh', phoneCode: '+880' },
  { code: 'PAK', name: 'Pakistan', phoneCode: '+92' },

  { code: 'KAZ', name: 'Kazakhstan', phoneCode: '+7' },
  { code: 'UZB', name: 'Uzbekistan', phoneCode: '+998' },
  { code: 'KGZ', name: 'Kyrgyzstan', phoneCode: '+996' },
  { code: 'TJK', name: 'Tajikistan', phoneCode: '+992' },
  { code: 'TKM', name: 'Turkmenistan', phoneCode: '+993' },

  { code: 'MGL', name: 'Mongolia', phoneCode: '+976' },

  { code: 'IRN', name: 'Iran', phoneCode: '+98' },
  { code: 'IRQ', name: 'Iraq', phoneCode: '+964' },
  { code: 'JOR', name: 'Jordan', phoneCode: '+962' },
  { code: 'KWT', name: 'Kuwait', phoneCode: '+965' },
  { code: 'QAT', name: 'Qatar', phoneCode: '+974' },
  { code: 'ARE', name: 'United Arab Emirates', phoneCode: '+971' },
  { code: 'SAU', name: 'Saudi Arabia', phoneCode: '+966' },

  { code: 'TUR', name: 'Turkey', phoneCode: '+90' },

  { code: 'USA', name: 'United States', phoneCode: '+1' },
  { code: 'CAN', name: 'Canada', phoneCode: '+1' },
  { code: 'GBR', name: 'United Kingdom', phoneCode: '+44' },
  { code: 'FRA', name: 'France', phoneCode: '+33' },
  { code: 'DEU', name: 'Germany', phoneCode: '+49' },
  { code: 'ITA', name: 'Italy', phoneCode: '+39' },
  { code: 'ESP', name: 'Spain', phoneCode: '+34' },
  { code: 'BRA', name: 'Brazil', phoneCode: '+55' },
  { code: 'AUS', name: 'Australia', phoneCode: '+61' },
  { code: 'NZL', name: 'New Zealand', phoneCode: '+64' },
]

export const getCountry = (code?: string) =>
  COUNTRIES.find(c => c.code === code)

export function getFlagEmoji(code?: string) {
  if (!code) return '🏳️'

  const upper = code.trim().toUpperCase()

  // Already ISO-2 (e.g. IN, JP, US)
  let iso2 =
    upper.length === 2
      ? upper
      : COUNTRY_CODE_MAP[upper] // ISO-3 → ISO-2 (e.g. IND → IN)

  if (!iso2 || iso2.length !== 2) return '🏳️'

  return iso2
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    )
}