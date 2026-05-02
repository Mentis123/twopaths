"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
  CircleHelp,
  Flower2,
  Gauge,
  Headphones,
  Heart,
  History,
  Leaf,
  Lightbulb,
  Music,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  Timer,
  Users,
  Volume2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import AmbientPlayer from "@/components/AmbientPlayer";
import { AmbientPlayerProvider, useAmbientPlayer } from "@/components/AmbientPlayerProvider";
import { allCuratedTopics } from "@/lib/trove";
import type {
  LessonSession,
  SessionMode,
  Topic,
  TopicResponse,
  Tradition,
  VoiceId,
} from "@/lib/types";

type Screen = "home" | "topics" | "lesson" | "question" | "settings" | "library";
type SpeechSpeed = "slower" | "normal" | "faster";

type RecentSession = {
  id: string;
  tradition: Tradition;
  topic: string;
  mode: string;
  created_at: string;
};

type AudioKind = "main" | "simplified";
type CaregiverPreferences = {
  favouriteThemes?: string[];
  speechSpeed?: SpeechSpeed;
  traditionBias?: "judaism" | "buddhism" | "balanced";
  voiceId?: VoiceId;
};

const modes: Array<{ id: SessionMode; label: string }> = [
  { id: "listen", label: "Listen and Learn" },
  { id: "story", label: "Story Mode" },
  { id: "quiz", label: "Gentle Quiz" },
];

const voiceOptions: Array<{ id: VoiceId; label: string; tone: string }> = [
  { id: "ara", label: "Ara", tone: "Warm and balanced" },
  { id: "sal", label: "Sal", tone: "Gentle and soft" },
  { id: "leo", label: "Leo", tone: "Clear and steady" },
];

const favouriteThemeOptions: Array<{
  id: string;
  label: string;
  tradition: Tradition | "both";
}> = [
  { id: "shabbat-rest", label: "Shabbat and rest", tradition: "judaism" },
  { id: "rabbinic-stories", label: "Rabbinic stories", tradition: "judaism" },
  { id: "hebrew-prayer", label: "Hebrew prayer meanings", tradition: "judaism" },
  { id: "repair-kindness", label: "Repair and kindness", tradition: "judaism" },
  { id: "mindfulness", label: "Mindfulness", tradition: "buddhism" },
  { id: "compassion", label: "Compassion", tradition: "buddhism" },
  { id: "patience-stories", label: "Patience stories", tradition: "buddhism" },
  { id: "daily-practice", label: "Daily practice", tradition: "both" },
];

function readCaregiverPreferences(): CaregiverPreferences {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const saved = window.localStorage.getItem("two-paths-caregiver-preferences");
    return saved ? (JSON.parse(saved) as CaregiverPreferences) : {};
  } catch {
    return {};
  }
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [tradition, setTradition] = useState<Tradition | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicSource, setTopicSource] = useState<"gemini" | "fallback" | "trove">("trove");
  const [topicsPersisted, setTopicsPersisted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [lesson, setLesson] = useState<LessonSession | null>(null);
  const [mode, setMode] = useState<SessionMode>("listen");
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(5);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>("normal");
  const [voiceId, setVoiceId] = useState<VoiceId>("ara");
  const [traditionBias, setTraditionBias] = useState<"judaism" | "buddhism" | "balanced">(
    "balanced",
  );
  const [showTranscript, setShowTranscript] = useState(true);
  const [favouriteThemes, setFavouriteThemes] = useState<string[]>([
    "shabbat-rest",
    "compassion",
  ]);
  const [isManagingFavourites, setIsManagingFavourites] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [audioSources, setAudioSources] = useState<Partial<Record<AudioKind, string>>>({});
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [previewingTopicId, setPreviewingTopicId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pendingAudioAutoplayRef = useRef(false);
  const audioObjectUrlsRef = useRef<string[]>([]);

  const currentScript = useMemo(() => {
    if (!lesson) {
      return "";
    }

    return showSimplified ? lesson.simplifiedScript : lesson.script;
  }, [lesson, showSimplified]);

  const activeAudioUrl = showSimplified ? audioSources.simplified : audioSources.main;

  useEffect(() => {
    const objectUrls = audioObjectUrlsRef.current;

    return () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      for (const url of objectUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;

    if (!activeAudioUrl) {
      return;
    }

    const audio = new Audio(activeAudioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audioRef.current = audio;

    if (pendingAudioAutoplayRef.current) {
      pendingAudioAutoplayRef.current = false;
      // Cancel the placeholder browser speech (started while warm voice loaded)
      // before swapping to the real warm narration.
      window.speechSynthesis?.cancel();
      utteranceRef.current = null;
      audio.play().catch(() => setIsPlaying(false));
    }

    return () => {
      audio.pause();
    };
  }, [activeAudioUrl]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const parsed = readCaregiverPreferences();

      if (Array.isArray(parsed.favouriteThemes)) {
        setFavouriteThemes(parsed.favouriteThemes);
      }

      if (parsed.speechSpeed) {
        setSpeechSpeed(parsed.speechSpeed);
      }

      if (parsed.traditionBias) {
        setTraditionBias(parsed.traditionBias);
      }

      if (parsed.voiceId) {
        setVoiceId(parsed.voiceId);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "two-paths-caregiver-preferences",
        JSON.stringify({
          favouriteThemes,
          speechSpeed,
          traditionBias,
          voiceId,
        }),
      );
    } catch {
      // Local storage can be unavailable in private modes.
    }
  }, [favouriteThemes, speechSpeed, traditionBias, voiceId]);

  async function loadTopics(
    nextTradition: Tradition,
    options: { fresh?: boolean } = {},
  ) {
    setTradition(nextTradition);
    setScreen("topics");
    setIsLoadingTopics(true);
    setError(null);
    setLesson(null);
    setSelectedTopic(null);
    setSelectedAnswer(null);

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradition: nextTradition,
          favouriteThemes: favouriteThemeLabels(nextTradition),
          fresh: options.fresh,
        }),
      });

      if (!response.ok) {
        throw new Error("Topic generation failed.");
      }

      const data = (await response.json()) as TopicResponse;
      setTopics(data.topics);
      setTopicSource(data.generatedBy);
      setTopicsPersisted(data.persisted);
    } catch {
      setError("The topic well is quiet for a moment. Try again.");
      setTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  }

  async function chooseTopic(topic: Topic, autoStart = false, overrideMode?: SessionMode) {
    const lessonMode = overrideMode ?? mode;
    setSelectedTopic(topic);
    setScreen("lesson");
    setLesson(null);
    setAudioSources({});
    setNarrationError(null);
    setShowSimplified(false);
    setSelectedAnswer(null);
    setHintVisible(false);
    setIsLoadingLesson(true);
    setError(null);
    stopAudio();

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradition: topic.tradition,
          topic,
          mode: lessonMode,
          minutes: sessionMinutes,
          userId: "dad",
          speechSpeed,
          voiceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Session generation failed.");
      }

      const data = (await response.json()) as LessonSession;
      setLesson(data);

      // Kick off the warm-voice fetch immediately. If autoStart is true,
      // also start browser TTS reading the script *right now* so audio
      // starts in <1s while the warm voice loads in the background — when
      // it lands, the audioSources useEffect auto-plays it (because
      // pendingAudioAutoplayRef is true), which interrupts the browser
      // utterance via stopAudio earlier in this function.
      if (autoStart) {
        pendingAudioAutoplayRef.current = true;
        playBrowserSpeech(data.script);
      }
      void requestNarrationFor(data, "main", autoStart);
      loadHistory();
    } catch {
      setError("The lesson did not arrive. Please try this topic again.");
    } finally {
      setIsLoadingLesson(false);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetch("/api/history?userId=dad");
      const data = (await response.json()) as { sessions: RecentSession[] };
      setRecentSessions(data.sessions || []);
    } catch {
      setRecentSessions([]);
    }
  }

  function surpriseMe() {
    if (traditionBias === "judaism") {
      loadTopics("judaism", { fresh: true });
      return;
    }

    if (traditionBias === "buddhism") {
      loadTopics("buddhism", { fresh: true });
      return;
    }

    const choices: Tradition[] = ["judaism", "buddhism", "both"];
    const next = choices[Math.floor(Math.random() * choices.length)];
    loadTopics(next, { fresh: true });
  }

  function favouriteThemeLabels(nextTradition: Tradition) {
    return favouriteThemeOptions
      .filter(
        (item) =>
          favouriteThemes.includes(item.id) &&
          (item.tradition === "both" || item.tradition === nextTradition),
      )
      .map((item) => item.label);
  }

  async function requestNarrationFor(
    targetLesson: LessonSession,
    kind: AudioKind,
    autoPlay: boolean,
  ) {
    const text = kind === "simplified" ? targetLesson.simplifiedScript : targetLesson.script;

    if (!text) {
      return;
    }

    if (autoPlay) {
      stopAudio();
      pendingAudioAutoplayRef.current = true;
    }

    // Try the pre-built warm narration first. If we shipped a static MP3
    // for this trove item + mode, use it (instant, no API call). Falls
    // through to /api/voice/tts on 404.
    if (kind === "main" && targetLesson.topic.researchId) {
      const prebuiltUrl = `/audio/lessons/${targetLesson.topic.researchId}-${targetLesson.mode}.mp3`;
      try {
        const head = await fetch(prebuiltUrl, { method: "HEAD" });
        if (head.ok) {
          setAudioSources((current) => ({ ...current, [kind]: prebuiltUrl }));
          setLesson((current) =>
            current?.id === targetLesson.id
              ? {
                  ...current,
                  audioUrl: prebuiltUrl,
                  audioAvailable: true,
                  voiceId,
                  narrationProvider: "xai",
                }
              : current,
          );
          return;
        }
      } catch {
        // network error — fall through to API
      }
    }

    setIsLoadingAudio(true);
    setNarrationError(null);

    try {
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          language: "en",
          format: "mp3",
          session_id: targetLesson.id,
          cache: true,
          tradition: targetLesson.tradition,
          topic: targetLesson.topic.title,
          speech_speed: speechSpeed,
        }),
      });

      if (!response.ok) {
        let reason = "Voice generation failed.";
        try {
          const data = (await response.clone().json()) as { error?: string };
          if (data?.error) reason = data.error;
        } catch {}
        throw new Error(reason);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const providerHeader = response.headers.get("X-Two-Paths-Provider");
      const provider: "xai" | "gemini" = providerHeader === "gemini" ? "gemini" : "xai";
      audioObjectUrlsRef.current.push(audioUrl);
      pendingAudioAutoplayRef.current = autoPlay;
      setAudioSources((current) => ({ ...current, [kind]: audioUrl }));
      setLesson((current) =>
        current?.id === targetLesson.id
          ? {
              ...current,
              audioUrl: kind === "main" ? audioUrl : current.audioUrl,
              audioAvailable: true,
              voiceId,
              narrationProvider: provider,
            }
          : current,
      );
    } catch (err) {
      pendingAudioAutoplayRef.current = false;
      const detail = err instanceof Error ? err.message : "";
      setNarrationError(
        detail
          ? `Warm voice unavailable (${detail.slice(0, 120)}). Using the browser voice instead.`
          : "Warm voice isn't available right now — using the browser voice instead.",
      );
      setLesson((current) =>
        current?.id === targetLesson.id
          ? {
              ...current,
              audioAvailable: false,
              narrationProvider: "browser",
            }
          : current,
      );

      if (autoPlay) {
        playBrowserSpeech(text);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  }

  function stopAudio() {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setIsPlaying(false);
  }

  function previewTopic(topic: Topic) {
    if (typeof window === "undefined") return;

    // Toggle off if already previewing this one
    if (previewingTopicId === topic.id) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      window.speechSynthesis?.cancel();
      setPreviewingTopicId(null);
      return;
    }

    // Stop any current preview
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    window.speechSynthesis?.cancel();

    setPreviewingTopicId(topic.id);

    const fallbackToBrowser = () => {
      if (!("speechSynthesis" in window)) {
        setPreviewingTopicId((id) => (id === topic.id ? null : id));
        return;
      }
      const parts = [topic.title];
      if (topic.cluster) parts.push(topic.cluster);
      parts.push(topic.summary);
      if (topic.keyLine) parts.push(topic.keyLine);
      const utterance = new SpeechSynthesisUtterance(parts.join(". "));
      utterance.rate =
        speechSpeed === "slower" ? 0.78 : speechSpeed === "faster" ? 1.08 : 0.9;
      utterance.pitch = 0.95;
      utterance.onend = () => setPreviewingTopicId((id) => (id === topic.id ? null : id));
      utterance.onerror = () => setPreviewingTopicId((id) => (id === topic.id ? null : id));
      window.speechSynthesis.speak(utterance);
    };

    // Try the pre-built warm preview first (Ara). Falls back to browser TTS.
    const url = `/audio/previews/${topic.id}.mp3`;
    const audio = new Audio(url);
    audio.onended = () => setPreviewingTopicId((id) => (id === topic.id ? null : id));
    audio.onerror = () => {
      previewAudioRef.current = null;
      fallbackToBrowser();
    };
    previewAudioRef.current = audio;
    audio.play().catch(() => {
      previewAudioRef.current = null;
      fallbackToBrowser();
    });
  }

  function speakWithFallback(text: string, audioUrl?: string) {
    // Cancel anything currently speaking
    window.speechSynthesis?.cancel();
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onerror = () => {
        // Fall back to browser TTS if the prebuilt MP3 is missing
        playBrowserSpeech(text);
      };
      audio.play().catch(() => playBrowserSpeech(text));
      return;
    }
    playBrowserSpeech(text);
  }

  function playBrowserSpeech(text = currentScript) {
    if (!text) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate =
      speechSpeed === "slower" ? 0.78 : speechSpeed === "faster" ? 1.08 : 0.92;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }

  function pauseAudio() {
    audioRef.current?.pause();
    window.speechSynthesis?.pause();
    setIsPlaying(false);
  }

  function continueAudio() {
    // Warm voice already loaded → just play it
    if (audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }

    // Browser TTS paused → resume
    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    // Warm voice still on the way — start browser TTS now so audio is
    // immediate, and flag autoplay so the warm voice swaps in cleanly
    // when it lands. Do NOT fire another /api/voice/tts request — the
    // existing in-flight one will arrive shortly.
    if (isLoadingAudio && lesson) {
      pendingAudioAutoplayRef.current = true;
      playBrowserSpeech();
      return;
    }

    // No request in flight, no audio loaded — start a fetch + browser TTS bridge
    if (lesson) {
      pendingAudioAutoplayRef.current = true;
      playBrowserSpeech();
      void requestNarrationFor(lesson, showSimplified ? "simplified" : "main", true);
      return;
    }

    playBrowserSpeech();
  }

  function repeatCurrent() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }

    if (isLoadingAudio && lesson) {
      pendingAudioAutoplayRef.current = true;
      playBrowserSpeech();
      return;
    }

    if (lesson) {
      pendingAudioAutoplayRef.current = true;
      playBrowserSpeech();
      void requestNarrationFor(lesson, showSimplified ? "simplified" : "main", true);
      return;
    }

    playBrowserSpeech();
  }

  function makeSimpler() {
    if (!lesson) {
      return;
    }

    stopAudio();
    setShowSimplified(true);

    if (audioSources.simplified) {
      pendingAudioAutoplayRef.current = true;
      window.setTimeout(() => {
        audioRef.current?.play().catch(() => setIsPlaying(false));
      }, 0);
      return;
    }

    void requestNarrationFor(lesson, "simplified", true);
  }

  const backHomeButton = (
    <button className="large-button secondary-light" onClick={() => setScreen("home")}>
      <ArrowLeft aria-hidden size={28} />
      Back to Two Paths
    </button>
  );

  return (
    <AmbientPlayerProvider>
    <main className="app-shell">
      <AmbientPlayer />
      <div className="surface">
        {screen === "home" && (
          <HomeScreen
            onChoose={loadTopics}
            onSurprise={surpriseMe}
            onSettings={() => {
              loadHistory();
              setScreen("settings");
            }}
            onLibrary={() => setScreen("library")}
          />
        )}

        {screen === "library" && (
          <LibraryScreen
            onBack={() => setScreen("home")}
            onChooseTopic={(topic) => chooseTopic(topic, false)}
          />
        )}

        {screen === "topics" && tradition && (
          <TopicsScreen
            tradition={tradition}
            topics={topics}
            topicSource={topicSource}
            persisted={topicsPersisted}
            isLoading={isLoadingTopics}
            error={error}
            mode={mode}
            setMode={setMode}
            onBack={() => setScreen("home")}
            onRefresh={() => loadTopics(tradition, { fresh: true })}
            onShuffle={surpriseMe}
            onChooseTopic={chooseTopic}
            onPreview={previewTopic}
            previewingTopicId={previewingTopicId}
          />
        )}

        {screen === "lesson" && (
          <LessonScreen
            topic={selectedTopic}
            lesson={lesson}
            isLoading={isLoadingLesson}
            isLoadingAudio={isLoadingAudio}
            error={error}
            narrationError={narrationError}
            mode={mode}
            setMode={(nextMode) => {
              if (nextMode === mode || !selectedTopic) return;
              setMode(nextMode);
              // Re-load this topic in the new mode (instant for prebuilt items)
              chooseTopic(selectedTopic, isPlaying, nextMode);
            }}
            allTopics={topics}
            onPickTopic={(topic) => chooseTopic(topic, isPlaying)}
            currentScript={currentScript}
            showTranscript={showTranscript}
            showSimplified={showSimplified}
            isPlaying={isPlaying}
            voiceId={voiceId}
            onBack={() => setScreen("topics")}
            onPlay={continueAudio}
            onPause={pauseAudio}
            onRepeat={repeatCurrent}
            onSimplify={makeSimpler}
            onQuestion={() => {
              pauseAudio();
              setScreen("question");
            }}
            onFinish={() => {
              stopAudio();
              setScreen("home");
            }}
          />
        )}

        {screen === "question" && lesson && (
          <QuestionScreen
            lesson={lesson}
            selectedAnswer={selectedAnswer}
            hintVisible={hintVisible}
            onSelectAnswer={setSelectedAnswer}
            onSpeak={speakWithFallback}
            onHint={() => setHintVisible(true)}
            onSkip={() => setScreen("lesson")}
            onBack={() => setScreen("lesson")}
          />
        )}

        {screen === "settings" && (
          <SettingsScreen
            sessionMinutes={sessionMinutes}
            setSessionMinutes={setSessionMinutes}
            speechSpeed={speechSpeed}
            setSpeechSpeed={setSpeechSpeed}
            voiceId={voiceId}
            setVoiceId={setVoiceId}
            traditionBias={traditionBias}
            setTraditionBias={setTraditionBias}
            favouriteThemes={favouriteThemes}
            setFavouriteThemes={setFavouriteThemes}
            isManagingFavourites={isManagingFavourites}
            setIsManagingFavourites={setIsManagingFavourites}
            showTranscript={showTranscript}
            setShowTranscript={setShowTranscript}
            recentSessions={recentSessions}
            backHomeButton={backHomeButton}
          />
        )}
      </div>
    </main>
    </AmbientPlayerProvider>
  );
}

function HomeScreen({
  onChoose,
  onSurprise,
  onSettings,
  onLibrary,
}: {
  onChoose: (tradition: Tradition) => void;
  onSurprise: () => void;
  onSettings: () => void;
  onLibrary: () => void;
}) {
  return (
    <section className="landing-panel" aria-label="Two Paths home">
      <div className="landing-map">
        <Image
          src="/two-paths-landing.png"
          alt="Two Paths home artwork with a Judaism path on the left and a Buddhism path on the right."
          width={1254}
          height={1254}
          priority
          sizes="(max-width: 640px) calc(100vw - 20px), (max-width: 900px) calc(100vw - 32px), 860px"
          className="landing-artwork"
        />
        <button
          className="landing-hotspot landing-hotspot-menu"
          onClick={onLibrary}
          aria-label="Browse the library of reflections"
          title="Library"
        />
        <button
          className="landing-hotspot landing-hotspot-settings"
          onClick={onSettings}
          aria-label="Open settings"
          title="Settings"
        />
        <button
          className="landing-hotspot landing-hotspot-judaism"
          onClick={() => onChoose("judaism")}
          aria-label="Choose Judaism"
          title="Choose Judaism"
        />
        <button
          className="landing-hotspot landing-hotspot-buddhism"
          onClick={() => onChoose("buddhism")}
          aria-label="Choose Buddhism"
          title="Choose Buddhism"
        />
        <button
          className="landing-both-button"
          onClick={() => onChoose("both")}
          aria-label="Hold both paths together"
          title="Both paths"
        >
          <img src="/assets/symbols/both.png" alt="" className="landing-both-mark" />
          <span className="landing-both-label">Both</span>
        </button>
        <button
          className="landing-hotspot landing-hotspot-surprise"
          onClick={onSurprise}
          aria-label="Surprise me today"
          title="Surprise me today"
        />
      </div>
    </section>
  );
}

function TopicsScreen({
  tradition,
  topics,
  topicSource,
  persisted,
  isLoading,
  error,
  mode,
  setMode,
  onBack,
  onRefresh,
  onShuffle,
  onChooseTopic,
  onPreview,
  previewingTopicId,
}: {
  tradition: Tradition;
  topics: Topic[];
  topicSource: "gemini" | "fallback" | "trove";
  persisted: boolean;
  isLoading: boolean;
  error: string | null;
  mode: SessionMode;
  setMode: (mode: SessionMode) => void;
  onBack: () => void;
  onRefresh: () => void;
  onShuffle: () => void;
  onChooseTopic: (topic: Topic, autoStart?: boolean) => void;
  onPreview: (topic: Topic) => void;
  previewingTopicId: string | null;
}) {
  return (
    <section className="topics-square" aria-label={`${pathLabel(tradition)} reflections for today`}>
      <header className="topics-square-header">
        <div className="topics-square-pathmark">
          <PathMark tradition={tradition} />
        </div>
        <div className="topics-square-modes">
          {modes.map((item) => (
            <button
              key={item.id}
              className="segmented-choice"
              data-active={mode === item.id}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="topics-square-grid">
        {isLoading ? (
          <div className="topics-square-state">
            <RefreshCw className="animate-spin text-[var(--gold-deep)]" size={56} />
            <p className="font-sans text-[22px] text-[var(--navy)]">
              Gathering today&apos;s reflections&hellip;
            </p>
          </div>
        ) : error ? (
          <div className="topics-square-state">
            <p className="rounded-[14px] bg-[#fff1e8] p-5 font-sans text-[20px]">{error}</p>
          </div>
        ) : (
          topics.slice(0, 4).map((topic) => (
            <TopicTile
              key={topic.id}
              topic={topic}
              tradition={tradition}
              isPreviewing={previewingTopicId === topic.id}
              onChoose={() => onChooseTopic(topic, false)}
              onPreview={() => onPreview(topic)}
            />
          ))
        )}
      </div>

      <footer className="topics-square-footer">
        <button className="large-button secondary-light" onClick={onBack}>
          <ArrowLeft aria-hidden size={26} />
          Back
        </button>
        <button className="large-button primary-bridge" onClick={onShuffle}>
          <img src="/assets/symbols/mark-shuffle.png" alt="" className="button-icon" />
          Shuffle
        </button>
      </footer>

      {!isLoading && topics.length > 0 && (
        <p className="topics-square-source">
          {topicSource === "trove"
            ? "Researched trove reflections"
            : topicSource === "gemini"
              ? "Fresh reflections"
              : "Gentle starter reflections"}
          {persisted ? " · saved" : ""}
        </p>
      )}
    </section>
  );
}

function TopicTile({
  topic,
  tradition,
  isPreviewing,
  onChoose,
  onPreview,
}: {
  topic: Topic;
  tradition: Tradition;
  isPreviewing: boolean;
  onChoose: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className="topic-tile"
      data-tradition={tradition}
      role="button"
      tabIndex={0}
      onClick={onChoose}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onChoose();
        }
      }}
      aria-label={`Open ${topic.title}`}
    >
      <h2 className="topic-tile-title">{topic.title}</h2>
      <div className="topic-tile-image">
        {topic.imageUrl ? (
          <img src={topic.imageUrl} alt="" loading="lazy" />
        ) : (
          <TopicIcon topic={topic} />
        )}
      </div>
      <div className="topic-tile-details">
        {topic.cluster && (
          <span className="topic-tile-cluster">{topic.cluster}</span>
        )}
        <p className="topic-tile-summary">{topic.summary}</p>
      </div>
      <button
        type="button"
        className="topic-tile-speaker"
        data-active={isPreviewing}
        onClick={(event) => {
          event.stopPropagation();
          onPreview();
        }}
        onKeyDown={(event) => event.stopPropagation()}
        aria-label={
          isPreviewing
            ? `Stop preview of ${topic.title}`
            : `Listen to a short preview of ${topic.title}`
        }
        title={isPreviewing ? "Stop preview" : "Hear preview"}
      >
        {isPreviewing ? <Pause aria-hidden size={18} /> : <Volume2 aria-hidden size={18} />}
      </button>
    </div>
  );
}

function LibraryScreen({
  onBack,
  onChooseTopic,
}: {
  onBack: () => void;
  onChooseTopic: (topic: Topic) => void;
}) {
  const [section, setSection] = useState<"reflections" | "music">("reflections");
  const [filter, setFilter] = useState<"all" | Tradition>("all");
  const all = useMemo(() => allCuratedTopics(), []);
  const filtered = useMemo(
    () => (filter === "all" ? all : all.filter((t) => t.tradition === filter)),
    [all, filter],
  );

  // Group by cluster within tradition order
  const grouped = useMemo(() => {
    const map = new Map<string, { tradition: Tradition; cluster: string; topics: Topic[] }>();
    for (const topic of filtered) {
      const cluster = topic.cluster || "Other reflections";
      const key = `${topic.tradition}::${cluster}`;
      const entry = map.get(key);
      if (entry) {
        entry.topics.push(topic);
      } else {
        map.set(key, { tradition: topic.tradition, cluster, topics: [topic] });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const counts = useMemo(
    () => ({
      all: all.length,
      judaism: all.filter((t) => t.tradition === "judaism").length,
      buddhism: all.filter((t) => t.tradition === "buddhism").length,
      both: all.filter((t) => t.tradition === "both").length,
    }),
    [all],
  );

  return (
    <section className="sacred-panel rounded-[18px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button className="large-button secondary-light" onClick={onBack}>
          <ArrowLeft aria-hidden size={28} />
          Back to Two Paths
        </button>
        <BookOpen aria-hidden className="text-[var(--navy)]" size={42} />
      </div>

      <div className="mx-auto mt-4 max-w-4xl text-center">
        <h1 className="text-[44px] font-bold leading-tight text-[var(--navy)]">
          The library
        </h1>
        <p className="mt-2 font-sans text-[22px] text-[var(--ink)]">
          {section === "reflections"
            ? "Every reflection in the trove. Tap any one to listen."
            : "All the ambient music. Like, dislike, change your mind."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          className="segmented-choice library-tab"
          data-active={section === "reflections"}
          onClick={() => setSection("reflections")}
        >
          <img src="/assets/symbols/tab-reflections.png" alt="" className="library-tab-icon" />
          Reflections
        </button>
        <button
          className="segmented-choice library-tab"
          data-active={section === "music"}
          onClick={() => setSection("music")}
        >
          <img src="/assets/symbols/tab-music.png" alt="" className="library-tab-icon" />
          Music
        </button>
      </div>

      {section === "reflections" && (
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {(
          [
            ["all", `All (${counts.all})`],
            ["judaism", `Judaism (${counts.judaism})`],
            ["buddhism", `Buddhism (${counts.buddhism})`],
            ["both", `Both (${counts.both})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className="segmented-choice"
            data-active={filter === key}
            onClick={() => setFilter(key as "all" | Tradition)}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {section === "reflections" && (
      <div className="mt-8 grid gap-7">
        {grouped.map((group) => (
          <div key={`${group.tradition}::${group.cluster}`} className="library-cluster">
            <div className="library-cluster-head">
              <span className="library-cluster-tradition">
                {pathLabel(group.tradition)}
              </span>
              <h2 className="library-cluster-title">{group.cluster}</h2>
            </div>
            <ul className="library-cluster-list">
              {group.topics.map((topic) => (
                <li key={topic.id}>
                  <button
                    type="button"
                    className="library-row"
                    onClick={() => onChooseTopic(topic)}
                  >
                    <span className="library-row-image">
                      {topic.imageUrl && <img src={topic.imageUrl} alt="" loading="lazy" />}
                    </span>
                    <span className="library-row-text">
                      <span className="library-row-title">{topic.title}</span>
                      <span className="library-row-summary">{topic.summary}</span>
                    </span>
                    <Play aria-hidden size={26} className="library-row-icon" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      )}

      {section === "music" && <MusicLibrary />}
    </section>
  );
}

function MusicLibrary() {
  const player = useAmbientPlayer();
  const {
    tracks,
    tracksLoaded,
    currentTrackId,
    isPlaying,
    playSpecific,
    togglePlayPause,
    like,
    unlike,
    dislike,
    undislike,
    isLiked,
    isDisliked,
    liked,
    disliked,
  } = player;

  if (!tracksLoaded) {
    return (
      <div className="library-music-empty">
        <RefreshCw className="animate-spin" size={36} />
        <p className="font-sans text-[18px]">Tuning the music library&hellip;</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="library-music-empty">
        <Music size={36} />
        <p className="font-sans text-[18px]">
          No music yet. Drop mp3 files into <code>public/audio/ambient/</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="library-music">
      <div className="library-music-summary font-sans text-[15px] text-[var(--sage)]">
        {tracks.length} track{tracks.length === 1 ? "" : "s"} · {liked.length} liked ·{" "}
        {disliked.length} hidden
      </div>
      <ul className="library-music-list">
        {tracks.map((track) => {
          const playing = currentTrackId === track.id && isPlaying;
          const current = currentTrackId === track.id;
          const liked_ = isLiked(track.id);
          const disliked_ = isDisliked(track.id);
          return (
            <li
              key={track.id}
              className="library-music-row"
              data-current={current}
              data-disliked={disliked_}
            >
              <button
                type="button"
                className="library-music-play"
                onClick={() => {
                  if (current) togglePlayPause();
                  else playSpecific(track.id);
                }}
                aria-label={
                  playing ? `Pause ${track.title}` : `Play ${track.title}`
                }
              >
                {playing ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <span className="library-music-title">
                {track.title}
                {disliked_ && <span className="library-music-tag">Hidden</span>}
                {liked_ && <span className="library-music-tag library-music-tag-liked">Liked</span>}
              </span>
              <div className="library-music-actions">
                <button
                  type="button"
                  className="library-music-icon-btn"
                  data-active={liked_}
                  onClick={() => (liked_ ? unlike(track.id) : like(track.id))}
                  aria-label={liked_ ? `Unlike ${track.title}` : `Like ${track.title}`}
                  title={liked_ ? "Unlike" : "Like"}
                >
                  <Heart size={18} fill={liked_ ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  className="library-music-icon-btn library-music-dislike"
                  data-active={disliked_}
                  onClick={() => (disliked_ ? undislike(track.id) : dislike(track.id))}
                  aria-label={disliked_ ? `Restore ${track.title}` : `Hide ${track.title}`}
                  title={disliked_ ? "Restore to rotation" : "Hide from rotation"}
                >
                  <ThumbsDown size={18} fill={disliked_ ? "currentColor" : "none"} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LessonScreen({
  topic,
  lesson,
  isLoading,
  isLoadingAudio,
  error,
  narrationError,
  mode,
  setMode,
  allTopics,
  onPickTopic,
  currentScript,
  showTranscript,
  showSimplified,
  isPlaying,
  voiceId,
  onBack,
  onPlay,
  onPause,
  onRepeat,
  onSimplify,
  onQuestion,
  onFinish,
}: {
  topic: Topic | null;
  lesson: LessonSession | null;
  isLoading: boolean;
  isLoadingAudio: boolean;
  error: string | null;
  narrationError: string | null;
  mode: SessionMode;
  setMode: (mode: SessionMode) => void;
  allTopics: Topic[];
  onPickTopic: (topic: Topic) => void;
  currentScript: string;
  showTranscript: boolean;
  showSimplified: boolean;
  isPlaying: boolean;
  voiceId: VoiceId;
  onBack: () => void;
  onPlay: () => void;
  onPause: () => void;
  onRepeat: () => void;
  onSimplify: () => void;
  onQuestion: () => void;
  onFinish: () => void;
}) {
  const ready = Boolean(lesson);
  const audioReady = Boolean(lesson?.audioAvailable);

  // Find prev/next topic from the visible 4 (today's selection)
  const idx = topic ? allTopics.findIndex((t) => t.id === topic.id) : -1;
  const prevTopic = idx > 0 ? allTopics[idx - 1] : null;
  const nextTopic = idx >= 0 && idx < allTopics.length - 1 ? allTopics[idx + 1] : null;

  return (
    <section className="lesson-square" aria-label="Today's reflection">
      <header className="lesson-square-header">
        <button className="large-button secondary-light lesson-back" onClick={onBack}>
          <ArrowLeft aria-hidden size={22} />
          Topics
        </button>
        <div className="lesson-square-titleblock">
          <h1 className="lesson-square-title">
            {lesson?.title || topic?.title || "Preparing today's reflection…"}
          </h1>
        </div>
        <div className="lesson-square-spacer" aria-hidden />
      </header>

      <div className="lesson-mode-row">
        {modes.map((m) => (
          <button
            key={m.id}
            className="segmented-choice lesson-mode-pill"
            data-active={mode === m.id}
            onClick={() => setMode(m.id)}
            disabled={isLoading}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="lesson-tile lesson-error">
          {error}
        </div>
      )}

      <div
        className="lesson-tile lesson-hero lesson-hero-wide"
        data-has-image={Boolean(topic?.imageUrl)}
      >
        {topic?.imageUrl && (
          <img src={topic.imageUrl} alt="" className="lesson-hero-image" />
        )}
        <div className="lesson-hero-overlay">
          <button
            className="lesson-play"
            onClick={isPlaying ? onPause : onPlay}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause narration" : "Play narration"}
          >
            {isLoadingAudio ? (
              <RefreshCw aria-hidden className="animate-spin" size={32} />
            ) : isPlaying ? (
              <Pause aria-hidden size={36} />
            ) : (
              <Play aria-hidden size={36} />
            )}
            <span>
              {isLoadingAudio
                ? "Voice arriving…"
                : isPlaying
                  ? "Pause"
                  : "Listen"}
            </span>
          </button>
          <span className="lesson-hero-voice">
            {audioReady
              ? `${providerLabel(lesson?.narrationProvider)} · ${voiceLabel(lesson?.voiceId || voiceId)}`
              : isLoadingAudio
                ? `Preparing ${voiceLabel(voiceId)}…`
                : ready
                  ? "Press play when ready"
                  : "Loading…"}
          </span>
        </div>
      </div>

      {ready && (
        <div className="lesson-closing-row">
          <div className="lesson-tile lesson-closing-tile">
            <span className="lesson-closing-label">
              <img src="/assets/symbols/mark-takeaway.png" alt="" className="lesson-closing-mark" />
              Takeaway
            </span>
            <p>{lesson!.closing.takeaway}</p>
          </div>
          <div className="lesson-tile lesson-closing-tile">
            <span className="lesson-closing-label">
              <img src="/assets/symbols/mark-reflection.png" alt="" className="lesson-closing-mark" />
              Reflection
            </span>
            <p>{lesson!.closing.reflection}</p>
          </div>
          <div className="lesson-tile lesson-closing-tile">
            <span className="lesson-closing-label">
              <img src="/assets/symbols/mark-closing.png" alt="" className="lesson-closing-mark" />
              Closing
            </span>
            <p>{lesson!.closing.line}</p>
          </div>
        </div>
      )}

      {ready && showTranscript && (
        <div className="lesson-tile lesson-transcript lesson-transcript-scrollable">
          <div className="lesson-transcript-head">
            <BookOpen aria-hidden size={22} />
            {showSimplified ? "Simpler version" : "Transcript"}
          </div>
          <p className="lesson-transcript-body">{currentScript}</p>
        </div>
      )}

      {narrationError && (
        <div className="lesson-tile lesson-warn">
          {narrationError}
        </div>
      )}

      {ready && (
        <footer className="lesson-square-actions">
          <button
            className="large-button secondary-light lesson-nav-btn"
            onClick={() => prevTopic && onPickTopic(prevTopic)}
            disabled={!prevTopic}
            title={prevTopic?.title || "No previous topic"}
            aria-label="Previous topic"
          >
            <ArrowLeft aria-hidden size={22} />
            Prev
          </button>
          <button className="large-button secondary-light" onClick={onRepeat}>
            <RotateCcw aria-hidden size={20} />
            Repeat
          </button>
          <button className="large-button secondary-light" onClick={onSimplify}>
            <Leaf aria-hidden size={20} />
            Simpler
          </button>
          <button className="large-button secondary-light" onClick={onQuestion}>
            <CircleHelp aria-hidden size={20} />
            Question
          </button>
          <button className="large-button primary-gold" onClick={onFinish}>
            <X aria-hidden size={20} />
            Finish
          </button>
          <button
            className="large-button secondary-light lesson-nav-btn"
            onClick={() => nextTopic && onPickTopic(nextTopic)}
            disabled={!nextTopic}
            title={nextTopic?.title || "No next topic"}
            aria-label="Next topic"
          >
            Next
            <ArrowLeft aria-hidden size={22} style={{ transform: "rotate(180deg)" }} />
          </button>
        </footer>
      )}
    </section>
  );
}

function providerLabel(provider?: "xai" | "gemini" | "browser") {
  if (provider === "xai") return "Grok";
  if (provider === "gemini") return "Gemini";
  if (provider === "browser") return "Browser";
  return "Voice";
}

function QuestionScreen({
  lesson,
  selectedAnswer,
  hintVisible,
  onSelectAnswer,
  onSpeak,
  onHint,
  onSkip,
  onBack,
}: {
  lesson: LessonSession;
  selectedAnswer: string | null;
  hintVisible: boolean;
  onSelectAnswer: (id: string) => void;
  onSpeak: (text: string, audioUrl?: string) => void;
  onHint: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const answer = lesson.question.options.find((option) => option.id === selectedAnswer);

  return (
    <section className="sacred-panel rounded-[18px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button className="large-button secondary-light" onClick={onBack}>
          <ArrowLeft aria-hidden size={28} />
          Back to listening
        </button>
        <p className="font-sans text-[24px] font-bold text-[var(--navy)]">Question 1 of 1</p>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <div className="rounded-[18px] bg-white/70 p-7 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <h1 className="max-w-3xl text-[40px] font-bold leading-tight text-[var(--navy)]">
              {lesson.question.prompt}
            </h1>
            <button
              className="large-button icon-pill"
              onClick={() => onSpeak(lesson.question.prompt, lesson.question.promptAudioUrl)}
              aria-label="Hear the question"
            >
              <Volume2 aria-hidden size={30} />
              Hear
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {lesson.question.options.map((option) => (
              <div
                key={option.id}
                className="answer-card p-5 text-left font-sans text-[24px] font-bold"
                data-selected={selectedAnswer === option.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectAnswer(option.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectAnswer(option.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex-1">{option.text}</span>
                  <button
                    type="button"
                    className="answer-speak"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak(option.text, option.textAudioUrl);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label={`Hear option: ${option.text}`}
                  >
                    <Volume2 aria-hidden size={18} />
                  </button>
                  {selectedAnswer === option.id && <Check aria-hidden size={28} />}
                </div>
              </div>
            ))}
          </div>

          {hintVisible && (
            <div className="mt-6 flex items-start gap-3 rounded-[14px] bg-[var(--blue-note)] p-5 font-sans text-[22px]">
              <span className="flex-1">{lesson.question.hint}</span>
              <button
                type="button"
                className="answer-speak"
                onClick={() => onSpeak(lesson.question.hint, lesson.question.hintAudioUrl)}
                aria-label="Hear the hint"
              >
                <Volume2 aria-hidden size={18} />
              </button>
            </div>
          )}

          {answer && (
            <div className="mt-6 flex items-start gap-3 rounded-[14px] bg-[#fff1cb] p-5 font-sans text-[23px]">
              <span className="flex-1">{answer.response}</span>
              <button
                type="button"
                className="answer-speak"
                onClick={() => onSpeak(answer.response, answer.responseAudioUrl)}
                aria-label="Hear the response"
              >
                <Volume2 aria-hidden size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <button
            className="large-button secondary-light"
            onClick={() => onSpeak(lesson.question.prompt, lesson.question.promptAudioUrl)}
          >
            <Volume2 aria-hidden size={28} />
            Hear again
          </button>
          <button className="large-button secondary-light" onClick={onHint}>
            <Lightbulb aria-hidden size={28} />
            Give me a hint
          </button>
          <button className="large-button secondary-light" onClick={onSkip}>
            <X aria-hidden size={28} />
            Skip this
          </button>
        </div>
      </div>
    </section>
  );
}

function SettingsScreen({
  sessionMinutes,
  setSessionMinutes,
  speechSpeed,
  setSpeechSpeed,
  voiceId,
  setVoiceId,
  traditionBias,
  setTraditionBias,
  favouriteThemes,
  setFavouriteThemes,
  isManagingFavourites,
  setIsManagingFavourites,
  showTranscript,
  setShowTranscript,
  recentSessions,
  backHomeButton,
}: {
  sessionMinutes: number;
  setSessionMinutes: (value: number) => void;
  speechSpeed: SpeechSpeed;
  setSpeechSpeed: (value: SpeechSpeed) => void;
  voiceId: VoiceId;
  setVoiceId: (value: VoiceId) => void;
  traditionBias: "judaism" | "buddhism" | "balanced";
  setTraditionBias: (value: "judaism" | "buddhism" | "balanced") => void;
  favouriteThemes: string[];
  setFavouriteThemes: (value: string[]) => void;
  isManagingFavourites: boolean;
  setIsManagingFavourites: (value: boolean) => void;
  showTranscript: boolean;
  setShowTranscript: (value: boolean) => void;
  recentSessions: RecentSession[];
  backHomeButton: ReactNode;
}) {
  function toggleFavourite(id: string) {
    setFavouriteThemes(
      favouriteThemes.includes(id)
        ? favouriteThemes.filter((item) => item !== id)
        : [...favouriteThemes, id],
    );
  }

  return (
    <section className="sacred-panel rounded-[18px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {backHomeButton}
        <Users aria-hidden className="text-[var(--navy)]" size={42} />
      </div>

      <div className="mx-auto mt-4 max-w-4xl text-center">
        <h1 className="text-[46px] font-bold text-[var(--navy)]">Settings</h1>
        <p className="font-sans text-[24px]">Customize the experience for Dad.</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <SettingBlock icon={<Timer aria-hidden size={30} />} title="Session length">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[3, 5, 8, 10].map((value) => (
              <button
                key={value}
                className="segmented-choice"
                data-active={sessionMinutes === value}
                onClick={() => setSessionMinutes(value)}
              >
                {value === 10 ? "10+ min" : `${value} min`}
              </button>
            ))}
          </div>
        </SettingBlock>

        <SettingBlock icon={<Gauge aria-hidden size={30} />} title="Tradition balance">
          <div className="grid grid-cols-3 gap-3">
            {(["judaism", "buddhism", "balanced"] as const).map((value) => (
              <button
                key={value}
                className="segmented-choice"
                data-active={traditionBias === value}
                onClick={() => setTraditionBias(value)}
              >
                {titleCase(value)}
              </button>
            ))}
          </div>
        </SettingBlock>

        <SettingBlock icon={<Headphones aria-hidden size={30} />} title="Voice speed">
          <div className="grid grid-cols-3 gap-3">
            {(["slower", "normal", "faster"] as const).map((value) => (
              <button
                key={value}
                className="segmented-choice"
                data-active={speechSpeed === value}
                onClick={() => setSpeechSpeed(value)}
              >
                {titleCase(value)}
              </button>
            ))}
          </div>
        </SettingBlock>

        <SettingBlock icon={<Volume2 aria-hidden size={30} />} title="Narration voice">
          <div className="grid gap-3 md:grid-cols-3">
            {voiceOptions.map((voice) => (
              <button
                key={voice.id}
                className="segmented-choice min-h-[92px] flex-col"
                data-active={voiceId === voice.id}
                onClick={() => setVoiceId(voice.id)}
              >
                <span>{voice.label}</span>
                <span className="font-sans text-[18px] font-normal">{voice.tone}</span>
              </button>
            ))}
          </div>
        </SettingBlock>

        <SettingBlock icon={<BookOpen aria-hidden size={30} />} title="Favourite topics">
          <button
            className="large-button secondary-light w-full"
            onClick={() => setIsManagingFavourites(!isManagingFavourites)}
          >
            <Heart aria-hidden size={28} />
            {isManagingFavourites ? "Done" : "Manage favourites"}
          </button>
          <p className="mt-4 font-sans text-[21px] text-[var(--sage)]">
            Pick themes Dad enjoys. We will nudge new topic choices toward these
            within Judaism or Buddhism.
          </p>
          {isManagingFavourites && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {favouriteThemeOptions.map((item) => (
                <button
                  key={item.id}
                  className="favourite-chip"
                  data-active={favouriteThemes.includes(item.id)}
                  onClick={() => toggleFavourite(item.id)}
                >
                  <span>{item.label}</span>
                  <span>{item.tradition === "both" ? "Both paths" : titleCase(item.tradition)}</span>
                </button>
              ))}
            </div>
          )}
        </SettingBlock>

        <SettingBlock icon={<BookOpen aria-hidden size={30} />} title="Show transcript">
          <button
            className={`large-button w-full ${
              showTranscript ? "primary-navy" : "secondary-light"
            }`}
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <BookOpen aria-hidden size={28} />
            {showTranscript ? "Transcript on" : "Transcript off"}
          </button>
        </SettingBlock>

        <SettingBlock icon={<History aria-hidden size={30} />} title="Recent activity">
          {recentSessions.length > 0 ? (
            <div className="grid gap-3">
              {recentSessions.map((session) => (
                <p
                  key={session.id}
                  className="rounded-[12px] bg-white/60 p-4 font-sans text-[21px]"
                >
                  {titleCase(session.tradition)} - {session.topic}
                </p>
              ))}
            </div>
          ) : (
            <p className="font-sans text-[23px]">A quiet place for today&apos;s explorations.</p>
          )}
        </SettingBlock>
      </div>

      <div className="mt-6 flex items-start gap-4 rounded-[14px] bg-[var(--blue-note)] p-5 font-sans text-[23px]">
        <Heart aria-hidden className="mt-1 shrink-0" size={32} />
        <p>
          This is a place for inspiration and learning, not tracking or testing.
          We are here to support meaningful moments.
        </p>
      </div>
    </section>
  );
}

function SettingBlock({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-[rgba(0,29,61,0.12)] bg-white/55 p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-3 text-[28px] font-bold text-[var(--navy)]">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function ClosingItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] bg-white/55 p-5 font-sans text-[23px] shadow-sm">
      <span className="mt-1 text-[var(--gold-deep)]">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function PathMark({ tradition }: { tradition: Tradition }) {
  const symbol =
    tradition === "judaism" ? "judaism" : tradition === "both" ? "both" : "buddhism";
  return (
    <div className="path-mark">
      <img
        src={`/assets/symbols/${symbol}.png`}
        alt=""
        className="path-mark-symbol"
        loading="lazy"
      />
      <span className="path-mark-label">{pathLabel(tradition)}</span>
    </div>
  );
}

function pathLabel(tradition: Tradition) {
  return tradition === "both" ? "Both paths" : titleCase(tradition);
}

function primaryPathClass(tradition: Tradition) {
  if (tradition === "judaism") return "primary-navy";
  if (tradition === "both") return "primary-bridge";
  return "primary-gold";
}

function TopicIcon({ topic }: { topic: Topic }) {
  const size = 70;

  if (topic.tradition === "judaism" && topic.visual === "scroll") {
    return <BookOpen aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  if (topic.tradition === "judaism" && topic.visual === "teacher") {
    return <Users aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  if (topic.tradition === "judaism" && topic.visual === "seedling") {
    return <Leaf aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  if (topic.tradition === "buddhism" && topic.visual === "lotus") {
    return <Flower2 aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  if (topic.tradition === "buddhism" && topic.visual === "tree") {
    return <Leaf aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  if (topic.tradition === "buddhism" && topic.visual === "stones") {
    return <CircleHelp aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  return <Volume2 aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function modeLabel(value: SessionMode) {
  return modes.find((item) => item.id === value)?.label || "Listen and Learn";
}

function voiceLabel(value: VoiceId) {
  return voiceOptions.find((item) => item.id === value)?.label || "Ara";
}
