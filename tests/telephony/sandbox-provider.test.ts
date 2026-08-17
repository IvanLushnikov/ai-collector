import { expect, it, describe } from 'vitest';
import { SandboxVoiceProvider } from '../../src/telephony/sandbox-provider/index.js';

describe('SandboxVoiceProvider', () => {
  it('returns stable providerCallId for same start payload', async () => {
    const provider = new SandboxVoiceProvider();
    const input = {
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: '22222222-2222-2222-2222-222222222222',
      debtorRecordId: '33333333-3333-3333-3333-333333333333',
      phone: '+79501234567'
    };

    const first = await provider.startCall(input);
    const second = await provider.startCall(input);

    expect(first.providerCallId).toBe(second.providerCallId);
    expect(first.status).toBe('queued');
  });

  it('produces predictable call status flow', async () => {
    const provider = new SandboxVoiceProvider({
      initialStatus: 'ringing',
      statusFlow: ['ringing', 'answered', 'completed']
    });

    const call = await provider.startCall({
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: '22222222-2222-2222-2222-222222222222',
      debtorRecordId: '44444444-4444-4444-4444-444444444444',
      phone: '+79990001122'
    });

    expect(call.status).toBe('ringing');

    const statusAfterFirstPoll = await provider.getCallStatus(call.providerCallId);
    expect(statusAfterFirstPoll.status).toBe('answered');

    const statusAfterSecondPoll = await provider.getCallStatus(call.providerCallId);
    expect(statusAfterSecondPoll.status).toBe('completed');
  });

  it('probes sandbox capabilities without claiming live marking', async () => {
    const provider = new SandboxVoiceProvider();
    const capabilities = await provider.probeCapabilities();

    expect(capabilities).toEqual({
      marking: false,
      recording: false,
      handoff: false,
      sandboxPass: true,
      checkedAt: expect.any(Date)
    });
  });
});
