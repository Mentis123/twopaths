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
  Menu,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings,
  Sparkles,
  Timer,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  LessonSession,
  SessionMode,
  Topic,
  TopicResponse,
  Tradition,
} from "@/lib/types";

type Screen = "home" | "topics" | "lesson" | "question" | "settings";
type SpeechSpeed = "slower" | "normal" | "faster";
type TraditionBias = Tradition | "balanced";

type RecentSession = {
  id: string;
  tradition: Tradition;
  topic: string;
  mode: string;
  created_at: string;
};

const modes: Array<{ id: SessionMode; label: string }> = [
  { id: "listen", label: "Listen and Learn" },
  { id: "story", label: "Story Mode" },
  { id: "quiz", label: "Gentle Quiz" },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [tradition, setTradition] = useState<Tradition | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicSource, setTopicSource] = useState<"gemini" | "fallback" | "trove">(
    "trove",
  );
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
  const [traditionBias, setTraditionBias] = useState<TraditionBias>("balanced");
  const [showTranscript, setShowTranscript] = useState(true);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentScript = useMemo(() => {
    if (!lesson) {
      return "";
    }

    return showSimplified ? lesson.simplifiedScript : lesson.script;
  }, [lesson, showSimplified]);

  const prefsHydratedRef = useRef(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/preferences?userId=dad")
      .then((response) => response.json())
      .then((data: { preferences?: Record<string, unknown> }) => {
        if (cancelled || !data.preferences) {
          return;
        }
        const p = data.preferences;
        if (typeof p.preferred_session_length === "number") {
          setSessionMinutes(p.preferred_session_length);
        }
        if (typeof p.speech_speed === "number") {
          setSpeechSpeed(
            p.speech_speed < 0.85 ? "slower" : p.speech_speed > 1.05 ? "faster" : "normal",
          );
        }
        if (typeof p.tradition_bias === "string") {
          setTraditionBias(p.tradition_bias as TraditionBias);
        }
        if (typeof p.show_text === "boolean") {
          setShowTranscript(p.show_text);
        }
      })
      .catch(() => {})
      .finally(() => {
        prefsHydratedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!prefsHydratedRef.current) {
      return;
    }
    const speedNumber =
      speechSpeed === "slower" ? 0.78 : speechSpeed === "faster" ? 1.08 : 0.92;
    fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "dad",
        preferred_session_length: sessionMinutes,
        speech_speed: speedNumber,
        tradition_bias: traditionBias,
        show_text: showTranscript,
      }),
    }).catch(() => {});
  }, [sessionMinutes, speechSpeed, traditionBias, showTranscript]);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;

    if (!lesson?.audioUrl) {
      return;
    }

    const audio = new Audio(lesson.audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audioRef.current = audio;

    return () => {
      audio.pause();
    };
  }, [lesson?.audioUrl]);

  async function loadTopics(
    nextTradition: Tradition,
    options: { autoStart?: boolean; fresh?: boolean } = {},
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
        body: JSON.stringify({ tradition: nextTradition, fresh: options.fresh }),
      });

      if (!response.ok) {
        throw new Error("Topic generation failed.");
      }

      const data = (await response.json()) as TopicResponse;
      setTopics(data.topics);
      setTopicSource(data.generatedBy);
      setTopicsPersisted(data.persisted);

      if (options.autoStart && data.topics.length > 0) {
        const nextTopic = data.topics[Math.floor(Math.random() * data.topics.length)];
        await chooseTopic(nextTopic);
      }
    } catch {
      setError("The topic well is quiet for a moment. Try again.");
      setTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  }

  async function chooseTopic(topic: Topic) {
    setSelectedTopic(topic);
    setScreen("lesson");
    setLesson(null);
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
          mode,
          minutes: sessionMinutes,
          userId: "dad",
          speechSpeed,
        }),
      });

      if (!response.ok) {
        throw new Error("Session generation failed.");
      }

      const data = (await response.json()) as LessonSession;
      setLesson(data);
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
    const choices: Tradition[] =
      traditionBias === "balanced"
        ? ["judaism", "buddhism", "both"]
        : [traditionBias];
    const nextTradition = choices[Math.floor(Math.random() * choices.length)];

    loadTopics(nextTradition, { autoStart: true, fresh: true });
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

  function playCurrentScript(text = currentScript) {
    if (!text) {
      return;
    }

    if (audioRef.current && text === lesson?.script) {
      audioRef.current.play().catch(() => setIsPlaying(false));
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
    if (audioRef.current && !showSimplified) {
      audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }

    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    playCurrentScript();
  }

  function repeatCurrent() {
    if (audioRef.current && !showSimplified) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }

    playCurrentScript();
  }

  function makeSimpler() {
    if (!lesson) {
      return;
    }

    setShowSimplified(true);
    playCurrentScript(lesson.simplifiedScript);
  }

  const backHomeButton = (
    <button className="large-button secondary-light" onClick={() => setScreen("home")}>
      <ArrowLeft aria-hidden size={28} />
      Back to Two Paths
    </button>
  );

  return (
    <main className="app-shell">
      <div className="surface">
        {screen === "home" && (
          <HomeScreen
            onChoose={loadTopics}
            onSurprise={surpriseMe}
            onSettings={() => {
              loadHistory();
              setScreen("settings");
            }}
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
            onChooseTopic={chooseTopic}
          />
        )}

        {screen === "lesson" && (
          <LessonScreen
            topic={selectedTopic}
            lesson={lesson}
            isLoading={isLoadingLesson}
            error={error}
            currentScript={currentScript}
            showTranscript={showTranscript}
            showSimplified={showSimplified}
            isPlaying={isPlaying}
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
            onHearAgain={() => playCurrentScript(lesson.question.prompt)}
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
            traditionBias={traditionBias}
            setTraditionBias={setTraditionBias}
            showTranscript={showTranscript}
            setShowTranscript={setShowTranscript}
            recentSessions={recentSessions}
            backHomeButton={backHomeButton}
          />
        )}
      </div>
    </main>
  );
}

function HomeScreen({
  onChoose,
  onSurprise,
  onSettings,
}: {
  onChoose: (tradition: Tradition) => void;
  onSurprise: () => void;
  onSettings: () => void;
}) {
  return (
    <section className="sacred-panel relative overflow-hidden rounded-[18px] bg-[var(--navy)] p-5 text-center">
      <div className="absolute left-6 top-6 z-10 flex gap-3">
        <button className="large-button icon-pill" aria-label="Menu">
          <Menu aria-hidden size={34} />
          Menu
        </button>
      </div>

      <div className="absolute right-6 top-6 z-10">
        <button className="large-button icon-pill" onClick={onSettings}>
          <Settings aria-hidden size={34} />
          Settings
        </button>
      </div>

      <div className="py-16">
        <p className="mb-4 font-sans text-[24px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
          Two Paths
        </p>
        <div className="path-disc" aria-label="Choose a spiritual path">
          <div className="path-disc-texture" />
          <button
            className="path-hotspot path-hotspot-left"
            onClick={() => onChoose("judaism")}
          >
            <span className="magen" aria-hidden />
            <span className="path-title">Judaism</span>
            <span className="path-subtitle">
              Explore wisdom, tradition, and stories.
            </span>
          </button>
          <button
            className="path-hotspot path-hotspot-right"
            onClick={() => onChoose("buddhism")}
          >
            <Flower2 aria-hidden size={86} strokeWidth={1.4} />
            <span className="path-title">Buddhism</span>
            <span className="path-subtitle">
              Explore wisdom, mindfulness, and compassion.
            </span>
          </button>
          <button
            className="path-bridge-button"
            onClick={() => onChoose("both")}
            aria-label="Choose both paths"
          >
            <Sparkles aria-hidden size={34} />
            <span className="path-bridge-title">Both</span>
            <span className="path-bridge-subtitle">Hold them side by side</span>
          </button>
        </div>

        <button
          className="large-button primary-gold mx-auto mt-[-38px] min-h-[82px] px-12 text-[36px]"
          onClick={onSurprise}
        >
          <Sparkles aria-hidden size={38} />
          Shuffle me into a lesson
        </button>
        <p className="mt-8 font-sans text-[22px] font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
          Two paths. One journey within.
        </p>
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
  onChooseTopic,
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
  onChooseTopic: (topic: Topic) => void;
}) {
  return (
    <section className="sacred-panel rounded-[18px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button className="large-button secondary-light" onClick={onBack}>
          <ArrowLeft aria-hidden size={28} />
          Back to Two Paths
        </button>
        <PathMark tradition={tradition} />
      </div>

      <div className="mx-auto mt-6 max-w-4xl text-center">
        <h1 className="text-[44px] font-bold leading-tight text-[var(--navy)]">
          {pathLabel(tradition)} - Today&apos;s reflections
        </h1>
        <p className="mt-2 font-sans text-[24px] text-[var(--ink)]">
          Choose a topic to explore and listen.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
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

      {isLoading && (
        <div className="mx-auto mt-10 max-w-xl rounded-[16px] bg-white/70 p-8 text-center shadow">
          <RefreshCw className="mx-auto animate-spin text-[var(--gold-deep)]" size={44} />
          <p className="mt-4 font-sans text-[25px]">
            Gathering today&apos;s reflections...
          </p>
        </div>
      )}

      {error && (
        <div className="mx-auto mt-8 max-w-xl rounded-[16px] bg-[#fff1e8] p-6 font-sans text-[24px]">
          {error}
        </div>
      )}

      {!isLoading && topics.length > 0 && (
        <>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {topics.map((topic) => (
              <article key={topic.id} className="topic-card flex flex-col">
                <div className="topic-visual" data-tradition={tradition}>
                  {topic.imageUrl ? (
                    <img
                      src={topic.imageUrl}
                      alt=""
                      className="topic-visual-image"
                      loading="lazy"
                    />
                  ) : (
                    <TopicIcon topic={topic} />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-[28px] font-bold leading-tight text-[var(--navy)]">
                    {topic.title}
                  </h2>
                  {topic.cluster && (
                    <p className="mt-2 font-sans text-[16px] font-bold uppercase tracking-[0.12em] text-[var(--clay)]">
                      {topic.cluster}
                    </p>
                  )}
                  <p className="mt-3 flex-1 font-sans text-[21px] leading-snug">
                    {topic.summary}
                  </p>
                  {topic.keyLine && (
                    <p className="topic-keyline mt-4 font-sans text-[19px] leading-snug">
                      {topic.keyLine}
                    </p>
                  )}
                  <div className="mt-5 grid gap-3">
                    <button
                      className="large-button secondary-light w-full"
                      onClick={() => onChooseTopic(topic)}
                    >
                      <Volume2 aria-hidden size={28} />
                      Listen
                    </button>
                    <button
                      className={`large-button w-full ${primaryPathClass(tradition)}`}
                      onClick={() => onChooseTopic(topic)}
                    >
                      <Check aria-hidden size={28} />
                      Choose this
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button className="large-button primary-gold" onClick={onRefresh}>
              <RefreshCw aria-hidden size={28} />
              Show me different choices
            </button>
            <button className="large-button secondary-light" onClick={onBack}>
              <ArrowLeft aria-hidden size={28} />
              Back to Two Paths
            </button>
          </div>

          <p className="mt-5 text-center font-sans text-[20px] text-[var(--sage)]">
            {topicSource === "trove"
              ? "Researched trove reflections"
              : topicSource === "gemini"
                ? "Fresh reflections"
                : "Gentle starter reflections"}
            {persisted ? " saved for history." : "."}
          </p>
        </>
      )}
    </section>
  );
}

function LessonScreen({
  topic,
  lesson,
  isLoading,
  error,
  currentScript,
  showTranscript,
  showSimplified,
  isPlaying,
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
  error: string | null;
  currentScript: string;
  showTranscript: boolean;
  showSimplified: boolean;
  isPlaying: boolean;
  onBack: () => void;
  onPlay: () => void;
  onPause: () => void;
  onRepeat: () => void;
  onSimplify: () => void;
  onQuestion: () => void;
  onFinish: () => void;
}) {
  return (
    <section className="sacred-panel rounded-[18px] p-6">
      <button className="large-button secondary-light" onClick={onBack}>
        <ArrowLeft aria-hidden size={28} />
        Back to topics
      </button>

      <div className="mx-auto mt-5 max-w-5xl">
        <h1 className="text-center text-[48px] font-bold leading-tight text-[var(--navy)]">
          {lesson?.title || topic?.title || "Preparing today's lesson"}
        </h1>

        <div
          className="lesson-art mt-7 flex items-center justify-center"
          data-has-image={Boolean(topic?.imageUrl)}
        >
          {topic?.imageUrl && (
            <img
              src={topic.imageUrl}
              alt=""
              className="lesson-art-image"
            />
          )}
          {isLoading ? (
            <RefreshCw className="relative z-10 animate-spin text-[var(--gold)]" size={66} />
          ) : (
            <button
              className="large-button primary-navy relative z-10 min-h-[104px] min-w-[104px] rounded-full"
              onClick={isPlaying ? onPause : onPlay}
            >
              {isPlaying ? <Pause aria-hidden size={44} /> : <Play aria-hidden size={44} />}
              {isPlaying ? "Pause" : "Listen"}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-[16px] bg-[#fff1e8] p-6 font-sans text-[24px]">
            {error}
          </div>
        )}

        {isLoading && (
          <p className="mt-6 text-center font-sans text-[26px]">
            Preparing a warm narrated reflection...
          </p>
        )}

        {lesson && (
          <>
            {showTranscript && (
              <div className="mt-6 rounded-[14px] border border-[rgba(0,29,61,0.12)] bg-white/60 p-7 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-3 font-sans text-[21px] font-bold text-[var(--sage)]">
                  <BookOpen aria-hidden size={26} />
                  {showSimplified ? "Simpler version" : "Transcript"}
                </div>
                <p className="whitespace-pre-line font-sans text-[25px] leading-relaxed">
                  {currentScript}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <ClosingItem icon={<Leaf aria-hidden size={30} />} text={lesson.closing.takeaway} />
              <ClosingItem
                icon={<CircleHelp aria-hidden size={30} />}
                text={lesson.closing.reflection}
              />
              <ClosingItem icon={<Heart aria-hidden size={30} />} text={lesson.closing.line} />
            </div>

            {Boolean(lesson.themes?.length || lesson.sources?.length) && (
              <div className="source-panel mt-6">
                {lesson.themes && lesson.themes.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {lesson.themes.map((theme) => (
                      <span key={theme} className="theme-chip">
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
                {lesson.sources && lesson.sources.length > 0 && (
                  <>
                    <div className="mb-3 flex items-center gap-3 font-sans text-[21px] font-bold text-[var(--navy)]">
                      <BookOpen aria-hidden size={26} />
                      Source notes
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {lesson.sources.map((source) => (
                        <a
                          key={source.url}
                          className="source-link"
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{source.title}</span>
                          <small>{source.note}</small>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <button className="large-button secondary-light" onClick={onRepeat}>
                <RotateCcw aria-hidden size={28} />
                Repeat that
              </button>
              <button className="large-button secondary-light" onClick={onSimplify}>
                <Leaf aria-hidden size={28} />
                Make it simpler
              </button>
              <button className="large-button secondary-light" onClick={onQuestion}>
                <CircleHelp aria-hidden size={28} />
                Ask me a question
              </button>
              <button className="large-button primary-navy" onClick={isPlaying ? onPause : onPlay}>
                {isPlaying ? <Pause aria-hidden size={28} /> : <Play aria-hidden size={28} />}
                {isPlaying ? "Pause" : "Continue"}
              </button>
              <button className="large-button primary-gold" onClick={onFinish}>
                <X aria-hidden size={28} />
                Finish for today
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function QuestionScreen({
  lesson,
  selectedAnswer,
  hintVisible,
  onSelectAnswer,
  onHearAgain,
  onHint,
  onSkip,
  onBack,
}: {
  lesson: LessonSession;
  selectedAnswer: string | null;
  hintVisible: boolean;
  onSelectAnswer: (id: string) => void;
  onHearAgain: () => void;
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
            <button className="large-button icon-pill" onClick={onHearAgain}>
              <Volume2 aria-hidden size={30} />
              Hear
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {lesson.question.options.map((option) => (
              <button
                key={option.id}
                className="answer-card p-6 text-left font-sans text-[25px] font-bold"
                data-selected={selectedAnswer === option.id}
                onClick={() => onSelectAnswer(option.id)}
              >
                <span className="flex items-center justify-between gap-4">
                  {option.text}
                  {selectedAnswer === option.id && <Check aria-hidden size={34} />}
                </span>
              </button>
            ))}
          </div>

          {hintVisible && (
            <p className="mt-6 rounded-[14px] bg-[var(--blue-note)] p-5 font-sans text-[24px]">
              {lesson.question.hint}
            </p>
          )}

          {answer && (
            <p className="mt-6 rounded-[14px] bg-[#fff1cb] p-5 font-sans text-[25px]">
              {answer.response}
            </p>
          )}
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <button className="large-button secondary-light" onClick={onHearAgain}>
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
  traditionBias,
  setTraditionBias,
  showTranscript,
  setShowTranscript,
  recentSessions,
  backHomeButton,
}: {
  sessionMinutes: number;
  setSessionMinutes: (value: number) => void;
  speechSpeed: SpeechSpeed;
  setSpeechSpeed: (value: SpeechSpeed) => void;
  traditionBias: TraditionBias;
  setTraditionBias: (value: TraditionBias) => void;
  showTranscript: boolean;
  setShowTranscript: (value: boolean) => void;
  recentSessions: RecentSession[];
  backHomeButton: ReactNode;
}) {
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(["judaism", "buddhism", "both", "balanced"] as const).map((value) => (
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

        <SettingBlock icon={<BookOpen aria-hidden size={30} />} title="Favourite topics">
          <button className="large-button secondary-light w-full">
            <Heart aria-hidden size={28} />
            Manage favourites
          </button>
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
  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-full bg-white/55 px-5 text-[var(--navy)] shadow-sm">
      {tradition === "judaism" ? (
        <span className="magen scale-[0.45]" aria-hidden />
      ) : tradition === "both" ? (
        <Sparkles aria-hidden size={42} strokeWidth={1.5} />
      ) : (
        <Flower2 aria-hidden size={42} strokeWidth={1.5} />
      )}
      <span className="font-sans text-[24px] font-bold">{pathLabel(tradition)}</span>
    </div>
  );
}

function TopicIcon({ topic }: { topic: Topic }) {
  const size = 70;

  if (topic.visual === "bridge") {
    return <Heart aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  if (topic.visual === "compass" || topic.visual === "gate") {
    return <Sparkles aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

  if (topic.visual === "river") {
    return <Leaf aria-hidden className="relative z-10" size={size} strokeWidth={1.4} />;
  }

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

function pathLabel(tradition: Tradition) {
  return tradition === "both" ? "Both paths" : titleCase(tradition);
}

function primaryPathClass(tradition: Tradition) {
  if (tradition === "judaism") {
    return "primary-navy";
  }

  if (tradition === "both") {
    return "primary-bridge";
  }

  return "primary-gold";
}
