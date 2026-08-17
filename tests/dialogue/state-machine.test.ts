import { describe, expect, it } from 'vitest';
import {
  buildLlmTurnPayload,
  transitionDialogue,
  type DialogueSession
} from '../../src/dialogue/state-machine.js';

const session = (overrides: Partial<DialogueSession> = {}): DialogueSession => ({
  state: 'identity',
  identityVerified: false,
  debtAmount: 15000,
  ...overrides
});

describe('DialogueStateMachine', () => {
  it('does not include debtAmount in LLM context during identity', () => {
    const payload = buildLlmTurnPayload(session(), 'алло');
    expect(payload.debtAmount).toBeUndefined();
    expect(payload.identityVerified).toBe(false);
  });

  it('does not move to purpose until identity is verified', () => {
    expect(transitionDialogue(session({ state: 'disclosure', identityVerified: false }), {
      type: 'user_said',
      text: 'да это я'
    })).toBe('identity');

    expect(transitionDialogue(session({ state: 'disclosure', identityVerified: true }), {
      type: 'user_said',
      text: 'да это я'
    })).toBe('purpose');
  });

  it('moves to handoff when a human is requested', () => {
    expect(transitionDialogue(session({ state: 'purpose', identityVerified: true }), {
      type: 'handoff_requested'
    })).toBe('handoff');

    expect(transitionDialogue(session({ state: 'purpose', identityVerified: true }), {
      type: 'tool_result',
      tool: 'request_handoff',
      ok: true
    })).toBe('handoff');
  });
});
