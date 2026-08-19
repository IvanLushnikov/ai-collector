import type { VoiceCallStatus } from '../../telephony/voice-provider/adapter.js';
import type { CallAttemptStatus } from '../call-attempt/index.js';

export type CallDialStatus =
  | 'created'
  | 'queued'
  | 'dialing'
  | 'ringing'
  | 'answered'
  | 'in_conversation'
  | 'handoff_requested'
  | 'transferred_to_handoff'
  | 'completed'
  | 'no_answer'
  | 'busy'
  | 'voicemail'
  | 'failed'
  | 'cancelled'
  | 'blocked'
  | 'unknown';

export type TranscriptStatus = 'none' | 'pending' | 'processing' | 'ready' | 'failed';

export type RecordingStatus = 'none' | 'pending' | 'ready' | 'failed' | 'missing';

export type ConversationStatus =
  | 'not_started'
  | 'in_progress'
  | 'awaiting_recording'
  | 'awaiting_transcription'
  | 'transcribed'
  | 'transcription_failed'
  | 'recording_missing'
  | 'review_required'
  | 'finalized';

export const normalizeVoiceStatus = (status: VoiceCallStatus): CallDialStatus => {
  switch (status) {
    case 'queued': return 'queued';
    case 'ringing': return 'ringing';
    case 'answered': return 'answered';
    case 'completed': return 'completed';
    case 'no_answer': return 'no_answer';
    case 'voicemail': return 'voicemail';
    case 'busy': return 'busy';
    case 'failed': return 'failed';
    case 'transferred_to_handoff': return 'transferred_to_handoff';
    default: return 'unknown';
  }
};

export const deriveConversationStatus = (input: {
  dialStatus: CallDialStatus;
  recordingStatus: RecordingStatus;
  transcriptStatus: TranscriptStatus;
  reviewRequired: boolean;
}): ConversationStatus => {
  if (input.reviewRequired) return 'review_required';
  if (input.dialStatus === 'answered' || input.dialStatus === 'in_conversation') return 'in_progress';
  if (input.recordingStatus === 'missing') return 'recording_missing';
  if (
    input.recordingStatus === 'ready'
    && (input.transcriptStatus === 'pending' || input.transcriptStatus === 'processing')
  ) return 'awaiting_transcription';
  if (input.transcriptStatus === 'failed') return 'transcription_failed';
  if (input.transcriptStatus === 'ready') return 'transcribed';
  return 'finalized';
};

export const summarizeAttemptStatus = (input: {
  dialStatus: CallDialStatus;
}): CallAttemptStatus => {
  switch (input.dialStatus) {
    case 'queued': return 'queued';
    case 'ringing': return 'ringing';
    case 'answered':
    case 'in_conversation': return 'answered';
    case 'completed': return 'completed';
    case 'no_answer':
    case 'voicemail': return 'no_answer';
    case 'blocked': return 'blocked';
    case 'busy':
    case 'failed':
    case 'transferred_to_handoff':
    case 'unknown': return 'failed';
    default: return 'initiated';
  }
};
