import "server-only";
import { buildLessonScript, buildPreviewText, getClosingTexts, listTroveIds } from "@/lib/trove";

const validModes = new Set(["listen", "story", "quiz"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const mode = url.searchParams.get("mode");
  const list = url.searchParams.get("list");
  const preview = url.searchParams.get("preview");

  if (list === "1") {
    return Response.json({ items: listTroveIds() });
  }

  if (!id) {
    return Response.json({ error: "Send id (and mode or preview=1)" }, { status: 400 });
  }

  if (preview === "1") {
    const text = buildPreviewText(id);
    if (!text) return Response.json({ error: "Unknown trove id" }, { status: 404 });
    return Response.json({ id, kind: "preview", text });
  }

  if (url.searchParams.get("closing") === "1") {
    const c = getClosingTexts(id);
    if (!c) return Response.json({ error: "Unknown trove id" }, { status: 404 });
    return Response.json({ id, kind: "closing", ...c });
  }

  if (!mode || !validModes.has(mode)) {
    return Response.json({ error: "Send a valid mode: listen, story, or quiz" }, { status: 400 });
  }

  const text = buildLessonScript(id, mode as "listen" | "story" | "quiz");
  if (!text) return Response.json({ error: "Unknown trove id" }, { status: 404 });

  return Response.json({ id, mode, text });
}
