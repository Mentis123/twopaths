#!/usr/bin/env python3
"""Pre-generate Ara MP3s for every trove question + answer + hint + response.

For each of the 31 trove items, generates:
  /audio/questions/{id}/prompt.mp3
  /audio/questions/{id}/correct-text.mp3
  /audio/questions/{id}/correct-response.mp3
  /audio/questions/{id}/d1-text.mp3, d1-response.mp3
  /audio/questions/{id}/d2-text.mp3, d2-response.mp3
  /audio/questions/{id}/d3-text.mp3, d3-response.mp3
  /audio/shared/hint.mp3 (one shared file — same text everywhere)

Total: 31 * 9 + 1 = ~280 short MP3s, ~30-50MB.

Resumable — skips files already on disk.
"""

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

DEFAULT_BASE = "https://sabastwopaths.vercel.app"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
QUESTIONS_DIR = PROJECT_ROOT / "public" / "audio" / "questions"
SHARED_DIR = PROJECT_ROOT / "public" / "audio" / "shared"


def http_json(url: str, timeout: int = 60) -> dict:
    req = Request(url, headers={"Accept": "application/json"})
    with urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def http_post_audio(url: str, payload: dict, timeout: int = 90) -> tuple[bytes, dict]:
    body = json.dumps(payload).encode("utf-8")
    req = Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=timeout) as r:
        return r.read(), dict(r.headers)


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
        bytes_, headers = http_post_audio(f"{base_url}/api/voice/tts", payload, timeout=90)
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


def gen_one(base_url: str, out: Path, text: str) -> bool:
    if out.exists() and out.stat().st_size > 1000:
        return False
    audio = synthesize(base_url, text)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_BASE)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--only-id", default=None)
    args = parser.parse_args()

    print(f"Listing trove from {args.base_url} …")
    items = http_json(f"{args.base_url}/api/trove/script?list=1")["items"]
    if args.only_id:
        items = [i for i in items if i["id"] == args.only_id]
    print(f"  {len(items)} trove items")

    # Build one job list: (description, output_path, text)
    jobs = []
    SHARED_HINT = "Look for the answer that preserves depth and difference."
    jobs.append(("shared/hint", SHARED_DIR / "hint.mp3", SHARED_HINT))

    print("Fetching question texts…")
    for item in items:
        tid = item["id"]
        q = http_json(f"{args.base_url}/api/trove/question?id={tid}")
        item_dir = QUESTIONS_DIR / tid
        jobs.append((f"{tid}/prompt", item_dir / "prompt.mp3", q["prompt"]))
        jobs.append((f"{tid}/correct-text", item_dir / "correct-text.mp3", q["correctText"]))
        jobs.append((f"{tid}/correct-response", item_dir / "correct-response.mp3", q["correctResponse"]))
        for d in q["distractors"]:
            slot = d["slot"]
            jobs.append((f"{tid}/{slot}-text", item_dir / f"{slot}-text.mp3", d["text"]))
            jobs.append((f"{tid}/{slot}-response", item_dir / f"{slot}-response.mp3", d["response"]))

    print(f"  {len(jobs)} files to consider")

    done = 0
    skipped = 0
    failed = []
    started = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {}
        for desc, out, text in jobs:
            fut = pool.submit(gen_one, args.base_url, out, text)
            futures[fut] = (desc, len(text))

        for fut in as_completed(futures):
            desc, wlen = futures[fut]
            try:
                generated = fut.result()
                done += 1
                if generated:
                    print(f"  [{done}/{len(jobs)}] {desc} ✓ ({wlen}c)")
                else:
                    skipped += 1
                    print(f"  [{done}/{len(jobs)}] {desc} ↷ exists")
            except Exception as e:
                done += 1
                failed.append((desc, repr(e)))
                print(f"  [{done}/{len(jobs)}] {desc} ✗ {e}", file=sys.stderr)

    elapsed = time.time() - started
    generated = done - skipped - len(failed)
    print(f"\nDone in {elapsed:.1f}s — generated {generated}, skipped {skipped}, failed {len(failed)}")
    if failed:
        print("\nFailures:")
        for desc, err in failed:
            print(f"  {desc}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
