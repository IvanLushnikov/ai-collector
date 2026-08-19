import type {
  RecordingStatus,
  TranscriptStatus
} from '../domain/call-lifecycle/index.js';

export type EvidenceGuardInput = {
  channel: 'live' | 'sandbox' | 'fake';
  answered: boolean;
  recordingStatus?: RecordingStatus | null;
  transcriptStatus?: TranscriptStatus | null;
};

export const hasCallEvidence = (
  input: Pick<EvidenceGuardInput, 'recordingStatus' | 'transcriptStatus'>
): boolean =>
  input.recordingStatus === 'ready' && input.transcriptStatus === 'ready';

export const shouldAutoPauseForMissingEvidence = (input: EvidenceGuardInput): boolean => {
  if (input.channel === 'sandbox' || input.channel === 'fake') {
    return false;
  }
  if (!input.answered) {
    return false;
  }
  return !hasCallEvidence(input);
};

export const missingEvidencePauseReason = 'recording_failed' as const;
