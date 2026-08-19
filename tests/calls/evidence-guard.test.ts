import { describe, expect, it } from 'vitest';
import { shouldAutoPauseForMissingEvidence } from '../../src/calls/evidence-guard.js';

describe('evidence guard', () => {
  it('pauses live answered calls without recording or transcript', () => {
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'live',
      answered: true,
      recordingStatus: 'missing',
      transcriptStatus: 'ready'
    })).toBe(true);
  });

  it('does not pause fake sandbox even without ready evidence', () => {
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'fake',
      answered: true,
      recordingStatus: 'missing',
      transcriptStatus: 'failed'
    })).toBe(false);
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'sandbox',
      answered: true,
      recordingStatus: 'ready',
      transcriptStatus: 'ready'
    })).toBe(false);
  });

  it('does not pause answered live calls when recording and transcript are ready', () => {
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'live',
      answered: true,
      recordingStatus: 'ready',
      transcriptStatus: 'ready'
    })).toBe(false);
  });

  it('does not pause unanswered live calls', () => {
    expect(shouldAutoPauseForMissingEvidence({
      channel: 'live',
      answered: false,
      recordingStatus: 'none',
      transcriptStatus: 'none'
    })).toBe(false);
  });
});
