#!/usr/bin/env python3
"""Pre-generate Ara MP3s for the lesson closing tiles.

For each of the 31 trove items, generates 3 short MP3s:
  /audio/closings/{id}/takeaway.mp3
  /audio/closings/{id}/reflection.mp3
  /audio/closings/{id}/line.mp3

Total: 93 short files. Resumable.
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
CLOSINGS_DIR = PROJECT_ROOT / "public" / "audio" / "closings"


def http_json(url, timeout=60):
    req = Request(url, headers={"Accept": "application/json"})
    with urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def http_post_audio(url, payload, timeout=90):
    body = json.dumps(payload).encode("utf-8")
    req = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=timeout) as r:
        return r.read(), dict(r.headers)


def synthesize(base_url, text, attempt=1):
    payload = {"text": text, "voice_id": "ara", "language": "en", "format": "mp3", "speech_speed": "normal", "cache": True}
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


def gen_one(base_url, out, text):
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
    args = parser.parse_args()

    print(f"Listing trove from {args.base_url} …")
    items = http_json(f"{args.base_url}/api/trove/script?list=1")["items"]
    print(f"  {len(items)} trove items")

    print("Fetching closing texts…")
    jobs = []
    for item in items:
        tid = item["id"]
        c = http_json(f"{args.base_url}/api/trove/script?id={tid}&closing=1")
        d = CLOSINGS_DIR / tid
        jobs.append((f"{tid}/takeaway", d / "takeaway.mp3", c["takeaway"]))
        jobs.append((f"{tid}/reflection", d / "reflection.mp3", c["reflection"]))
        jobs.append((f"{tid}/line", d / "line.mp3", c["line"]))

    print(f"  {len(jobs)} files to consider")

    done = 0
    skipped = 0
    failed = []
    started = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(gen_one, args.base_url, out, text): (desc, len(text)) for desc, out, text in jobs}
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
        for desc, err in failed:
            print(f"  {desc}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
