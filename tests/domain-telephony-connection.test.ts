import { describe, expect, it } from 'vitest';
import {
  applyTelephonyProbeResult,
  isProductionTelephonyProbeConfirmed
} from '../src/domain/telephony-connection/index.js';

describe('TelephonyConnection production probe', () => {
  it('does not confirm production when probe was never stored', () => {
    expect(isProductionTelephonyProbeConfirmed({
      mode: 'production',
      lastProbeAt: null,
      probeMarking: false,
      probeRecording: false,
      probeHandoff: false
    })).toBe(false);
  });

  it('does not treat sandboxPass as live marking for production', () => {
    const stored = applyTelephonyProbeResult({
      marking: false,
      recording: false,
      handoff: false,
      sandboxPass: true,
      checkedAt: new Date('2026-08-17T10:00:00.000Z')
    });

    expect(stored.probeMarking).toBe(false);
    expect(stored.probeRecording).toBe(false);
    expect(stored.probeHandoff).toBe(false);
    expect(stored.lastProbeAt).toEqual(new Date('2026-08-17T10:00:00.000Z'));
    expect(isProductionTelephonyProbeConfirmed({
      mode: 'production',
      ...stored
    })).toBe(false);
  });

  it('confirms production only when marking, recording and handoff are true', () => {
    const stored = applyTelephonyProbeResult({
      marking: true,
      recording: true,
      handoff: true,
      sandboxPass: false,
      checkedAt: new Date('2026-08-17T10:00:00.000Z')
    });

    expect(isProductionTelephonyProbeConfirmed({
      mode: 'production',
      ...stored
    })).toBe(true);
  });

  it('does not require live marking for sandbox connections', () => {
    expect(isProductionTelephonyProbeConfirmed({
      mode: 'sandbox',
      lastProbeAt: null,
      probeMarking: false,
      probeRecording: false,
      probeHandoff: false
    })).toBe(true);
  });
});
