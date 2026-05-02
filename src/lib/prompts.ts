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

export function topicsPrompt(
  tradition: Tradition,
  dateLabel: string,
  favouriteThemes: string[] = [],
) {
  const favouriteLine =
    favouriteThemes.length > 0
      ? `Caregiver-favoured topic themes to weave in when natural: ${favouriteThemes.join(", ")}.`
      : "No caregiver-favoured topic themes are selected yet.";

  return `
For ${dateLabel}, generate exactly 4 daily topic options for the ${tradition} path in the Two Paths app.
${favouriteLine}

Return JSON only in this shape:
{
  "topics": [
    {
      "title": "short title",
      "summary": "one calm sentence",
      "difficulty": "gentle",
      "visual": "one of: candles, teacher, scroll, seedling, stones, mountain, tree, lotus"
    }
  ]
}

The topics should be varied. Prefer beautiful, accessible ideas, short teaching stories, compassion, rest, memory, gratitude, patience, wisdom, or daily practice.
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
  const modeInstruction =
    mode === "story"
      ? "Make this Story Mode: lead with one memorable teaching story, then draw out the meaning gently. The narration should feel like being told a short parable or historical anecdote."
      : mode === "quiz"
        ? "Make this Gentle Quiz mode: use a very short setup, then include one clear question and one hint. Keep the teaching concise so the question feels central but never like a test."
        : "Make this Listen and Learn mode: offer a clear, direct explainer with a warm opening, one or two key ideas, and a calming close.";

  return `
Create a ${minutes}-minute ${mode} session for the ${tradition} path.

Topic: ${topicTitle}
Topic summary: ${topicSummary}
Mode direction: ${modeInstruction}

Return JSON only in this shape:
{
  "title": "clear session title",
  "script": "voice-ready narration, 320 to 560 words, short paragraphs, occasional [pause] tags only",
  "simplifiedScript": "same idea in 140 to 220 words, even simpler and calmer, voice-ready",
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
The title and script must make the selected mode obvious without using clinical or school-like wording.
Write the script for spoken narration: natural pacing, intelligent but plain language, no childish tone, no dense academic phrasing, no theatrical tags except occasional [pause].
`;
}
