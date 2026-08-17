export type EvidenceGuardInput = {
  channel: 'live' | 'sandbox' | 'fake';
  answered: boolean;
  recordingUrl?: string | null;
  transcriptUrl?: string | null;
};

export const hasCallEvidence = (input: Pick<EvidenceGuardInput, 'recordingUrl' | 'transcriptUrl'>): boolean =>
  Boolean(input.recordingUrl && input.transcriptUrl);

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
