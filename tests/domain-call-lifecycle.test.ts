import { describe, expect, it } from 'vitest';
import {
  normalizeVoiceStatus,
  deriveConversationStatus
} from '../src/domain/call-lifecycle/index.js';

describe('call lifecycle state model', () => {
  it('maps provider statuses into canonical dial statuses', () => {
    expect(normalizeVoiceStatus('queued')).toBe('queued');
    expect(normalizeVoiceStatus('ringing')).toBe('ringing');
    expect(normalizeVoiceStatus('answered')).toBe('answered');
    expect(normalizeVoiceStatus('transferred_to_handoff')).toBe('transferred_to_handoff');
    expect(normalizeVoiceStatus('unknown')).toBe('unknown');
  });

  it('derives evidence status after an answered call without transcript', () => {
    expect(deriveConversationStatus({
      dialStatus: 'completed',
      recordingStatus: 'ready',
      transcriptStatus: 'processing',
      reviewRequired: false
    })).toBe('awaiting_transcription');
  });

  it('marks answered live call without recording as recording_missing', () => {
    expect(deriveConversationStatus({
      dialStatus: 'completed',
      recordingStatus: 'missing',
      transcriptStatus: 'none',
      reviewRequired: false
    })).toBe('recording_missing');
  });
});
