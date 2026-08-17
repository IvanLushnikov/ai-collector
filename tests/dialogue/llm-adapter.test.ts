import { describe, expect, it } from 'vitest';
import { FakeLlmAdapter } from '../../src/dialogue/llm/fake.js';
import { IdentityGateError, LLM_TOOLS } from '../../src/dialogue/llm/tools.js';

describe('FakeLlmAdapter', () => {
  it('exposes the allowlisted tools', () => {
    expect(LLM_TOOLS).toEqual([
      'set_outcome',
      'request_handoff',
      'schedule_callback',
      'end_call',
      'confirm_ptp'
    ]);
  });

  it('rejects confirm_ptp until identity is verified', async () => {
    const llm = new FakeLlmAdapter({
      name: 'confirm_ptp',
      arguments: { amount: 1000 }
    });

    await expect(llm.completeTurn({
      stateId: 'confirm',
      identityVerified: false,
      userText: 'да',
      allowedTools: [...LLM_TOOLS]
    })).rejects.toBeInstanceOf(IdentityGateError);
  });

  it('allows confirm_ptp after identityVerified', async () => {
    const llm = new FakeLlmAdapter({
      name: 'confirm_ptp',
      arguments: { amount: 1000 }
    });

    const result = await llm.completeTurn({
      stateId: 'confirm',
      identityVerified: true,
      userText: 'да',
      allowedTools: [...LLM_TOOLS]
    });

    expect(result.toolCall?.name).toBe('confirm_ptp');
  });
});
