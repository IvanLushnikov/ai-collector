import {
  VoiceProviderAdapter,
  VoiceProviderCapabilities,
  VoiceCallStatus,
  StartCallInput,
  StartCallResult,
  CallStatusResult,
  HangupCallResult,
  VendorCallStatus
} from '../voice-provider/adapter.js';

/**
 * Backup live-provider stub only (ADR 0003). Not the Controlled Pilot primary.
 * Keep module for commercial fork; do not prefer over Exolve in resolver defaults.
 */
export class MangoNotConfiguredError extends Error {
  constructor() {
    super('not configured');
    this.name = 'MangoNotConfiguredError';
  }
}

export type MangoVoiceProviderConfig = {
  apiKey?: string;
  apiSalt?: string;
};

const MANGO_STATUS_MAP: Record<string, VoiceCallStatus> = {
  queued: 'queued',
  ringing: 'ringing',
  connected: 'answered',
  answered: 'answered',
  completed: 'completed',
  busy: 'busy',
  'no-answer': 'no_answer',
  failed: 'failed',
  voicemail: 'voicemail',
  transferred: 'transferred_to_handoff'
};

export class MangoVoiceProvider implements VoiceProviderAdapter {
  constructor(private readonly config: MangoVoiceProviderConfig = {
    apiKey: process.env.MANGO_API_KEY,
    apiSalt: process.env.MANGO_API_SALT
  }) {}

  private assertConfigured(): void {
    if (!this.config.apiKey || !this.config.apiSalt) {
      throw new MangoNotConfiguredError();
    }
  }

  async startCall(_input: StartCallInput): Promise<StartCallResult> {
    this.assertConfigured();
    throw new MangoNotConfiguredError();
  }

  async getCallStatus(_providerCallId: string): Promise<CallStatusResult> {
    this.assertConfigured();
    throw new MangoNotConfiguredError();
  }

  async hangupCall(_providerCallId: string): Promise<HangupCallResult> {
    this.assertConfigured();
    throw new MangoNotConfiguredError();
  }

  async probeCapabilities(): Promise<VoiceProviderCapabilities> {
    return {
      marking: false,
      recording: false,
      handoff: false,
      sandboxPass: false,
      checkedAt: new Date()
    };
  }

  mapVendorStatus(status: VendorCallStatus): VoiceCallStatus {
    return MANGO_STATUS_MAP[status] ?? 'unknown';
  }
}
