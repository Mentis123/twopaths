import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

export type AmbientTrack = {
  id: string;
  title: string;
  url: string;
};

const audioExtensions = new Set([".mp3", ".m4a", ".ogg", ".oga", ".webm", ".wav"]);

export async function GET() {
  const dir = path.join(process.cwd(), "public", "audio", "ambient");

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const tracks: AmbientTrack[] = entries
      .filter((entry) => entry.isFile() && audioExtensions.has(path.extname(entry.name).toLowerCase()))
      .filter((entry) => !entry.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => {
        const id = entry.name;
        const base = path.basename(entry.name, path.extname(entry.name));
        const title = humanizeTitle(base);
        return {
          id,
          title,
          url: `/audio/ambient/${entry.name}`,
        };
      });

    return Response.json({ tracks });
  } catch {
    return Response.json({ tracks: [] });
  }
}

function humanizeTitle(base: string) {
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase());
}
