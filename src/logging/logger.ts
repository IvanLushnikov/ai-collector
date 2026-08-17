import { maskSensitiveFields } from './mask.js';

export type SafeLogFields = {
  requestId?: string;
  tenantId?: string;
  campaignId?: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  error?: { name: string; message: string };
};

const BLOCKED_KEYS = new Set(['phone', 'phoneNumber', 'debtAmount', 'apiKey', 'ciphertext']);

export const serializeUnknownError = (error: unknown): { name: string; message: string } => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: 'Error', message: 'unknown error' };
};

export const createSafeLogRecord = (
  fields: Omit<SafeLogFields, 'error'> & { error?: unknown; extra?: Record<string, unknown> }
): SafeLogFields => {
  const extra = fields.extra ? maskSensitiveFields(fields.extra) : undefined;
  if (extra) {
    for (const key of Object.keys(extra)) {
      if (BLOCKED_KEYS.has(key)) {
        delete extra[key];
      }
    }
  }

  return {
    requestId: fields.requestId,
    tenantId: fields.tenantId,
    campaignId: fields.campaignId,
    level: fields.level,
    message: fields.message,
    ...(fields.error ? { error: serializeUnknownError(fields.error) } : {}),
    ...(extra ? { extra } : {})
  };
};
