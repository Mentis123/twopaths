#!/usr/bin/env python3
"""Pre-generate Ara MP3s for every trove preview + lesson and save under public/audio/.

Run from the project root:
    python3 scripts/prebuild-audio.py [--base-url https://sabastwopaths.vercel.app]

Resumes safely — skips files that already exist on disk.
"""

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

DEFAULT_BASE = "https://sabastwopaths.vercel.app"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
PREVIEWS_DIR = PROJECT_ROOT / "public" / "audio" / "previews"
LESSONS_DIR = PROJECT_ROOT / "public" / "audio" / "lessons"
MODES = ["listen", "story", "quiz"]


def http_json(url: str, timeout: int = 90) -> dict:
    req = Request(url, headers={"Accept": "application/json"})
    with urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def http_post_audio(url: str, payload: dict, timeout: int = 90) -> tuple[bytes, dict]:
    body = json.dumps(payload).encode("utf-8")
    req = Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "audio/mpeg, application/json"},
        method="POST",
    )
    with urlopen(req, timeout=timeout) as r:
        return r.read(), dict(r.headers)


def fetch_script(base_url: str, **params) -> str:
    qs = urlencode({k: v for k, v in params.items() if v is not None})
    data = http_json(f"{base_url}/api/trove/script?{qs}")
    if "text" not in data:
        raise RuntimeError(f"unexpected response: {data}")
    return data["text"]


def synthesize(base_url: str, text: str, attempt: int = 1) -> bytes:
    payload = {
        "text": text,
        "voice_id": "ara",
        "language": "en",
        "format": "mp3",
        "speech_speed": "normal",
        "cache": True,
    }
    try:
        bytes_, headers = http_post_audio(f"{base_url}/api/voice/tts", payload, timeout=120)
        provider = headers.get("X-Two-Paths-Provider") or headers.get("x-two-paths-provider")
        if provider != "xai":
            raise RuntimeError(f"non-xai provider returned: {provider}")
        return bytes_
    except (HTTPError, URLError) as e:
        if attempt >= 3:
            raise
        wait = 2 ** attempt
        print(f"    retry in {wait}s ({e})")
        time.sleep(wait)
        return synthesize(base_url, text, attempt + 1)


def task_preview(base_url: str, trove_id: str) -> tuple[str, str, bool]:
    out = PREVIEWS_DIR / f"{trove_id}.mp3"
    if out.exists() and out.stat().st_size > 1000:
        return (trove_id, "preview", False)  # already done
    text = fetch_script(base_url, id=trove_id, preview=1)
    audio = synthesize(base_url, text)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    return (trove_id, "preview", True)


def task_lesson(base_url: str, trove_id: str, mode: str) -> tuple[str, str, bool]:
    out = LESSONS_DIR / f"{trove_id}-{mode}.mp3"
    if out.exists() and out.stat().st_size > 1000:
        return (trove_id, mode, False)
    text = fetch_script(base_url, id=trove_id, mode=mode)
    audio = synthesize(base_url, text)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    return (trove_id, mode, True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_BASE)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--only-id", default=None, help="generate just this trove id")
    parser.add_argument("--only-kind", default=None, help="preview | listen | story | quiz")
    args = parser.parse_args()

    print(f"Listing trove from {args.base_url} …")
    items = http_json(f"{args.base_url}/api/trove/script?list=1")["items"]
    if args.only_id:
        items = [i for i in items if i["id"] == args.only_id]
    print(f"  {len(items)} items")

    jobs = []
    for item in items:
        trove_id = item["id"]
        if args.only_kind in (None, "preview"):
            jobs.append(("preview", trove_id, None))
        for mode in MODES:
            if args.only_kind in (None, mode):
                jobs.append(("lesson", trove_id, mode))

    print(f"  {len(jobs)} files to consider")

    done = 0
    skipped = 0
    failed = []
    started = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {}
        for kind, trove_id, mode in jobs:
            if kind == "preview":
                fut = pool.submit(task_preview, args.base_url, trove_id)
            else:
                fut = pool.submit(task_lesson, args.base_url, trove_id, mode)
            futures[fut] = (kind, trove_id, mode)

        for fut in as_completed(futures):
            kind, trove_id, mode = futures[fut]
            label = f"{trove_id} ({mode or 'preview'})"
            try:
                _, _, generated = fut.result()
                done += 1
                if generated:
                    print(f"  [{done}/{len(jobs)}] {label} ✓ generated")
                else:
                    skipped += 1
                    print(f"  [{done}/{len(jobs)}] {label} ↷ already exists")
            except Exception as e:
                failed.append((label, repr(e)))
                done += 1
                print(f"  [{done}/{len(jobs)}] {label} ✗ {e}", file=sys.stderr)

    elapsed = time.time() - started
    print(f"\nDone in {elapsed:.1f}s — generated {done - skipped - len(failed)}, skipped {skipped}, failed {len(failed)}")
    if failed:
        print("\nFailures:")
        for label, err in failed:
            print(f"  {label}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
