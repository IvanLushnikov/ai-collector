export type VoiceCallStatus =
  | 'queued'
  | 'ringing'
  | 'answered'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'voicemail'
  | 'busy'
  | 'transferred_to_handoff'
  | 'unknown';

export type StartCallInput = {
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  phone: string;
  idempotencyKey?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type StartCallResult = {
  providerCallId: string;
  status: VoiceCallStatus;
};

export type CallStatusResult = {
  providerCallId: string;
  status: VoiceCallStatus;
};

export type HangupCallResult = {
  providerCallId: string;
  status: VoiceCallStatus;
};

export type VendorCallStatus = string;

export type VoiceProviderCapabilities = {
  marking: boolean;
  recording: boolean;
  handoff: boolean;
  sandboxPass: boolean;
  checkedAt: Date;
};

export interface VoiceProviderAdapter {
  startCall(input: StartCallInput): Promise<StartCallResult>;

  getCallStatus(providerCallId: string): Promise<CallStatusResult>;

  hangupCall(providerCallId: string): Promise<HangupCallResult>;

  probeCapabilities(): Promise<VoiceProviderCapabilities>;

  mapVendorStatus?(status: VendorCallStatus): VoiceCallStatus;
}

export const voiceCallStatuses = [
  'queued',
  'ringing',
  'answered',
  'completed',
  'failed',
  'no_answer',
  'voicemail',
  'busy',
  'transferred_to_handoff',
  'unknown'
] as const;

export const completedCallStatuses: VoiceCallStatus[] = [
  'completed',
  'failed',
  'no_answer',
  'voicemail',
  'busy',
  'transferred_to_handoff'
];

export const isTerminalCallStatus = (status: VoiceCallStatus): boolean =>
  completedCallStatuses.includes(status);
