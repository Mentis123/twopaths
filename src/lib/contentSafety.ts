const unsafePatterns: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(dementia|alzheimer'?s|parkinson'?s|cognitive\s+(?:test|decline|impairment)|memory\s+test|clinical\s+(?:trial|setting|diagnosis))\b/i,
    reason: "clinical or cognitive-testing language",
  },
  {
    pattern: /\b(correct|true|only)\s+religion\b/i,
    reason: "proselytising or superiority language",
  },
  {
    pattern: /\b(convert|conversion|proselyti[sz]e|proselyti[sz]ing)\b/i,
    reason: "proselytising language",
  },
  {
    pattern: /\b(all|every)\s+(jews|jewish people|buddhists)\b/i,
    reason: "sweeping religious claim",
  },
  {
    pattern: /\b(judaism says|buddhism believes|jews believe|buddhists believe)\b/i,
    reason: "over-broad doctrinal wording",
  },
  {
    pattern: /\b(superior|inferior|primitive|evil|heretical)\b/i,
    reason: "hostile religious comparison",
  },
  {
    pattern: /\b(eternal damnation|divine punishment|you should feel guilty|shame on)\b/i,
    reason: "fear-heavy or shame-heavy framing",
  },
  {
    pattern: /\[(laugh|whisper|sigh|shout|cry|angry|sad)\]/i,
    reason: "unsupported theatrical speech tag",
  },
];

export type SafetyResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateSpokenContent(text: string): SafetyResult {
  for (const item of unsafePatterns) {
    if (item.pattern.test(text)) {
      return { ok: false, reason: item.reason };
    }
  }

  return { ok: true };
}

export function normalizeSpeechTags(text: string) {
  return text.replace(/\[pause\]/gi, "\n[pause]\n").replace(/\n{3,}/g, "\n\n").trim();
}
