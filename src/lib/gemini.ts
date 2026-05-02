import "server-only";

import { GoogleGenAI, Modality } from "@google/genai";
import { TWO_PATHS_SYSTEM_PROMPT } from "@/lib/prompts";

let cachedClient: GoogleGenAI | null | undefined;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

function geminiClient() {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  cachedClient = apiKey ? new GoogleGenAI({ apiKey }) : null;
  return cachedClient;
}

export function textModel() {
  return process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
}

export function ttsModel() {
  return process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
}

export async function generateJson<T>(
  prompt: string,
  options: { maxOutputTokens?: number; timeoutMs?: number } = {},
): Promise<T | null> {
  const client = geminiClient();

  if (!client) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 7000);

  try {
    const response = await client.models.generateContent({
      model: textModel(),
      contents: prompt,
      config: {
        abortSignal: controller.signal,
        systemInstruction: TWO_PATHS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.62,
        maxOutputTokens: options.maxOutputTokens || 1400,
      },
    });

    const text = response.text;
    if (!text) {
      return null;
    }

    return JSON.parse(stripJsonFence(text)) as T;
  } catch (error) {
    console.error("Gemini JSON generation failed", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function synthesizeNarration({
  script,
  voiceName = "Kore",
  speechSpeed = "normal",
}: {
  script: string;
  voiceName?: string;
  speechSpeed?: "slower" | "normal" | "faster";
}) {
  const client = geminiClient();

  if (!client) {
    return null;
  }

  const pace =
    speechSpeed === "slower"
      ? "slow, spacious, and reassuring"
      : speechSpeed === "faster"
        ? "warm and clear with a lightly brisk pace"
        : "warm, steady, and unhurried";

  try {
    const response = await client.models.generateContent({
      model: ttsModel(),
      contents: `Read this as a calm spiritual library narrator. Use a ${pace} pace. Text:\n\n${script}`,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(
      (item) => item.inlineData?.data,
    );
    const data = part?.inlineData?.data;

    if (!data) {
      return null;
    }

    return pcmBase64ToWavDataUrl(data);
  } catch (error) {
    console.error("Gemini TTS generation failed", error);
    return null;
  }
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function pcmBase64ToWavDataUrl(base64Pcm: string) {
  const pcm = Buffer.from(base64Pcm, "base64");
  const header = Buffer.alloc(44);
  const sampleRate = 24000;
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return `data:audio/wav;base64,${Buffer.concat([header, pcm]).toString("base64")}`;
}
