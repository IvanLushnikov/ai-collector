import { describe, expect, it } from 'vitest';
import { ExolveNotConfiguredError, ExolveVoiceProvider } from '../../src/telephony/exolve/index.js';

describe('ExolveVoiceProvider', () => {
  it('maps typical Exolve vendor statuses without leaking vendor fields', () => {
    const provider = new ExolveVoiceProvider({ apiKey: 'test', applicationId: 'app' });

    expect(provider.mapVendorStatus('queued')).toBe('queued');
    expect(provider.mapVendorStatus('ringing')).toBe('ringing');
    expect(provider.mapVendorStatus('in-progress')).toBe('answered');
    expect(provider.mapVendorStatus('completed')).toBe('completed');
    expect(provider.mapVendorStatus('busy')).toBe('busy');
    expect(provider.mapVendorStatus('no-answer')).toBe('no_answer');
    expect(provider.mapVendorStatus('failed')).toBe('failed');
    expect(provider.mapVendorStatus('voicemail')).toBe('voicemail');
    expect(provider.mapVendorStatus('transferred')).toBe('transferred_to_handoff');
    expect(provider.mapVendorStatus('something-vendor-specific')).toBe('unknown');
  });

  it('throws a deterministic not configured error when env credentials are missing', async () => {
    const provider = new ExolveVoiceProvider({ apiKey: '', applicationId: '' });

    await expect(provider.startCall({
      tenantId: 'tenant-1',
      campaignId: 'campaign-1',
      debtorRecordId: 'debtor-1',
      phone: '+79000000000'
    })).rejects.toBeInstanceOf(ExolveNotConfiguredError);

    await expect(provider.getCallStatus('call-1')).rejects.toBeInstanceOf(ExolveNotConfiguredError);
    await expect(provider.hangupCall('call-1')).rejects.toBeInstanceOf(ExolveNotConfiguredError);
  });

  it('does not claim live marking when probing without a network call', async () => {
    const provider = new ExolveVoiceProvider({ apiKey: '', applicationId: '' });
    const capabilities = await provider.probeCapabilities();

    expect(capabilities).toMatchObject({
      marking: false,
      recording: false,
      handoff: false,
      sandboxPass: false
    });
    expect(capabilities.checkedAt).toBeInstanceOf(Date);
  });
});
