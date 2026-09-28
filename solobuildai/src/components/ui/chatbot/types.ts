export type ChatMessageData = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  summary?: string[];
  activity?: {
    label: string;
    badge: string;
    steps: Array<{ label: string; status: string }>;
  };
};

export type ChatSolution = {
  name: string;
  tools: string[];
  actions: string[];
};