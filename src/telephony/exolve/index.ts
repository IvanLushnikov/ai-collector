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

export class ExolveNotConfiguredError extends Error {
  constructor() {
    super('not configured');
    this.name = 'ExolveNotConfiguredError';
  }
}

export type ExolveVoiceProviderConfig = {
  apiKey?: string;
  applicationId?: string;
};

const EXOLVE_STATUS_MAP: Record<string, VoiceCallStatus> = {
  queued: 'queued',
  ringing: 'ringing',
  'in-progress': 'answered',
  answered: 'answered',
  completed: 'completed',
  busy: 'busy',
  'no-answer': 'no_answer',
  failed: 'failed',
  voicemail: 'voicemail',
  transferred: 'transferred_to_handoff'
};

export class ExolveVoiceProvider implements VoiceProviderAdapter {
  constructor(private readonly config: ExolveVoiceProviderConfig = {
    apiKey: process.env.EXOLVE_API_KEY,
    applicationId: process.env.EXOLVE_APPLICATION_ID
  }) {}

  private assertConfigured(): void {
    if (!this.config.apiKey || !this.config.applicationId) {
      throw new ExolveNotConfiguredError();
    }
  }

  async startCall(_input: StartCallInput): Promise<StartCallResult> {
    this.assertConfigured();
    throw new ExolveNotConfiguredError();
  }

  async getCallStatus(_providerCallId: string): Promise<CallStatusResult> {
    this.assertConfigured();
    throw new ExolveNotConfiguredError();
  }

  async hangupCall(_providerCallId: string): Promise<HangupCallResult> {
    this.assertConfigured();
    throw new ExolveNotConfiguredError();
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
    return EXOLVE_STATUS_MAP[status] ?? 'unknown';
  }
}
