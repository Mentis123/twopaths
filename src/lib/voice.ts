import "server-only";

import { createHash } from "node:crypto";
import { normalizeSpeechTags, validateSpokenContent } from "@/lib/contentSafety";
import type { Tradition, VoiceId } from "@/lib/types";

const XAI_TTS_URL = "https://api.x.ai/v1/tts";
const MAX_TEXT_LENGTH = 15000;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const RETRY_STATUSES = new Set([429, 500, 503]);

type SpeechSpeed = "slower" | "normal" | "faster";

type AudioCacheEntry = {
  bytes: Buffer;
  createdAt: number;
  durationEstimateSeconds: number;
};

const audioCache = new Map<string, AudioCacheEntry>();

export const supportedVoiceIds = ["ara", "sal", "leo"] as const;

export function isXaiConfigured() {
  return Boolean(process.env.XAI_API_KEY);
}

export function isVoiceId(value: unknown): value is VoiceId {
  return typeof value === "string" && supportedVoiceIds.includes(value as VoiceId);
}

export function scriptHash({
  tradition,
  topic,
  text,
  voiceId,
  speechSpeed,
}: {
  tradition?: Tradition;
  topic?: string;
  text: string;
  voiceId: VoiceId;
  speechSpeed: SpeechSpeed;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        tradition: tradition || "unknown",
        topic: topic || "untitled",
        text,
        voiceId,
        speechSpeed,
      }),
    )
    .digest("hex");
}

export class VoiceProviderError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable = false) {
    super(message);
    this.name = "VoiceProviderError";
    this.status = status;
    this.retryable = retryable;
  }
}

export async function synthesizeWithXai({
  text,
  voiceId,
  language,
  format,
  cache,
  tradition,
  topic,
  speechSpeed,
}: {
  text: string;
  voiceId: VoiceId;
  language: string;
  format: "mp3";
  cache: boolean;
  tradition?: Tradition;
  topic?: string;
  speechSpeed: SpeechSpeed;
}) {
  const normalizedText = normalizeSpeechTags(text);
  const safety = validateSpokenContent(normalizedText);

  if (!safety.ok) {
    throw new VoiceProviderError(`Unsafe content: ${safety.reason}`, 400, false);
  }

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    throw new VoiceProviderError("Text is too long for narration.", 400, false);
  }

  const key = scriptHash({
    tradition,
    topic,
    text: normalizedText,
    voiceId,
    speechSpeed,
  });
  const cached = cache ? audioCache.get(key) : undefined;

  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return {
      bytes: cached.bytes,
      cacheKey: key,
      cached: true,
      durationEstimateSeconds: cached.durationEstimateSeconds,
      mimeType: "audio/mpeg",
      voiceId,
    };
  }

  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    throw new VoiceProviderError("XAI_API_KEY is not configured.", 401, false);
  }

  const bytes = await fetchXaiAudio({
    apiKey,
    text: normalizedText,
    voiceId,
    language,
    format,
  });
  const durationEstimateSeconds = estimateDurationSeconds(normalizedText, speechSpeed);

  if (cache) {
    audioCache.set(key, {
      bytes,
      createdAt: Date.now(),
      durationEstimateSeconds,
    });
  }

  return {
    bytes,
    cacheKey: key,
    cached: false,
    durationEstimateSeconds,
    mimeType: "audio/mpeg",
    voiceId,
  };
}

async function fetchXaiAudio({
  apiKey,
  text,
  voiceId,
  language,
  format,
}: {
  apiKey: string;
  text: string;
  voiceId: VoiceId;
  language: string;
  format: "mp3";
}) {
  let lastError: VoiceProviderError | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);

    try {
      const response = await fetch(XAI_TTS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          language,
          output_format: {
            codec: format,
            sample_rate: 24000,
            bit_rate: 128000,
          },
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }

      const retryable = RETRY_STATUSES.has(response.status);
      const detail = await response.text().catch(() => "");
      lastError = new VoiceProviderError(
        providerMessage(response.status, detail),
        response.status,
        retryable,
      );

      if (!retryable || attempt === 2) {
        throw lastError;
      }

      await sleep(retryDelayMs(response, attempt));
    } catch (error) {
      if (error instanceof VoiceProviderError) {
        lastError = error;
      } else {
        lastError = new VoiceProviderError("Voice provider request failed.", 503, true);
      }

      if (!lastError.retryable || attempt === 2) {
        throw lastError;
      }

      await sleep(350 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new VoiceProviderError("Voice provider request failed.", 503, true);
}

function providerMessage(status: number, detail: string) {
  const cleanDetail = detail.slice(0, 240);

  if (status === 401) {
    return "xAI rejected the voice API key.";
  }

  if (status === 429) {
    return "xAI voice is rate limited.";
  }

  if (status >= 500) {
    return "xAI voice is temporarily unavailable.";
  }

  return cleanDetail || "xAI voice request failed.";
}

function retryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;

  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, 2500);
  }

  return 450 * (attempt + 1);
}

function estimateDurationSeconds(text: string, speechSpeed: SpeechSpeed) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute =
    speechSpeed === "slower" ? 120 : speechSpeed === "faster" ? 165 : 140;

  return Math.max(12, Math.ceil((words / wordsPerMinute) * 60));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
