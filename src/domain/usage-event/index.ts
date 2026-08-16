export type UsageEventType =
  | 'call_started'
  | 'call_completed'
  | 'call_failed'
  | 'handoff'
  | 'transcript_generated';

export interface UsageEvent {
  id: string;
  tenantId: string;
  campaignId: string;
  eventType: UsageEventType;
  quantity: number;
  unit: string;
  sourceId: string;
  occurredAt: Date;
  createdAt: Date;
}

export interface UsageLedgerItem {
  eventType: UsageEventType;
  quantity: number;
  unit: string;
  occurredAt: string | Date;
}
