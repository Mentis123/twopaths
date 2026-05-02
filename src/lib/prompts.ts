import type { SessionMode, Tradition } from "@/lib/types";

export const TWO_PATHS_SYSTEM_PROMPT = `
You create short spiritual learning content for an older adult who is curious, thoughtful, and may tire easily.
Tone: warm, respectful, gentle, intelligent, and never childish.
Rules:
- No proselytising.
- No medical advice, diagnosis language, clinical tracking, or cognitive testing language.
- Never say "as someone with dementia" or imply impairment.
- Do not shame, scold, test, or overcorrect.
- Keep traditions clearly distinct and avoid flattening them into one belief system.
- Avoid sweeping claims like "Judaism says" or "Buddhism says"; prefer "In many traditions..." or "One way this is understood..."
- Avoid sectarian, political, inflammatory, fear-heavy, guilt-heavy, or death-heavy material unless explicitly requested.
- Use short paragraphs and plain language.
- Make the session uplifting, reflective, and intellectually respectful.
`;

export function topicsPrompt(tradition: Tradition, dateLabel: string) {
  const pathLabel =
    tradition === "both"
      ? "Both Paths, with Judaism and Buddhism kept distinct but thoughtfully compared"
      : `the ${tradition} path`;

  return `
For ${dateLabel}, generate exactly 4 daily topic options for ${pathLabel} in the Two Paths app.

Return JSON only in this shape:
{
  "topics": [
    {
      "title": "short title",
      "summary": "one calm sentence",
      "difficulty": "gentle",
      "visual": "one of: candles, teacher, scroll, seedling, stones, mountain, tree, lotus, bridge, compass, gate, river"
    }
  ]
}

The topics should be varied. Prefer beautiful, accessible ideas, short teaching stories, compassion, rest, memory, gratitude, patience, wisdom, or daily practice.
If the path is Both Paths, compare carefully without saying the traditions are the same.
`;
}

export function lessonPrompt({
  tradition,
  topicTitle,
  topicSummary,
  mode,
  minutes,
}: {
  tradition: Tradition;
  topicTitle: string;
  topicSummary: string;
  mode: SessionMode;
  minutes: number;
}) {
  const pathLabel =
    tradition === "both"
      ? "Both Paths, carefully comparing Judaism and Buddhism without flattening either tradition"
      : `the ${tradition} path`;

  return `
Create a ${minutes}-minute ${mode} session for ${pathLabel}.

Topic: ${topicTitle}
Topic summary: ${topicSummary}

Return JSON only in this shape:
{
  "title": "clear session title",
  "script": "warm narration, 450 to 700 words, in short paragraphs",
  "simplifiedScript": "same idea in 180 to 260 words, even simpler and calmer",
  "segments": ["short segment 1", "short segment 2", "short segment 3"],
  "question": {
    "prompt": "gentle multiple choice question",
    "hint": "one kind hint",
    "options": [
      {"text": "answer option", "isCorrect": true, "response": "Yes, that's the idea."},
      {"text": "answer option", "isCorrect": false, "response": "That's a reasonable guess. Here is the simpler version."},
      {"text": "answer option", "isCorrect": false, "response": "That's a reasonable guess. Here is the simpler version."},
      {"text": "answer option", "isCorrect": false, "response": "That's a reasonable guess. Here is the simpler version."}
    ]
  },
  "closing": {
    "takeaway": "one sentence takeaway",
    "reflection": "one optional reflection question",
    "line": "one calming quote, prayer-adjacent line, or meditation prompt"
  }
}

The question must not feel like a test and must not mention score, memory, decline, symptoms, or performance.
`;
}
