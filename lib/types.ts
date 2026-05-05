export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Chat {
  title: string;
  messages: Message[];
}
