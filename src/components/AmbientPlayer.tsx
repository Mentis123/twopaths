"use client";

import { Heart, Music, Pause, Play, SkipForward, ThumbsDown } from "lucide-react";
import { useAmbientPlayer } from "@/components/AmbientPlayerProvider";

export default function AmbientPlayer() {
  const player = useAmbientPlayer();
  const {
    tracks,
    tracksLoaded,
    enabled,
    mode,
    isPlaying,
    pool,
    currentTrackId,
    togglePlayPause,
    toggleMode,
    next,
    like,
    unlike,
    dislike,
    isLiked,
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
