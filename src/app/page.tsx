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
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Timer,
  Users,
  Volume2,
  X,
} from "lucide-react";
import Image from "next/image";
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
  const [topicSource, setTopicSource] = useState<"gemini" | "fallback">("fallback");
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
  const [traditionBias, setTraditionBias] = useState<"judaism" | "buddhism" | "balanced">(
    "balanced",
  );
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

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

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

  async function loadTopics(nextTradition: Tradition) {
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
        body: JSON.stringify({ tradition: nextTradition }),
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

  async function chooseTopic(topic: Topic, autoStart = false) {
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
      if (autoStart) {
        playCurrentScript(data.script);
      }
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
      loadTopics("judaism");
      return;
    }

    if (traditionBias === "buddhism") {
      loadTopics("buddhism");
      return;
    }

    loadTopics(Math.random() > 0.5 ? "judaism" : "buddhism");
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
            onRefresh={() => loadTopics(tradition)}
            onChooseTopic={chooseTopic}
          />
        )}

        {screen === "lesson" && (
          <LessonScreen
            topic={selectedTopic}
            lesson={lesson}
            isLoading={isLoadingLesson}
            error={error}
            mode={mode}
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
          onClick={onSettings}
          aria-label="Open menu"
          title="Open menu"
        />
        <button
          className="landing-hotspot landing-hotspot-settings"
          onClick={onSettings}
          aria-label="Open settings"
          title="Open settings"
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
  onChooseTopic,
}: {
  tradition: Tradition;
  topics: Topic[];
  topicSource: "gemini" | "fallback";
  persisted: boolean;
  isLoading: boolean;
  error: string | null;
  mode: SessionMode;
  setMode: (mode: SessionMode) => void;
  onBack: () => void;
  onRefresh: () => void;
  onChooseTopic: (topic: Topic, autoStart?: boolean) => void;
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
          {titleCase(tradition)} - Today&apos;s reflections
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
                  <TopicIcon topic={topic} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-[28px] font-bold leading-tight text-[var(--navy)]">
                    {topic.title}
                  </h2>
                  <p className="mt-3 flex-1 font-sans text-[21px] leading-snug">
                    {topic.summary}
                  </p>
                  <div className="mt-5 grid gap-3">
                    <button
                      className="large-button secondary-light w-full"
                      onClick={() => onChooseTopic(topic, true)}
                    >
                      <Volume2 aria-hidden size={28} />
                      Listen now
                    </button>
                    <button
                      className={`large-button w-full ${
                        tradition === "judaism" ? "primary-navy" : "primary-gold"
                      }`}
                      onClick={() => onChooseTopic(topic, false)}
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
            {topicSource === "gemini" ? "Fresh reflections" : "Gentle starter reflections"}
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
  mode,
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
  mode: SessionMode;
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
        <div className="mb-3 flex justify-center">
          <span className="rounded-full bg-white/70 px-5 py-3 font-sans text-[22px] font-bold text-[var(--navy)] shadow-sm">
            {modeLabel(mode)}
          </span>
        </div>
        <h1 className="text-center text-[48px] font-bold leading-tight text-[var(--navy)]">
          {lesson?.title || topic?.title || "Preparing today's lesson"}
        </h1>

        <div className="lesson-art mt-7 flex items-center justify-center">
          {isLoading ? (
            <RefreshCw className="animate-spin text-[var(--gold)]" size={66} />
          ) : (
            <button
              className="large-button primary-navy min-h-[104px] min-w-[104px] rounded-full"
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
            Preparing the words. The browser voice will be ready right away.
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
  traditionBias: "judaism" | "buddhism" | "balanced";
  setTraditionBias: (value: "judaism" | "buddhism" | "balanced") => void;
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
      ) : (
        <Flower2 aria-hidden size={42} strokeWidth={1.5} />
      )}
      <span className="font-sans text-[24px] font-bold">{titleCase(tradition)}</span>
    </div>
  );
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
