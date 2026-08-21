import type { OutboxEvent } from './outbox.js';

/**
 * Pilot deliverer: known domain events are acknowledged without external HTTP.
 * Unknown types fail closed so they surface via retry/dead-letter.
 * Live provider/webhook forward stays blocked until legal/DPA + T-149.
 */
export const PILOT_ACK_EVENT_TYPES = [
  'campaign.created',
  'campaign.status_changed',
  'campaign.safe_resumed',
  'telephony_connection.created',
  'telephony_connection.updated',
  'script_version.created',
  'provider_credential.created'
] as const;

export type PilotAckEventType = (typeof PILOT_ACK_EVENT_TYPES)[number];

export const isPilotAckEventType = (eventType: string): eventType is PilotAckEventType =>
  (PILOT_ACK_EVENT_TYPES as readonly string[]).includes(eventType);

export const createPilotOutboxDeliverer = () =>
  async (event: OutboxEvent): Promise<void> => {
    if (isPilotAckEventType(event.eventType)) {
      return;
    }
    throw new Error(`UNKNOWN_OUTBOX_EVENT_TYPE:${event.eventType}`);
  };
