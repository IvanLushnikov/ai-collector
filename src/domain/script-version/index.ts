export type ScriptStatus = 'draft' | 'active' | 'archived';

export const LOCKED_DISCLOSURE_FIELDS = ['agentName', 'agentId', 'creditorName'] as const;

export type ScriptLockedDisclosure = {
  agentName: string;
  agentId: string;
  creditorName: string;
};

export type ScriptContent = ScriptLockedDisclosure & Record<string, unknown>;

export interface ScriptVersion {
  id: string;
  tenantId: string;
  campaignId: string;
  version: number;
  status: ScriptStatus;
  content: string;
  createdByUserId: string;
  createdAt: Date;
}

export const isLockedDisclosureContent = (value: unknown): value is ScriptContent => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return LOCKED_DISCLOSURE_FIELDS.every((field) => {
    const fieldValue = record[field];
    return typeof fieldValue === 'string' && fieldValue.trim().length > 0;
  });
};

export const serializeScriptContent = (content: ScriptContent): string => JSON.stringify(content);
