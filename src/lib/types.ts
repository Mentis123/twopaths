export type Tradition = "judaism" | "buddhism" | "both";

export type SessionMode = "listen" | "story" | "quiz";

export type VoiceId = "ara" | "sal" | "leo";

export type SourceLink = {
  title: string;
  url: string;
  note: string;
};

export type Topic = {
  id: string;
  tradition: Tradition;
  title: string;
  summary: string;
  difficulty: "gentle" | "medium";
  visual:
    | "candles"
    | "teacher"
    | "scroll"
    | "seedling"
    | "stones"
    | "mountain"
    | "tree"
    | "lotus"
    | "bridge"
    | "compass"
    | "gate"
    | "river";
  cluster?: string;
  keyLine?: string;
  sourceTitle?: string;
  researchId?: string;
  imageUrl?: string;
};

export type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
  response: string;
  textAudioUrl?: string;
  responseAudioUrl?: string;
};

export type QuizQuestion = {
  prompt: string;
  promptAudioUrl?: string;
  hint: string;
  hintAudioUrl?: string;
  options: QuizOption[];
};

export type LessonSession = {
  id: string;
  tradition: Tradition;
  topic: Topic;
  mode: SessionMode;
  title: string;
  script: string;
  segments: string[];
  question: QuizQuestion;
  closing: {
    takeaway: string;
    takeawayAudioUrl?: string;
    reflection: string;
    reflectionAudioUrl?: string;
    line: string;
    lineAudioUrl?: string;
  };
  sources?: SourceLink[];
  themes?: string[];
  audioUrl: string | null;
  audioAvailable: boolean;
  voiceId?: VoiceId;
  narrationProvider?: "xai" | "gemini" | "browser";
  persisted: boolean;
  generatedBy: "gemini" | "fallback" | "trove";
};

export type TopicResponse = {
  topics: Topic[];
  generatedBy: "gemini" | "fallback" | "trove";
  persisted: boolean;
};
