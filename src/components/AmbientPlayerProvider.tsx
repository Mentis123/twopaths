"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Track = {
  id: string;
  title: string;
  url: string;
};

export type AmbientMode = "all" | "liked";

type StoredState = {
  enabled?: boolean;
  mode?: AmbientMode;
  liked?: string[];
  disliked?: string[];
  volume?: number;
};

type AmbientContextValue = {
  tracks: Track[];
  tracksLoaded: boolean;
  enabled: boolean;
  mode: AmbientMode;
  liked: string[];
  disliked: string[];
  currentTrackId: string | null;
  isPlaying: boolean;
  pool: Track[];
  hasLiked: boolean;
  hasDisliked: boolean;
  isLiked: (id: string) => boolean;
  isDisliked: (id: string) => boolean;
  toggleMode: () => void;
  togglePlayPause: () => void;
  next: () => void;
  playSpecific: (id: string) => void;
  like: (id: string) => void;
  unlike: (id: string) => void;
  dislike: (id: string) => void;
  undislike: (id: string) => void;
};

const STORAGE_KEY = "two-paths-ambient-state";
const DEFAULT_VOLUME = 0.45;
const RECENT_HISTORY = 3;

const Context = createContext<AmbientContextValue | null>(null);

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
    // ignore
  }
}

export function AmbientPlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoaded, setTracksLoaded] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<AmbientMode>("all");
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recentHistoryRef = useRef<string[]>([]);

  // Create a single shared audio element on the client
  useEffect(() => {
    if (audioRef.current) return;
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
    audioRef.current.volume = DEFAULT_VOLUME;
  }, []);

  // Hydrate from localStorage once
  useEffect(() => {
    const stored = readState();
    if (typeof stored.enabled === "boolean") setEnabled(stored.enabled);
    if (stored.mode === "liked" || stored.mode === "all") setMode(stored.mode);
    if (Array.isArray(stored.liked)) setLiked(stored.liked.filter((id) => typeof id === "string"));
    if (Array.isArray(stored.disliked)) setDisliked(stored.disliked.filter((id) => typeof id === "string"));
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    writeState({ enabled, mode, liked, disliked });
  }, [hydrated, enabled, mode, liked, disliked]);

  // Load track list
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
    if (mode === "liked") return filtered.filter((t) => likedSet.has(t.id));
    return filtered;
  }, [tracks, dislikedSet, likedSet, mode]);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) ?? null,
    [tracks, currentTrackId],
  );

  const pickNextId = useCallback(
    (excludeId?: string | null) => {
      if (pool.length === 0) return null;
      const recent = new Set(recentHistoryRef.current);
      if (excludeId) recent.add(excludeId);
      const candidates = pool.filter((t) => !recent.has(t.id));
      const fromPool = candidates.length > 0 ? candidates : pool;
      const next = fromPool[Math.floor(Math.random() * fromPool.length)];
      return next.id;
    },
    [pool],
  );

  // Wire up audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const nextId = pickNextId(currentTrackId);
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
  }, [currentTrackId, pickNextId]);

  // Swap audio src when current track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.src !== window.location.origin + currentTrack.url) {
      audio.src = currentTrack.url;
    }
    if (enabled) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, enabled]);

  // Auto-skip if current track is now in disliked
  useEffect(() => {
    if (!currentTrackId) return;
    if (dislikedSet.has(currentTrackId)) {
      const nextId = pickNextId(currentTrackId);
      setCurrentTrackId(nextId);
    }
  }, [dislikedSet, currentTrackId, pickNextId]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!enabled) {
      setEnabled(true);
      const nextId = currentTrackId ?? pickNextId();
      if (nextId) setCurrentTrackId(nextId);
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      if (!currentTrackId) {
        const nextId = pickNextId();
        if (nextId) setCurrentTrackId(nextId);
      } else {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [enabled, isPlaying, currentTrackId, pickNextId]);

  const next = useCallback(() => {
    const nextId = pickNextId(currentTrackId);
    recentHistoryRef.current = [
      ...(currentTrackId ? [currentTrackId] : []),
      ...recentHistoryRef.current,
    ].slice(0, RECENT_HISTORY);
    if (nextId) setCurrentTrackId(nextId);
  }, [currentTrackId, pickNextId]);

  const playSpecific = useCallback(
    (id: string) => {
      const target = tracks.find((t) => t.id === id);
      if (!target) return;

      // Un-dislike if needed so it's playable
      setDisliked((prev) => prev.filter((x) => x !== id));
      setEnabled(true);
      setCurrentTrackId(id);
      // The currentTrack effect will load + play it.
    },
    [tracks],
  );

  const like = useCallback((id: string) => {
    setDisliked((prev) => prev.filter((x) => x !== id));
    setLiked((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const unlike = useCallback((id: string) => {
    setLiked((prev) => prev.filter((x) => x !== id));
  }, []);

  const dislike = useCallback((id: string) => {
    setLiked((prev) => prev.filter((x) => x !== id));
    setDisliked((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const undislike = useCallback((id: string) => {
    setDisliked((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "all" ? "liked" : "all"));
  }, []);

  const value = useMemo<AmbientContextValue>(
    () => ({
      tracks,
      tracksLoaded,
      enabled,
      mode,
      liked,
      disliked,
      currentTrackId,
      isPlaying,
      pool,
      hasLiked: liked.length > 0,
      hasDisliked: disliked.length > 0,
      isLiked: (id) => likedSet.has(id),
      isDisliked: (id) => dislikedSet.has(id),
      toggleMode,
      togglePlayPause,
      next,
      playSpecific,
      like,
      unlike,
      dislike,
      undislike,
    }),
    [
      tracks,
      tracksLoaded,
      enabled,
      mode,
      liked,
      disliked,
      currentTrackId,
      isPlaying,
      pool,
      likedSet,
      dislikedSet,
      toggleMode,
      togglePlayPause,
      next,
      playSpecific,
      like,
      unlike,
      dislike,
      undislike,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAmbientPlayer() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useAmbientPlayer must be used within AmbientPlayerProvider");
  }
  return ctx;
}
