import { randomUUID } from "node:crypto";
import { fallbackTopics } from "@/lib/fallbacks";
import { generateJson, isGeminiConfigured } from "@/lib/gemini";
import { topicsPrompt } from "@/lib/prompts";
import { saveTopics } from "@/lib/db";
import { curatedTopics, dailySeed } from "@/lib/trove";
import type { Topic, TopicResponse, Tradition } from "@/lib/types";

type GeneratedTopics = {
  topics?: Array<{
    title?: string;
    summary?: string;
    difficulty?: "gentle" | "medium";
    visual?: Topic["visual"];
  }>;
};

const validTraditions = new Set(["judaism", "buddhism", "both"]);
const validVisuals = new Set([
  "candles",
  "teacher",
  "scroll",
  "seedling",
  "stones",
  "mountain",
  "tree",
  "lotus",
  "bridge",
  "compass",
  "gate",
  "river",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    tradition?: Tradition;
    favouriteThemes?: string[];
    fresh?: boolean;
  } | null;

  if (!body?.tradition || !validTraditions.has(body.tradition)) {
    return Response.json({ error: "Choose a valid path." }, { status: 400 });
  }

  // Prefer the curated trove. With ≥4 trove items per tradition this is the
  // primary source of truth — Gemini only fills in if the trove is empty.
  const seed = body.fresh ? `${dailySeed()}-${Date.now()}` : dailySeed();
  const troveTopics = curatedTopics(body.tradition, 4, { seed });

  if (troveTopics.length === 4) {
    const persisted = await saveTopics(troveTopics).catch((error) => {
      console.error("Topic persistence failed", error);
      return false;
    });

    return Response.json({
      topics: troveTopics,
      generatedBy: "trove",
      persisted,
    } satisfies TopicResponse);
  }

  // Gemini path: only reached if the trove has fewer than 4 items for this
  // tradition (e.g. if items are removed in the future).
  const dateLabel = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeZone: "Australia/Sydney",
  }).format(new Date());

  const generated = await generateJson<GeneratedTopics>(
    topicsPrompt(body.tradition, dateLabel, normalizeFavouriteThemes(body.favouriteThemes)),
    {
      maxOutputTokens: 700,
      timeoutMs: 5000,
    },
  );

  const geminiTopics = normalizeTopics(generated, body.tradition);
  const topics = geminiTopics.length === 4 ? geminiTopics : fallbackTopics(body.tradition);
  const persisted = await saveTopics(topics).catch((error) => {
    console.error("Topic persistence failed", error);
    return false;
  });

  const response: TopicResponse = {
    topics,
    generatedBy: geminiTopics.length === 4 && isGeminiConfigured() ? "gemini" : "fallback",
    persisted,
  };

  return Response.json(response);
}

function normalizeFavouriteThemes(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeTopics(
  generated: GeneratedTopics | null,
  tradition: Tradition,
): Topic[] {
  return (generated?.topics || [])
    .filter((topic) => topic.title && topic.summary)
    .slice(0, 4)
    .map((topic) => ({
      id: randomUUID(),
      tradition,
      title: topic.title || "Daily reflection",
      summary: topic.summary || "A short, gentle reflection for today.",
      difficulty: topic.difficulty === "medium" ? "medium" : "gentle",
      visual: validVisuals.has(topic.visual || "")
        ? (topic.visual as Topic["visual"])
        : tradition === "judaism"
          ? "candles"
          : tradition === "buddhism"
            ? "lotus"
            : "bridge",
    }));
}
