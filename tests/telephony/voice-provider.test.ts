import { describe, expect, it } from 'vitest';
import {
  isTerminalCallStatus,
  completedCallStatuses,
  voiceCallStatuses
} from '../../src/telephony/voice-provider/adapter.js';

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
});
