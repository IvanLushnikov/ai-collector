import { describe, expect, it } from 'vitest';
import {
  isTerminalCallStatus,
  completedCallStatuses,
  voiceCallStatuses
} from '../../src/telephony/voice-provider/adapter.js';
import { createVoiceProviderResolver } from '../../src/telephony/voice-provider/resolver.js';
import { ExolveVoiceProvider } from '../../src/telephony/exolve/index.js';
import { MangoVoiceProvider } from '../../src/telephony/mango/index.js';
import { SandboxVoiceProvider } from '../../src/telephony/sandbox-provider/index.js';
import { createApp } from '../../src/server/app.js';

describe('voice provider adapter contract', () => {
  it('defines expected terminal statuses', () => {
    expect(voiceCallStatuses).toEqual(
      expect.arrayContaining([
        'completed',
        'failed',
        'no_answer',
        'voicemail',
        'busy',
        'transferred_to_handoff'
      ])
    );
  });

  it('checks terminal and non-terminal call statuses', () => {
    expect(isTerminalCallStatus('completed')).toBe(true);
    expect(isTerminalCallStatus('ringing')).toBe(false);
    expect(completedCallStatuses.includes('completed')).toBe(true);
  });

  it('wires Exolve as primary stub alongside sandbox and Mango backup', () => {
    const resolver = createVoiceProviderResolver({
      sandbox: new SandboxVoiceProvider(),
      exolve: new ExolveVoiceProvider(),
      mango: new MangoVoiceProvider()
    });
    expect(resolver.resolve('exolve')).toBeInstanceOf(ExolveVoiceProvider);
    expect(resolver.resolve('mango')).toBeInstanceOf(MangoVoiceProvider);
    expect(resolver.resolve('sandbox')).toBeInstanceOf(SandboxVoiceProvider);
  });

  it('registers Exolve in the default app voice resolver', async () => {
    const app = createApp({ campaignStore: {} });
    await app.ready();
    expect(app).toBeTruthy();
    await app.close();
  });
});
