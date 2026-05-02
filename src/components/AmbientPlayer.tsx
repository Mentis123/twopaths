"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Music,
  Pause,
  Play,
  SkipForward,
  ThumbsDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAmbientPlayer } from "@/components/AmbientPlayerProvider";

const COLLAPSED_KEY = "two-paths-ambient-collapsed";
const DRAG_THRESHOLD = 36;

export default function AmbientPlayer() {
  const player = useAmbientPlayer();
  const lastNonZeroVolumeRef = useRef(0.7);
  const [collapsed, setCollapsed] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const draggedRef = useRef(false);

  const {
    tracks,
    tracksLoaded,
    enabled,
    mode,
    isPlaying,
    pool,
    currentTrackId,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    toggleMode,
    next,
    like,
    unlike,
    dislike,
    isLiked,
    seek,
    setVolume,
  } = player;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(COLLAPSED_KEY);
      // One-time hydration from localStorage; SSR can't read it so we sync after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {}
    document.documentElement.dataset.ambientCollapsed = collapsed ? "1" : "0";
  }, [collapsed]);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) ?? null;

  const titleLine = (() => {
    if (!tracksLoaded) return "Tuning the ambient channel…";
    if (tracks.length === 0) return "No music yet—drop mp3s in /public/audio/ambient";
    if (!enabled) return "Ambient music available";
    if (mode === "liked" && pool.length === 0) {
      return "Like a track to start your liked rotation";
    }
    if (currentTrack) return currentTrack.title;
    return "Ready to play";
  })();

  const isCurrentLiked = currentTrackId ? isLiked(currentTrackId) : false;
  const canControlTrack = enabled && Boolean(currentTrack);
  const playButtonDisabled = tracksLoaded && tracks.length === 0;
  const nextDisabled = !enabled || pool.length <= 1;

  function handleLikeToggle() {
    if (!currentTrackId) return;
    if (isCurrentLiked) unlike(currentTrackId);
    else like(currentTrackId);
  }

  function handleDislike() {
    if (!currentTrackId) return;
    dislike(currentTrackId);
  }

  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleHandlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    dragStartY.current = e.clientY;
    draggedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleHandlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragStartY.current == null) return;
    const dy = e.clientY - dragStartY.current;
    if (Math.abs(dy) > 4) draggedRef.current = true;
    // When expanded, only allow downward drag (positive dy → collapse).
    // When collapsed, only allow upward drag (negative dy → expand).
    const clamped = collapsed ? Math.min(0, dy) : Math.max(0, dy);
    setDragOffset(clamped);
  }

  function handleHandlePointerEnd(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragStartY.current == null) return;
    const dy = e.clientY - dragStartY.current;
    dragStartY.current = null;
    setDragOffset(0);
    if (draggedRef.current) {
      if (!collapsed && dy > DRAG_THRESHOLD) setCollapsed(true);
      else if (collapsed && dy < -DRAG_THRESHOLD) setCollapsed(false);
    }
  }

  function handleHandleClick() {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setCollapsed((c) => !c);
  }

  return (
    <div
      className="ambient-player"
      data-active={enabled && isPlaying}
      data-collapsed={collapsed}
      role="region"
      aria-label="Ambient music player"
      style={{
        transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
        transition: dragOffset ? "none" : undefined,
      }}
    >
      <button
        type="button"
        className="ambient-player-handle"
        onPointerDown={handleHandlePointerDown}
        onPointerMove={handleHandlePointerMove}
        onPointerUp={handleHandlePointerEnd}
        onPointerCancel={handleHandlePointerEnd}
        onClick={handleHandleClick}
        aria-label={collapsed ? "Expand music player" : "Collapse music player"}
        aria-expanded={!collapsed}
        title={collapsed ? "Drag up or tap to expand" : "Drag down or tap to collapse"}
      >
        <span className="ambient-player-grabber" aria-hidden />
        <span className="ambient-player-handle-chevron" aria-hidden>
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {collapsed ? (
        <div className="ambient-player-row ambient-player-collapsed-row">
          <span className="ambient-player-icon" aria-hidden>
            <Music size={16} />
          </span>
          <span className="ambient-player-title" title={titleLine}>
            {titleLine}
          </span>
          <button
            type="button"
            className="ambient-player-button ambient-player-play ambient-player-play-mini"
            onClick={togglePlayPause}
            disabled={playButtonDisabled}
            aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      ) : (
        <>
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

          <div className="ambient-player-seek">
            <input
              type="range"
              className="ambient-player-slider"
              min={0}
              max={Math.max(1, duration)}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!enabled || !duration}
              aria-label="Seek within track"
            />
            <span className="ambient-player-time">
              {formatTime(currentTime)}
            </span>
          </div>

          <div className="ambient-player-volume">
            <button
              type="button"
              className="ambient-player-volume-icon"
              onClick={() => {
                if (volume > 0) {
                  lastNonZeroVolumeRef.current = volume;
                  setVolume(0);
                } else {
                  setVolume(lastNonZeroVolumeRef.current || 0.7);
                }
              }}
              aria-label={volume > 0 ? "Mute" : "Unmute"}
              title={volume > 0 ? "Mute" : "Unmute"}
            >
              {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              className="ambient-player-slider"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > 0) lastNonZeroVolumeRef.current = v;
                setVolume(v);
              }}
              aria-label="Volume"
            />
          </div>

          <div className="ambient-player-row ambient-player-controls">
            <button
              type="button"
              className="ambient-player-button ambient-player-play"
              onClick={togglePlayPause}
              disabled={playButtonDisabled}
              aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              type="button"
              className="ambient-player-button"
              onClick={next}
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
              onClick={handleLikeToggle}
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
        </>
      )}
    </div>
  );
}
