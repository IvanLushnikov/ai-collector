import { LlmAdapter, LlmTurnContext, LlmTurnResult } from './adapter.js';
import { assertToolAllowed, isLlmToolName, type LlmToolCall } from './tools.js';

export class FakeLlmAdapter implements LlmAdapter {
  constructor(private readonly toolCall: LlmToolCall | null = {
    name: 'end_call',
    arguments: { reason: 'sandbox' }
  }) {}

  async completeTurn(context: LlmTurnContext): Promise<LlmTurnResult> {
    if (this.toolCall) {
      if (!isLlmToolName(this.toolCall.name) || !context.allowedTools.includes(this.toolCall.name)) {
        return {
          assistantText: 'handoff',
          toolCall: { name: 'request_handoff', arguments: { reason: 'tool_not_allowed' } }
        };
      }

      assertToolAllowed(this.toolCall.name, context);
    }

    return {
      assistantText: 'ok',
      toolCall: this.toolCall
    };
  }
}
