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
  scriptVersionId?: string | null;
  status: CallAttemptStatus;
  providerCallId: string;
  identityVerified?: boolean;
  identityVerifiedAt?: Date | null;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
