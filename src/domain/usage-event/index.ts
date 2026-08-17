export type UsageEventType =
  | 'call_started'
  | 'call_completed'
  | 'call_failed'
  | 'handoff'
  | 'transcript_generated'
  | 'asr_units'
  | 'tts_units'
  | 'llm_units';

export type UsageCredentialMode = 'platform' | 'byok' | 'fake';

export interface UsageEvent {
  id: string;
  tenantId: string;
  campaignId: string;
  eventType: UsageEventType;
  quantity: number;
  unit: string;
  sourceId: string;
  credentialMode: UsageCredentialMode;
  occurredAt: Date;
  createdAt: Date;
}

export interface UsageLedgerItem {
  eventType: UsageEventType;
  quantity: number;
  unit: string;
  occurredAt: string | Date;
}
