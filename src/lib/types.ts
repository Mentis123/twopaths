export type Tradition = "judaism" | "buddhism" | "both";

export type SessionMode = "listen" | "story" | "quiz";

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
};

export type QuizQuestion = {
  prompt: string;
  hint: string;
  options: QuizOption[];
};

export type LessonSession = {
  id: string;
  tradition: Tradition;
  topic: Topic;
  mode: SessionMode;
  title: string;
  script: string;
  simplifiedScript: string;
  segments: string[];
  question: QuizQuestion;
  closing: {
    takeaway: string;
    reflection: string;
    line: string;
  };
  sources?: SourceLink[];
  themes?: string[];
  audioUrl: string | null;
  audioAvailable: boolean;
  persisted: boolean;
  generatedBy: "gemini" | "fallback" | "trove";
};

export type TopicResponse = {
  topics: Topic[];
  generatedBy: "gemini" | "fallback" | "trove";
  persisted: boolean;
};
