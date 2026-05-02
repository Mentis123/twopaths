import { randomUUID } from "node:crypto";
import type { LessonSession, SessionMode, Topic, Tradition } from "@/lib/types";

const judaismTopics = [
  {
    title: "Shabbat as sanctuary in time",
    summary: "A gentle look at rest, attention, and what matters most.",
    visual: "candles",
  },
  {
    title: "A story from Rabbi Hillel",
    summary: "Timeless wisdom from a teacher remembered for patience.",
    visual: "teacher",
  },
  {
    title: "What the Shema invites us to remember",
    summary: "A short phrase with a profound meaning.",
    visual: "scroll",
  },
  {
    title: "Tikkun olam and small acts of repair",
    summary: "How little things can help heal the world around us.",
    visual: "seedling",
  },
] as const;

const buddhismTopics = [
  {
    title: "Mindfulness as coming home",
    summary: "Returning gently to the present moment.",
    visual: "stones",
  },
  {
    title: "The Four Noble Truths, gently explained",
    summary: "The heart of a teaching about suffering and freedom.",
    visual: "mountain",
  },
  {
    title: "A story about patience",
    summary: "A timeless tale to soften the heart.",
    visual: "tree",
  },
  {
    title: "Compassion in everyday life",
    summary: "Small moments can make a big difference.",
    visual: "lotus",
  },
] as const;

const bothTopics = [
  {
    title: "Compassion and sacred presence",
    summary: "A careful bridge between listening, mercy, and nearness.",
    visual: "bridge",
  },
  {
    title: "Rest and stillness",
    summary: "How Shabbat and sitting practice can interrupt hurry.",
    visual: "stones",
  },
  {
    title: "Character as daily practice",
    summary: "Mussar and Buddhist ethics as practical self-refinement.",
    visual: "compass",
  },
  {
    title: "Poetry and attention",
    summary: "Small moments as doorways into reverence and insight.",
    visual: "tree",
  },
] as const;

export function fallbackTopics(tradition: Tradition): Topic[] {
  const source =
    tradition === "judaism"
      ? judaismTopics
      : tradition === "buddhism"
        ? buddhismTopics
        : bothTopics;

  return source.map((topic) => ({
    id: randomUUID(),
    tradition,
    difficulty: "gentle",
    ...topic,
  }));
}

export function fallbackLesson({
  tradition,
  topic,
  mode,
}: {
  tradition: Tradition;
  topic: Topic;
  mode: SessionMode;
}): LessonSession {
  const isJudaism = tradition === "judaism";
  const isBoth = tradition === "both";
  const title = topic.title;
  const script = isBoth
    ? `Let us take this slowly. ${title} invites us to hold two traditions near each other without flattening them into one thing.

In a thoughtful bridge between Judaism and Buddhism, the first act is respect. Each tradition has its own texts, practices, histories, and inner arguments. The bridge is not built by saying they are secretly identical. It is built by listening carefully enough that each can illuminate a human question from its own place.

One way to understand this topic is to ask what kind of attention it trains. Judaism may speak through covenant, blessing, Torah, Shabbat, justice, memory, and repair. Buddhism may speak through mindfulness, compassion, non-attachment, emptiness, and liberation from suffering. When they are placed side by side, the question becomes richer, not simpler.

There is no rush here. The point is not to choose a winner, or to make a vague spiritual soup. The point is to become more awake to the ways wisdom can discipline a life. A bridge can be strong only when both banks remain real.

For today, we can receive this teaching simply: comparison can be reverent. A good question can make both paths clearer, and it can help us know ourselves more honestly.`
    : isJudaism
      ? `Let us take this slowly. ${title} invites us to notice how a tradition can make room for attention, gratitude, and rest.

In many Jewish homes and communities, learning is not only about information. It is a way of turning the mind toward meaning. A teaching, a blessing, a story, or a remembered phrase can become a small lamp on the table. It helps us see the ordinary day more clearly.

One way to understand this topic is to see it as an invitation. It asks: what is worth pausing for? What deserves care? What might be repaired with one kind word, one patient breath, or one faithful habit?

There is no rush here. The point is not to master anything. The point is to sit with an idea long enough for it to become companionable. Wisdom often arrives quietly. It can come through a candle, a meal, a question, a story, or the feeling of being reminded that life has dignity.

For today, we can receive this teaching simply: the sacred is not far away. It can be found in attention, in kindness, and in the choice to remember what matters.`
    : `Let us take this gently. ${title} points toward a kind of attention that is calm, awake, and kind.

In many Buddhist traditions, learning is not only a matter of knowing more. It is a way of seeing more clearly. A breath, a story, a short teaching, or a moment of compassion can help the mind settle and the heart open.

One way to understand this topic is to notice that wisdom does not need to be dramatic. It may begin with one breath. It may begin with seeing that a difficult feeling is present, and meeting it without harshness.

There is no exam here. There is no need to force the mind to be blank. The practice is softer than that. We return, again and again, to what is here. We let kindness have a little more room.

For today, we can receive this teaching simply: peace can begin in a small moment. A breath can be a doorway. Compassion can be practiced in ordinary life.`;

  return {
    id: randomUUID(),
    tradition,
    topic,
    mode,
    title,
    script,
    simplifiedScript: isBoth
      ? `This teaching puts Judaism and Buddhism in careful conversation. It does not say they are the same. It asks what each path can help us notice. Today, the simple idea is this: a respectful bridge can deepen both sides.`
      : isJudaism
      ? `This teaching invites a gentle pause. In many Jewish traditions, stories, blessings, and remembered phrases help people notice what matters. Today, the simple idea is this: attention can make ordinary life feel more sacred. A kind word, a restful moment, or a small act of repair can be meaningful.`
      : `This teaching invites a gentle pause. In many Buddhist traditions, wisdom begins by noticing the present moment with kindness. Today, the simple idea is this: one calm breath can help the heart soften. Compassion can begin in ordinary life.`,
    segments: [
      "Begin by settling into the idea slowly.",
      "Notice how the teaching can live in ordinary moments.",
      "Close with one small takeaway for today.",
    ],
    question: {
      prompt: `What is one gentle way to understand "${title}"?`,
      hint: "Look for the answer that feels patient and kind.",
      options: [
        {
          id: "a",
          text: "It can help us pause and notice what matters.",
          isCorrect: true,
          response: "Yes, that's the idea.",
        },
        {
          id: "b",
          text: "It is mainly about getting every detail perfect.",
          isCorrect: false,
          response: "That's a reasonable guess. Here is the simpler version.",
        },
        {
          id: "c",
          text: "It tells us to rush through the day.",
          isCorrect: false,
          response: "That's a reasonable guess. Here is the simpler version.",
        },
        {
          id: "d",
          text: "It is only for experts.",
          isCorrect: false,
          response: "That's a reasonable guess. Here is the simpler version.",
        },
      ],
    },
    closing: {
      takeaway: isBoth
        ? "A respectful bridge lets each tradition remain itself."
        : isJudaism
        ? "A small pause can make room for gratitude and repair."
        : "A small breath can make room for kindness.",
      reflection: "Where might this idea fit gently into today?",
      line: isBoth
        ? "May two paths make one question more honest."
        : isJudaism
        ? "May this day hold a little more light."
        : "Breathing in, I arrive. Breathing out, I soften.",
    },
    audioUrl: null,
    audioAvailable: false,
    persisted: false,
    generatedBy: "fallback",
  };
}
