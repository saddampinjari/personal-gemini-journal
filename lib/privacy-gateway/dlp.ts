/**
 * Zero-Trust Privacy Gateway - Data Loss Prevention (DLP) Engine
 * 
 * Performs high-precision server-side de-identification (masking) and detokenization.
 * Scrubbed PII includes:
 * - Full Names & Individuals
 * - Email Addresses
 * - Phone Numbers (US & International)
 * - Locations, Addresses, Cities, & Countries
 * - Social Security Numbers (SSN)
 * - Credit Card & Financial Account Numbers
 * - IP Addresses & Network Identifiers
 */

export interface DetectedEntity {
  id: string;
  type: 'PERSON' | 'EMAIL' | 'PHONE' | 'LOCATION' | 'SSN' | 'CREDIT_CARD' | 'IP_ADDRESS' | 'ACCOUNT_ID';
  original: string;
  surrogate: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface DeidentificationResult {
  rawText: string;
  sanitizedText: string;
  tokenMap: Record<string, string>; // surrogate -> original
  reverseTokenMap: Record<string, string>; // original -> surrogate
  entities: DetectedEntity[];
  scrubCount: number;
}

// Regex patterns for sensitive entities
const PATTERNS = {
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  PHONE: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
  SSN: /\b\d{3}[- ]\d{2}[- ]\d{4}\b/g,
  CREDIT_CARD: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
  IP_ADDRESS: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  ACCOUNT_ID: /\b(?:ACCT|ID|USR|EMP)-[A-Z0-9]{4,10}\b/gi,
  // Common locations and location indicators
  LOCATION_KEYWORDS: /\b(?:in|at|from|to|near|visiting|living in|traveled to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g,
  KNOWN_LOCATIONS: /\b(?:Dubai|Abu Dhabi|Sharjah|UAE|United Arab Emirates|Riyadh|Doha|Cairo|Istanbul|New York|Los Angeles|San Francisco|Seattle|Chicago|Boston|Austin|London|Paris|Berlin|Tokyo|Kyoto|Seoul|Singapore|Bengaluru|Bangalore|Mumbai|Delhi|New Delhi|Hyderabad|Chennai|Sydney|Melbourne|Toronto|Vancouver|California|Texas|Washington|Florida|Canada|United Kingdom|Germany|Japan|Australia|India)\b/gi,
  // Person name indicators: Honorifics or conversational cues
  HONORIFICS: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Boss|Manager|Colleague|Partner|Friend|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
  // Conversational name mentions: "talked with John", "emailed Sarah", "argued with Alex Smith"
  NAME_CUES: /\b(?:with|with my friend|with my colleague|with my partner|with my manager|named|called|met with|talked to|spoke to|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
};

/**
 * Server-side Zero-Trust De-identification Engine
 * Scrubs all PII and replaces each entity with a surrogate token (e.g., [PERSON_1], [LOCATION_1]).
 */
export function deidentifyText(text: string): DeidentificationResult {
  if (!text || typeof text !== 'string') {
    return {
      rawText: '',
      sanitizedText: '',
      tokenMap: {},
      reverseTokenMap: {},
      entities: [],
      scrubCount: 0,
    };
  }

  const entities: DetectedEntity[] = [];
  const tokenMap: Record<string, string> = {};
  const reverseTokenMap: Record<string, string> = {};

  const typeCounters: Record<string, number> = {
    PERSON: 0,
    EMAIL: 0,
    PHONE: 0,
    LOCATION: 0,
    SSN: 0,
    CREDIT_CARD: 0,
    IP_ADDRESS: 0,
    ACCOUNT_ID: 0,
  };

  const addEntity = (
    type: DetectedEntity['type'],
    original: string,
    startIndex: number,
    endIndex: number,
    confidence = 0.95
  ) => {
    const trimmed = original.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Check if we already created a surrogate for this exact string
    let surrogate = reverseTokenMap[trimmed];
    if (!surrogate) {
      typeCounters[type] = (typeCounters[type] || 0) + 1;
      surrogate = `[${type}_${typeCounters[type]}]`;
      tokenMap[surrogate] = trimmed;
      reverseTokenMap[trimmed] = surrogate;
    }

    entities.push({
      id: `${type}_${entities.length + 1}`,
      type,
      original: trimmed,
      surrogate,
      startIndex,
      endIndex,
      confidence,
    });
  };

  // 1. High-certainty Regex Passes: SSN, Credit Cards, IP, Emails, Phone Numbers, Accounts
  let match: RegExpExecArray | null;

  // SSN
  const ssnRegex = new RegExp(PATTERNS.SSN.source, 'g');
  while ((match = ssnRegex.exec(text)) !== null) {
    addEntity('SSN', match[0], match.index, match.index + match[0].length, 0.99);
  }

  // Credit Card
  const ccRegex = new RegExp(PATTERNS.CREDIT_CARD.source, 'g');
  while ((match = ccRegex.exec(text)) !== null) {
    addEntity('CREDIT_CARD', match[0], match.index, match.index + match[0].length, 0.98);
  }

  // IP Address
  const ipRegex = new RegExp(PATTERNS.IP_ADDRESS.source, 'g');
  while ((match = ipRegex.exec(text)) !== null) {
    addEntity('IP_ADDRESS', match[0], match.index, match.index + match[0].length, 0.97);
  }

  // Email
  const emailRegex = new RegExp(PATTERNS.EMAIL.source, 'g');
  while ((match = emailRegex.exec(text)) !== null) {
    addEntity('EMAIL', match[0], match.index, match.index + match[0].length, 0.99);
  }

  // Phone
  const phoneRegex = new RegExp(PATTERNS.PHONE.source, 'g');
  while ((match = phoneRegex.exec(text)) !== null) {
    // Avoid small standalone numbers
    if (match[0].replace(/\D/g, '').length >= 7) {
      addEntity('PHONE', match[0], match.index, match.index + match[0].length, 0.95);
    }
  }

  // Account IDs
  const acctRegex = new RegExp(PATTERNS.ACCOUNT_ID.source, 'gi');
  while ((match = acctRegex.exec(text)) !== null) {
    addEntity('ACCOUNT_ID', match[0], match.index, match.index + match[0].length, 0.96);
  }

  // Known Locations
  const locRegex = new RegExp(PATTERNS.KNOWN_LOCATIONS.source, 'gi');
  while ((match = locRegex.exec(text)) !== null) {
    addEntity('LOCATION', match[0], match.index, match.index + match[0].length, 0.92);
  }

  // Contextual Locations
  const locCueRegex = new RegExp(PATTERNS.LOCATION_KEYWORDS.source, 'g');
  while ((match = locCueRegex.exec(text)) !== null) {
    if (match[1]) {
      const idx = match.index + match[0].indexOf(match[1]);
      addEntity('LOCATION', match[1], idx, idx + match[1].length, 0.88);
    }
  }

  // Honorific Names
  const honRegex = new RegExp(PATTERNS.HONORIFICS.source, 'g');
  while ((match = honRegex.exec(text)) !== null) {
    if (match[1]) {
      const idx = match.index + match[0].indexOf(match[1]);
      addEntity('PERSON', match[1], idx, idx + match[1].length, 0.95);
    }
  }

  // Contextual Names
  const nameCueRegex = new RegExp(PATTERNS.NAME_CUES.source, 'g');
  while ((match = nameCueRegex.exec(text)) !== null) {
    if (match[1] && !['The', 'This', 'That', 'My', 'Our', 'Some', 'All'].includes(match[1])) {
      const idx = match.index + match[0].indexOf(match[1]);
      addEntity('PERSON', match[1], idx, idx + match[1].length, 0.89);
    }
  }

  // Deduplicate and replace in text
  // Sort entities by length descending to replace longer substrings first
  const sortedReplacements = Object.entries(reverseTokenMap).sort(
    (a, b) => b[0].length - a[0].length
  );

  let sanitized = text;
  for (const [orig, surrogate] of sortedReplacements) {
    // Escape special regex characters in original string
    const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceRegex = new RegExp(`\\b${escaped}\\b`, 'g');
    sanitized = sanitized.replace(replaceRegex, surrogate);
  }

  return {
    rawText: text,
    sanitizedText: sanitized,
    tokenMap,
    reverseTokenMap,
    entities,
    scrubCount: entities.length,
  };
}

/**
 * Server-side Detokenization Engine
 * Replaces surrogate tokens back into original human entities for authenticated user viewing.
 */
export function detokenizeText(
  sanitizedText: string,
  tokenMap: Record<string, string>
): string {
  if (!sanitizedText || !tokenMap) return sanitizedText || '';

  let output = sanitizedText;
  for (const [surrogate, original] of Object.entries(tokenMap)) {
    const escaped = surrogate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    output = output.replace(regex, original);
  }

  return output;
}
