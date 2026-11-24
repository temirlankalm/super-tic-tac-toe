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

// Profanity wordlist (English and Russian root stems)
const PROFANITY_ROOTS = [
  // English
  'fuck',
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
  // Russian
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
  'чмо',
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
 */
export function containsProfanity(raw: string): boolean {
  if (!raw) return false;
  // Normalize: lower case, replace common leetspeak
  const normalized = raw
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[3]/g, 'e')
    .replace(/[$5]/g, 's')
    .replace(/[+]/g, 't');

  for (const root of PROFANITY_ROOTS) {
    if (normalized.includes(root)) {
      return true;
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

  if (!trimmed) {
    return { valid: false, errorKey: 'tooShort', sanitized: '' };
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
