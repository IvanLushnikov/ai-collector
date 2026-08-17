import { LlmToolCall } from './tools.js';

export type LlmTurnContext = {
  stateId: string;
  identityVerified: boolean;
  userText: string;
  allowedTools: string[];
};

export type LlmTurnResult = {
  assistantText: string;
  toolCall: LlmToolCall | null;
};

export interface LlmAdapter {
  completeTurn(context: LlmTurnContext): Promise<LlmTurnResult>;
}
