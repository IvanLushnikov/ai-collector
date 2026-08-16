export type CallResultOutcome =
  | 'not_called'
  | 'no_answer'
  | 'callback_requested'
  | 'wrong_number'
  | 'ptp_created'
  | 'handoff'
  | 'dispute'
  | 'blocked'
  | 'error';

export type CallResultQaStatus = 'not_reviewed' | 'approved' | 'flagged';

const validQaStatuses: CallResultQaStatus[] = ['not_reviewed', 'approved', 'flagged'];

export const isCallResultQaStatus = (value: unknown): value is CallResultQaStatus => (
  typeof value === 'string' && validQaStatuses.includes(value as CallResultQaStatus)
);

export interface CallResult {
  id: string;
  tenantId: string;
  callAttemptId: string;
  outcome: CallResultOutcome;
  qaStatus: CallResultQaStatus;
  ptpAmount?: number;
  ptpDate?: Date;
  reason?: string;
  transcriptUrl?: string;
  recordingUrl?: string;
  createdAt: Date;
}
