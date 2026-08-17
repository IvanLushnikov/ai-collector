import { describe, expect, it } from 'vitest';
import { MangoNotConfiguredError, MangoVoiceProvider } from '../../src/telephony/mango/index.js';
import { createVoiceProviderResolver } from '../../src/telephony/voice-provider/resolver.js';

describe('MangoVoiceProvider', () => {
  it('maps typical Mango vendor statuses without leaking vendor fields', () => {
    const provider = new MangoVoiceProvider({ apiKey: 'test', apiSalt: 'salt' });

    expect(provider.mapVendorStatus('queued')).toBe('queued');
    expect(provider.mapVendorStatus('ringing')).toBe('ringing');
    expect(provider.mapVendorStatus('connected')).toBe('answered');
    expect(provider.mapVendorStatus('completed')).toBe('completed');
    expect(provider.mapVendorStatus('busy')).toBe('busy');
    expect(provider.mapVendorStatus('no-answer')).toBe('no_answer');
    expect(provider.mapVendorStatus('failed')).toBe('failed');
    expect(provider.mapVendorStatus('voicemail')).toBe('voicemail');
    expect(provider.mapVendorStatus('transferred')).toBe('transferred_to_handoff');
    expect(provider.mapVendorStatus('mango-raw-code')).toBe('unknown');
  });

  it('throws a deterministic not configured error when credentials are missing', async () => {
    const provider = new MangoVoiceProvider({ apiKey: '', apiSalt: '' });

    await expect(provider.startCall({
      tenantId: 'tenant-1',
      campaignId: 'campaign-1',
      debtorRecordId: 'debtor-1',
      phone: '+79000000000'
    })).rejects.toBeInstanceOf(MangoNotConfiguredError);
  });

  it('can be selected by the voice provider resolver', () => {
    const mango = new MangoVoiceProvider({ apiKey: '', apiSalt: '' });
    const resolver = createVoiceProviderResolver({ mango });

    expect(resolver.resolve('mango')).toBe(mango);
  });
});
