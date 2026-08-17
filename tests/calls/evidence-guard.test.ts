import { describe, expect, it } from 'vitest';
import { shouldAutoPauseForMissingEvidence } from '../../src/calls/evidence-guard.js';

describe('evidence guard', () => {
  it('pauses live answered calls without recording or transcript', () => {
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'live',
      answered: true,
      recordingUrl: null,
      transcriptUrl: 'sandbox://x'
    })).toBe(true);
  });

  it('does not pause fake sandbox even without evidence URLs', () => {
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'fake',
      answered: true
    })).toBe(false);
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'sandbox',
      answered: true,
      recordingUrl: 'sandbox://recordings/a.mp3',
      transcriptUrl: 'sandbox://transcripts/a.txt'
    })).toBe(false);
  });

  it('does not pause unanswered live calls', () => {
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'live',
      answered: false
    })).toBe(false);
  });
});
