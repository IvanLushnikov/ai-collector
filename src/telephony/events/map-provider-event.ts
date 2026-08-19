import {
  normalizeVoiceStatus,
  type CallDialStatus
} from '../../domain/call-lifecycle/index.js';
import type { VoiceCallStatus } from '../voice-provider/adapter.js';

const providerStatusAliases: Record<string, VoiceCallStatus> = {
  queued: 'queued',
  ringing: 'ringing',
  connected: 'answered',
  'in-progress': 'answered',
  completed: 'completed',
  busy: 'busy',
  'no-answer': 'no_answer',
  voicemail: 'voicemail',
  transferred: 'transferred_to_handoff'
};

export const mapProviderEventStatus = (rawStatus: string): CallDialStatus =>
  normalizeVoiceStatus(providerStatusAliases[rawStatus] ?? 'unknown');
