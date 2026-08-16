export type CallAttemptStatus =
  | 'initiated'
  | 'queued'
  | 'ringing'
  | 'answered'
  | 'failed'
  | 'completed'
  | 'no_answer'
  | 'blocked';

export interface CallAttempt {
  id: string;
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  telephonyConnectionId: string;
  status: CallAttemptStatus;
  providerCallId: string;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
