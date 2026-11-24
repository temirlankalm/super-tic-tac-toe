/**
 * Nickname generation, validation, sanitization, and profanity filtering.
 */

const ADJECTIVES = [
  'Swift',
  'Clever',
  'Brave',
  'Cosmic',
  'Calm',
  'Lucky',
  'Sharp',
  'Golden',
  'Silver',
  'Gentle',
  'Wise',
  'Amber',
  'Bright',
  'Silent',
  'Wild',
  'Noble',
  'Quiet',
  'Sunny',
  'Nimble',
  'Stellar',
  'Quick',
  'Bold',
];

const ANIMALS = [
  'Panda',
  'Fox',
  'Falcon',
  'Otter',
  'Wolf',
  'Hawk',
  'Tiger',
  'Badger',
  'Koala',
  'Dolphin',
  'Lynx',
  'Owl',
  'Bear',
  'Crane',
  'Raven',
  'Deer',
  'Eagle',
  'Hedgehog',
  'Leopard',
  'Seal',
];

// Allow-list for names containing false-positive substrings
const ALLOW_LIST = [
  'dickson',
  'hancock',
  'cockburn',
  'dickens',
  'babcock',
  'hitchcock',
  'glasscock',
  'woodcock',
  'cockrell',
  'moorcock',
];

// English vulgar root words (matched with word boundaries)
const ENGLISH_PROFANITY_WORDS = [
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'bitch',
  'cunt',
  'dick',
  'cock',
  'asshole',
  'whore',
  'slut',
  'nigger',
  'nigga',
  'faggot',
  'bastard',
  'pussy',
];

// Russian vulgar root stems
const RUSSIAN_PROFANITY_ROOTS = [
  'хуй',
  'хуя',
  'хуе',
  'хуи',
  'пизд',
  'ебат',
  'ебан',
  'ебло',
  'бляд',
  'сука',
  'сучк',
  'мудак',
  'мудил',
  'гандон',
  'гондон',
  'залуп',
  'пидор',
  'пидар',
  'дроч',
  'нахер',
  'нахуй',
];

export function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10..99
  return `${adj} ${animal} ${num}`.slice(0, 16);
}

/**
 * Checks whether a nickname contains prohibited / vulgar words.
 * Uses word-boundary matching and allow-list (Dickson, Hancock, Cockburn pass).
 * Normalizes spaces and repeated letters before checking.
 */
export function containsProfanity(raw: string): boolean {
  if (!raw) return false;

  // 1. Normalize spaces
  const spaceNormalized = raw.trim().replace(/\s+/g, ' ');

  // Split into individual tokens / words
  const tokens = spaceNormalized.split(/[\s_\-]+/);

  for (const rawToken of tokens) {
    if (!rawToken) continue;
    const lowerToken = rawToken.toLowerCase();

    // Check allow-list first
    if (ALLOW_LIST.includes(lowerToken)) {
      continue;
    }

    // 2. Collapse repeated characters (3+ -> 1 or 2, e.g. fuuuuck -> fuuck)
    const collapsed = lowerToken.replace(/(.)\1{2,}/gu, '$1$1');

    // 3. Normalize leetspeak
    const normalized = collapsed
      .replace(/[@4]/g, 'a')
      .replace(/[1!|]/g, 'i')
      .replace(/[0]/g, 'o')
      .replace(/[3]/g, 'e')
      .replace(/[$5]/g, 's')
      .replace(/[+]/g, 't');

    // Check English words (word boundary on token)
    for (const bad of ENGLISH_PROFANITY_WORDS) {
      if (normalized === bad || normalized.startsWith(`${bad}s`)) {
        return true;
      }
      // Also match if surrounded by digits/symbols inside the token
      const wordBoundaryRegex = new RegExp(`(^|[^a-z])${bad}([^a-z]|$)`, 'i');
      if (wordBoundaryRegex.test(normalized)) {
        return true;
      }
    }

    // Check Russian roots
    for (const root of RUSSIAN_PROFANITY_ROOTS) {
      if (normalized.includes(root)) {
        return true;
      }
    }
  }

  return false;
}

export interface NicknameValidationResult {
  valid: boolean;
  errorKey?: 'tooLong' | 'tooShort' | 'invalidChars' | 'profanityError';
  sanitized: string;
}

/**
 * Sanitizes and validates a proposed nickname.
 * Max 16 characters. Allowed: Latin and Cyrillic letters, digits, spaces, _, -
 */
export function validateNickname(input: string): NicknameValidationResult {
  const trimmed = (input || '').trim().replace(/\s+/g, ' ');

  if (trimmed.length < 2) {
    return { valid: false, errorKey: 'tooShort', sanitized: trimmed };
  }

  if (trimmed.length > 16) {
    return {
      valid: false,
      errorKey: 'tooLong',
      sanitized: trimmed.slice(0, 16),
    };
  }

  // Regex allows English & Russian letters, numbers, space, underscore, hyphen
  const regex = /^[a-zA-Z0-9\u0400-\u04FF _-]+$/;
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      errorKey: 'invalidChars',
      sanitized: trimmed.replace(/[^a-zA-Z0-9\u0400-\u04FF _-]/g, '').slice(0, 16),
    };
  }

  if (containsProfanity(trimmed)) {
    return {
      valid: false,
      errorKey: 'profanityError',
      sanitized: trimmed,
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Strictly sanitizes any incoming nickname string (from network, storage, or input)
 * ensuring it cannot inject HTML, scripts, or exceed 16 characters.
 */
export function sanitizeNickname(input: unknown): string {
  if (!input || typeof input !== 'string') {
    return generateRandomNickname();
  }

  // Strip HTML tags and control characters
  const clean = input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>&"'\\]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 16);

  const validation = validateNickname(clean);
  if (validation.valid && validation.sanitized) {
    return validation.sanitized;
  }

  return generateRandomNickname();
}
