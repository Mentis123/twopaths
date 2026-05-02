"use client";

import { useRef } from "react";
import { Heart, Music, Pause, Play, SkipForward, ThumbsDown, Volume2, VolumeX } from "lucide-react";
import { useAmbientPlayer } from "@/components/AmbientPlayerProvider";

export default function AmbientPlayer() {
  const player = useAmbientPlayer();
  const lastNonZeroVolumeRef = useRef(0.7);
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
    </div>
  );
}
