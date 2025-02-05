export type ChatCompletionChunk = {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Choice[];
};

type Choice = {
  index: number;
  delta: Delta;
  finish_reason: string | null;
};

type Delta = {
  role?: string;
  content?: string;
};
