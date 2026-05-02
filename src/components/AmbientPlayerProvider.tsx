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
  volumeRange?: "0-1";
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
  currentTime: number;
  duration: number;
  volume: number;
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
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  ensureAudioContextRunning: () => void;
  connectNarrationAudio: (audio: HTMLAudioElement) => boolean;
};

const STORAGE_KEY = "two-paths-ambient-state";
const MAX_VOLUME = 1; // master volume slider, 0–1
const AMBIENT_SCALE = 0.5; // ambient music plays at half master so it sits under narration
const DEFAULT_VOLUME = 0.7; // sensible default master level
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const narrationGainRef = useRef<GainNode | null>(null);
  const recentHistoryRef = useRef<string[]>([]);

  // Create a single shared audio element on the client and route it through
  // Web Audio so the volume slider works on iOS Safari, where
  // HTMLAudioElement.volume is read-only and silently ignored. A second
  // gain node sits ready for narration audio elements (lesson voice, topic
  // previews, answer playback) so they share the same iOS-compatible path.
  useEffect(() => {
    if (audioRef.current) return;
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctor) {
        const ctx = new Ctor();
        const source = ctx.createMediaElementSource(audio);
        const ambientGain = ctx.createGain();
        ambientGain.gain.value = DEFAULT_VOLUME * AMBIENT_SCALE;
        source.connect(ambientGain);
        ambientGain.connect(ctx.destination);
        const narrationGain = ctx.createGain();
        narrationGain.gain.value = DEFAULT_VOLUME;
        narrationGain.connect(ctx.destination);
        audioCtxRef.current = ctx;
        gainRef.current = ambientGain;
        narrationGainRef.current = narrationGain;
        audio.volume = 1;
        return;
      }
    } catch {
      // Fall through to plain audio.volume below.
    }
    audio.volume = DEFAULT_VOLUME * AMBIENT_SCALE;
  }, []);

  const ensureAudioContextRunning = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }, []);

  // Route a fresh narration <audio> through the shared narration gain so
  // the master volume slider controls it. Returns true if Web Audio took
  // over (caller can stop touching audio.volume); false means the caller
  // should fall back to setting audio.volume directly.
  const connectNarrationAudio = useCallback(
    (audio: HTMLAudioElement): boolean => {
      const ctx = audioCtxRef.current;
      const gain = narrationGainRef.current;
      if (!ctx || !gain) return false;
      try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(gain);
        audio.volume = 1;
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  // Hydrate from localStorage once
  useEffect(() => {
    const stored = readState();
    if (typeof stored.enabled === "boolean") setEnabled(stored.enabled);
    if (stored.mode === "liked" || stored.mode === "all") setMode(stored.mode);
    if (Array.isArray(stored.liked)) setLiked(stored.liked.filter((id) => typeof id === "string"));
    if (Array.isArray(stored.disliked)) setDisliked(stored.disliked.filter((id) => typeof id === "string"));
    if (typeof stored.volume === "number" && stored.volume >= 0) {
      // Migrate old 0–0.5 range to new 0–1 master range
      const v = stored.volumeRange === "0-1" ? stored.volume : stored.volume * 2;
      setVolumeState(Math.min(MAX_VOLUME, v));
    }
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    writeState({ enabled, mode, liked, disliked, volume, volumeRange: "0-1" });
  }, [hydrated, enabled, mode, liked, disliked, volume]);

  // Apply volume — prefer the gain nodes so iOS works.
  useEffect(() => {
    const scaled = Math.min(1, volume * AMBIENT_SCALE);
    if (gainRef.current) {
      gainRef.current.gain.value = scaled;
    } else if (audioRef.current) {
      audioRef.current.volume = scaled;
    }
    if (narrationGainRef.current) {
      narrationGainRef.current.gain.value = Math.min(1, volume);
    }
  }, [volume]);

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
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handleDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handleLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [currentTrackId, pickNextId]);

  // Swap audio src when current track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.src !== window.location.origin + currentTrack.url) {
      audio.src = currentTrack.url;
      setCurrentTime(0);
      setDuration(0);
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
    ensureAudioContextRunning();

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
  }, [enabled, isPlaying, currentTrackId, pickNextId, ensureAudioContextRunning]);

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

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, seconds));
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback(
    (value: number) => {
      ensureAudioContextRunning();
      const clamped = Math.max(0, Math.min(MAX_VOLUME, value));
      setVolumeState(clamped);
    },
    [ensureAudioContextRunning],
  );

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
      currentTime,
      duration,
      volume,
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
      seek,
      setVolume,
      ensureAudioContextRunning,
      connectNarrationAudio,
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
      currentTime,
      duration,
      volume,
      toggleMode,
      togglePlayPause,
      next,
      playSpecific,
      like,
      unlike,
      dislike,
      undislike,
      seek,
      setVolume,
      ensureAudioContextRunning,
      connectNarrationAudio,
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
