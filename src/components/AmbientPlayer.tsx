"use client";

import { Heart, Music, Pause, Play, SkipForward, ThumbsDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  url: string;
};

type Mode = "all" | "liked";

type StoredState = {
  enabled?: boolean;
  mode?: Mode;
  liked?: string[];
  disliked?: string[];
  lastTrackId?: string | null;
  volume?: number;
};

const STORAGE_KEY = "two-paths-ambient-state";
const DEFAULT_VOLUME = 0.45;
const RECENT_HISTORY = 3;

function readState(): StoredState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : {};
  } catch {
    return {};
  }
}

function writeState(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can be unavailable (private mode, quota); ignore.
  }
}

export default function AmbientPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoaded, setTracksLoaded] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>("all");
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recentHistoryRef = useRef<string[]>([]);

  // Hydrate from localStorage once
  useEffect(() => {
    const stored = readState();
    if (typeof stored.enabled === "boolean") setEnabled(stored.enabled);
    if (stored.mode === "liked" || stored.mode === "all") setMode(stored.mode);
    if (Array.isArray(stored.liked)) setLiked(stored.liked.filter((id) => typeof id === "string"));
    if (Array.isArray(stored.disliked)) setDisliked(stored.disliked.filter((id) => typeof id === "string"));
    setHydrated(true);
  }, []);

  // Persist state when relevant fields change
  useEffect(() => {
    if (!hydrated) return;
    writeState({ enabled, mode, liked, disliked });
  }, [hydrated, enabled, mode, liked, disliked]);

  // Load track list from API
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ambient/tracks")
      .then((r) => (r.ok ? r.json() : { tracks: [] }))
      .then((data: { tracks?: Track[] }) => {
        if (cancelled) return;
        setTracks(Array.isArray(data.tracks) ? data.tracks : []);
        setTracksLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setTracks([]);
        setTracksLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dislikedSet = useMemo(() => new Set(disliked), [disliked]);
  const likedSet = useMemo(() => new Set(liked), [liked]);

  const pool = useMemo(() => {
    const filtered = tracks.filter((t) => !dislikedSet.has(t.id));
    if (mode === "liked") {
      return filtered.filter((t) => likedSet.has(t.id));
    }
    return filtered;
  }, [tracks, dislikedSet, likedSet, mode]);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) ?? null,
    [tracks, currentTrackId],
  );

  const pickNextTrackId = useCallback(
    (excludeId?: string | null) => {
      if (pool.length === 0) return null;

      // Avoid the most recent few; if everything is recent, allow repeats.
      const recent = new Set(recentHistoryRef.current);
      if (excludeId) recent.add(excludeId);
      const candidates = pool.filter((t) => !recent.has(t.id));
      const fromPool = candidates.length > 0 ? candidates : pool;
      const next = fromPool[Math.floor(Math.random() * fromPool.length)];
      return next.id;
    },
    [pool],
  );

  // When the current track ends, advance to a fresh random pick
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const nextId = pickNextTrackId(currentTrackId);
      recentHistoryRef.current = [
        ...(currentTrackId ? [currentTrackId] : []),
        ...recentHistoryRef.current,
      ].slice(0, RECENT_HISTORY);
      if (nextId) {
        setCurrentTrackId(nextId);
      } else {
        setIsPlaying(false);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setIsPlaying(false);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [currentTrackId, pickNextTrackId]);

  // Whenever currentTrackId changes, swap the audio source and play if enabled
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.url;
    audio.volume = DEFAULT_VOLUME;

    if (enabled) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, enabled]);

  // If the current track gets disliked OR mode flips to "liked" and current
  // track isn't liked, advance.
  useEffect(() => {
    if (!currentTrackId) return;
    if (dislikedSet.has(currentTrackId)) {
      const nextId = pickNextTrackId(currentTrackId);
      setCurrentTrackId(nextId);
    }
  }, [dislikedSet, currentTrackId, pickNextTrackId]);

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!enabled) {
      // First play: turn the player on and load a random track
      setEnabled(true);
      const nextId = currentTrackId ?? pickNextTrackId();
      if (nextId) {
        setCurrentTrackId(nextId);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      if (!currentTrackId) {
        const nextId = pickNextTrackId();
        if (nextId) setCurrentTrackId(nextId);
      } else {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }

  function handleNext() {
    const nextId = pickNextTrackId(currentTrackId);
    recentHistoryRef.current = [
      ...(currentTrackId ? [currentTrackId] : []),
      ...recentHistoryRef.current,
    ].slice(0, RECENT_HISTORY);
    if (nextId) {
      setCurrentTrackId(nextId);
    }
  }

  function handleLike() {
    if (!currentTrackId) return;
    setLiked((prev) =>
      prev.includes(currentTrackId)
        ? prev.filter((id) => id !== currentTrackId)
        : [...prev, currentTrackId],
    );
    // If the track is somehow on the disliked list too, remove it.
    setDisliked((prev) => prev.filter((id) => id !== currentTrackId));
  }

  function handleDislike() {
    if (!currentTrackId) return;
    setDisliked((prev) =>
      prev.includes(currentTrackId) ? prev : [...prev, currentTrackId],
    );
    setLiked((prev) => prev.filter((id) => id !== currentTrackId));
    // currentTrack is now in dislikedSet → the effect above advances.
  }

  function toggleMode() {
    setMode((m) => (m === "all" ? "liked" : "all"));
  }

  // What to show as the title line
  const titleLine = (() => {
    if (!tracksLoaded) return "Tuning the ambient channel…";
    if (tracks.length === 0) return "No music yet—drop mp3s in /public/audio/ambient";
    if (!enabled) return "Ambient music available";
    if (mode === "liked" && pool.length === 0) {
      return "Tap ♥ on a track to start your liked rotation";
    }
    if (currentTrack) return currentTrack.title;
    return "Ready to play";
  })();

  const isCurrentLiked = currentTrackId ? likedSet.has(currentTrackId) : false;
  const canControlTrack = enabled && Boolean(currentTrack);
  const playButtonDisabled = tracksLoaded && tracks.length === 0;
  const nextDisabled = !enabled || pool.length <= 1;

  return (
    <div
      className="ambient-player"
      data-active={enabled && isPlaying}
      role="region"
      aria-label="Ambient music player"
    >
      <div className="ambient-player-row ambient-player-top">
        <span className="ambient-player-icon" aria-hidden>
          <Music size={18} />
        </span>
        <span className="ambient-player-title" title={titleLine}>
          {titleLine}
        </span>
        <button
          type="button"
          className="ambient-player-mode"
          data-mode={mode}
          onClick={toggleMode}
          disabled={!enabled || tracks.length === 0}
          aria-label={`Switch to ${mode === "all" ? "liked" : "all"} mode`}
          title={`Currently: ${mode === "all" ? "all tracks" : "liked tracks only"}`}
        >
          {mode === "all" ? "All" : "Liked"}
        </button>
      </div>

      <div className="ambient-player-row ambient-player-controls">
        <button
          type="button"
          className="ambient-player-button ambient-player-play"
          onClick={handlePlayPause}
          disabled={playButtonDisabled}
          aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          type="button"
          className="ambient-player-button"
          onClick={handleNext}
          disabled={nextDisabled}
          aria-label="Next track"
          title="Next"
        >
          <SkipForward size={18} />
        </button>
        <button
          type="button"
          className="ambient-player-button ambient-player-like"
          data-active={isCurrentLiked}
          onClick={handleLike}
          disabled={!canControlTrack}
          aria-label={isCurrentLiked ? "Unlike this track" : "Like this track"}
          title={isCurrentLiked ? "Liked" : "Like"}
        >
          <Heart size={18} fill={isCurrentLiked ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          className="ambient-player-button ambient-player-dislike"
          onClick={handleDislike}
          disabled={!canControlTrack}
          aria-label="Remove from rotation"
          title="Don't play this again"
        >
          <ThumbsDown size={18} />
        </button>
      </div>

      <audio ref={audioRef} preload="auto" />
    </div>
  );
}
