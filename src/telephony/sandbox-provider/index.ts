import {
  VoiceCallStatus,
  VoiceProviderAdapter,
  VoiceProviderCapabilities,
  StartCallInput,
  StartCallResult,
  CallStatusResult,
  HangupCallResult,
  completedCallStatuses,
  isTerminalCallStatus
} from '../voice-provider/adapter.js';

type SandboxCallRecord = {
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  phone: string;
  status: VoiceCallStatus;
  statusTick: number;
};

type SandboxVoiceProviderConfig = {
  initialStatus?: VoiceCallStatus;
  statusFlow?: VoiceCallStatus[];
  finalHangupStatus?: VoiceCallStatus;
};

const buildStableCallId = (input: StartCallInput): string => {
  const tenantKey = encodeURIComponent(input.tenantId);
  const campaignKey = encodeURIComponent(input.campaignId);
  const debtorKey = encodeURIComponent(input.debtorRecordId);
  return `sandbox-call-${tenantKey}-${campaignKey}-${debtorKey}`;
};

export class SandboxVoiceProvider implements VoiceProviderAdapter {
  private readonly calls = new Map<string, SandboxCallRecord>();

  constructor(private readonly config: SandboxVoiceProviderConfig = {}) {}

  async startCall(input: StartCallInput): Promise<StartCallResult> {
    const providerCallId = buildStableCallId(input);
    const initialStatus = this.resolveStatus(this.config.initialStatus ?? 'queued');

    const statusFlow = this.getStatusFlow(this.config.statusFlow, initialStatus);
    const status = statusFlow[0] ?? 'queued';

    this.calls.set(providerCallId, {
      tenantId: input.tenantId,
      campaignId: input.campaignId,
      debtorRecordId: input.debtorRecordId,
      phone: input.phone,
      status,
      statusTick: 0
    });

    return {
      providerCallId,
      status
    };
  }

  async getCallStatus(providerCallId: string): Promise<CallStatusResult> {
    const call = this.calls.get(providerCallId);
    if (!call) {
      return {
        providerCallId,
        status: 'failed'
      };
    }

    const statusFlow = this.getStatusFlow(this.config.statusFlow, this.config.initialStatus ?? 'queued');
    const nextStatus = statusFlow[Math.min(call.statusTick + 1, statusFlow.length - 1)] ?? call.status;

    if (!isTerminalCallStatus(call.status)) {
      call.statusTick += 1;
      call.status = nextStatus;
      this.calls.set(providerCallId, call);
    }

    return {
      providerCallId,
      status: call.status
    };
  }

  async hangupCall(providerCallId: string): Promise<HangupCallResult> {
    const call = this.calls.get(providerCallId);
    if (!call) {
      return {
        providerCallId,
        status: 'failed'
      };
    }

    call.status = this.resolveStatus(this.config.finalHangupStatus ?? 'completed');
    call.statusTick = this.getStatusFlow(this.config.statusFlow, this.config.initialStatus ?? 'queued').length;
    this.calls.set(providerCallId, call);

    return {
      providerCallId,
      status: call.status
    };
  }

  mapVendorStatus(status: string): VoiceCallStatus {
    return this.resolveStatus(status);
  }

  async probeCapabilities(): Promise<VoiceProviderCapabilities> {
    return {
      marking: false,
      recording: false,
      handoff: false,
      sandboxPass: true,
      checkedAt: new Date()
    };
  }

  private getStatusFlow(configuredStatusFlow: VoiceCallStatus[] | undefined, initialStatus: VoiceCallStatus): VoiceCallStatus[] {
    const statusFlow = configuredStatusFlow?.length
      ? configuredStatusFlow
      : [initialStatus, 'ringing', 'answered', 'completed'];

    const normalized = statusFlow.map((status) => this.resolveStatus(status));

    if (!normalized.includes(initialStatus)) {
      normalized[0] = initialStatus;
    }

    if (!completedCallStatuses.some((status) => normalized.includes(status))) {
      normalized.push('completed');
    }

    return normalized;
  }

  private resolveStatus(status: string): VoiceCallStatus {
    if (status === 'queued') {
      return 'queued';
    }
    if (status === 'ringing') {
      return 'ringing';
    }
    if (status === 'answered') {
      return 'answered';
    }
    if (status === 'completed') {
      return 'completed';
    }
    if (status === 'failed') {
      return 'failed';
    }
    if (status === 'no_answer') {
      return 'no_answer';
    }
    if (status === 'voicemail') {
      return 'voicemail';
    }
    if (status === 'busy') {
      return 'busy';
    }
    if (status === 'transferred_to_handoff') {
      return 'transferred_to_handoff';
    }

    return 'unknown';
  }
}
