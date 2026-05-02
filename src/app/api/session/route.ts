import { randomUUID } from "node:crypto";
import { fallbackLesson } from "@/lib/fallbacks";
import { generateJson, isGeminiConfigured } from "@/lib/gemini";
import { saveSession } from "@/lib/db";
import { lessonPrompt } from "@/lib/prompts";
import type {
  LessonSession,
  QuizOption,
  SessionMode,
  Topic,
  Tradition,
} from "@/lib/types";

export const maxDuration = 15;

type GeneratedLesson = {
  title?: string;
  script?: string;
  simplifiedScript?: string;
  segments?: string[];
  question?: {
    prompt?: string;
    hint?: string;
    options?: Array<{
      text?: string;
      isCorrect?: boolean;
      response?: string;
    }>;
  };
  closing?: {
    takeaway?: string;
    reflection?: string;
    line?: string;
  };
};

type GeneratedOption = NonNullable<
  NonNullable<GeneratedLesson["question"]>["options"]
>[number];

const validTraditions = new Set(["judaism", "buddhism"]);
const validModes = new Set(["listen", "story", "quiz"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    tradition?: Tradition;
    topic?: Topic;
    mode?: SessionMode;
    minutes?: number;
    userId?: string;
    voiceName?: string;
    speechSpeed?: "slower" | "normal" | "faster";
  } | null;

  if (
    !body?.tradition ||
    !validTraditions.has(body.tradition) ||
    !body.topic?.title
  ) {
    return Response.json({ error: "Choose a topic first." }, { status: 400 });
  }

  const mode = body.mode && validModes.has(body.mode) ? body.mode : "listen";
  const minutes = clampMinutes(body.minutes);
  const fallback = fallbackLesson({
    tradition: body.tradition,
    topic: body.topic,
    mode,
  });
  const generated = await generateJson<GeneratedLesson>(
    lessonPrompt({
      tradition: body.tradition,
      topicTitle: body.topic.title,
      topicSummary: body.topic.summary,
      mode,
      minutes,
    }),
    {
      maxOutputTokens: mode === "quiz" ? 1000 : 1300,
      timeoutMs: 6500,
    },
  );

  const normalized = normalizeLesson({
    generated,
    fallback,
    tradition: body.tradition,
    topic: body.topic,
    mode,
  });

  const withAudio: LessonSession = {
    ...normalized,
    audioUrl: null,
    audioAvailable: false,
  };

  const persisted = await saveSession({
    session: withAudio,
    userId: body.userId || "dad",
  }).catch((error) => {
    console.error("Session persistence failed", error);
    return false;
  });

  return Response.json({
    ...withAudio,
    persisted,
  } satisfies LessonSession);
}

function normalizeLesson({
  generated,
  fallback,
  tradition,
  topic,
  mode,
}: {
  generated: GeneratedLesson | null;
  fallback: LessonSession;
  tradition: Tradition;
  topic: Topic;
  mode: SessionMode;
}): LessonSession {
  if (!generated?.script || !generated.question?.prompt) {
    return fallback;
  }

  return {
    id: randomUUID(),
    tradition,
    topic,
    mode,
    title: generated.title || topic.title,
    script: generated.script,
    simplifiedScript: generated.simplifiedScript || fallback.simplifiedScript,
    segments:
      generated.segments?.filter(Boolean).slice(0, 4) ||
      fallback.segments,
    question: {
      prompt: generated.question.prompt,
      hint: generated.question.hint || fallback.question.hint,
      options: normalizeOptions(generated.question.options, fallback.question.options),
    },
    closing: {
      takeaway: generated.closing?.takeaway || fallback.closing.takeaway,
      reflection: generated.closing?.reflection || fallback.closing.reflection,
      line: generated.closing?.line || fallback.closing.line,
    },
    audioUrl: null,
    audioAvailable: false,
    persisted: false,
    generatedBy: isGeminiConfigured() ? "gemini" : "fallback",
  };
}

function normalizeOptions(
  generated: GeneratedOption[] | undefined,
  fallback: QuizOption[],
) {
  const options = Array.isArray(generated)
    ? generated.filter((option) => option.text).slice(0, 4)
    : [];

  if (options.length < 4 || !options.some((option) => option.isCorrect)) {
    return fallback;
  }

  return options.map((option, index) => ({
    id: String.fromCharCode(97 + index),
    text: option.text || fallback[index]?.text || "A gentle possibility",
    isCorrect: Boolean(option.isCorrect),
    response:
      option.response ||
      (option.isCorrect
        ? "Yes, that's the idea."
        : "That's a reasonable guess. Here is the simpler version."),
  }));
}

function clampMinutes(value?: number) {
  if (!value || Number.isNaN(value)) {
    return 5;
  }

  return Math.min(10, Math.max(3, Math.round(value)));
}
