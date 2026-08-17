import { describe, expect, it } from 'vitest';
import { isPilotCapReached } from '../src/domain/campaign/pilot-cap.js';

describe('pilot daily call cap', () => {
  it('does not count sandbox or fake traffic', () => {
    expect(isPilotCapReached({ dailyCallCap: 1, startedToday: 9, channel: 'sandbox' })).toBe(false);
    expect(isPilotCapReached({ dailyCallCap: 1, startedToday: 9, channel: 'fake' })).toBe(false);
  });

  it('blocks a live path when the cap is reached', () => {
    expect(isPilotCapReached({ dailyCallCap: 2, startedToday: 2, channel: 'live' })).toBe(true);
    expect(isPilotCapReached({ dailyCallCap: 2, startedToday: 1, channel: 'live' })).toBe(false);
    expect(isPilotCapReached({ dailyCallCap: null, startedToday: 99, channel: 'live' })).toBe(false);
  });
});
