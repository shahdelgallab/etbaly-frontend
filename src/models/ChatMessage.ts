// ─── Chat Roles ───────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

// ─── Chat Message ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Base64 or URL of an image the user uploaded */
  imageUrl?: string;
  /** URL to a generated .glb model returned by the AI */
  modelUrl?: string;
  /** Set to true/false after the user confirms or rejects the model */
  confirmed?: boolean;
  /** Whether this message is still being streamed */
  isStreaming?: boolean;
  timestamp: Date;
}

// ─── Chat Session ─────────────────────────────────────────────────────────────

export type ChatStep = 'input' | 'confirm' | 'done';

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  step: ChatStep;
  /** The model URL currently pending user confirmation */
  pendingModelUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── AI Request / Response ────────────────────────────────────────────────────

export interface AiChatRequest {
  text?: string;
  /** Base64-encoded image */
  imageBase64?: string;
  sessionId?: string;
}

export interface AiChatResponse {
  message: string;
  modelUrl?: string;
  productId?: string;
  sessionId: string;
}
