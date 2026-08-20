export type AuditLogMetadataValue = string | number | boolean | null | AuditLogMetadataObject | AuditLogMetadataValue[];

export type AuditLogMetadataObject = {
  [key: string]: AuditLogMetadataValue;
};

export type AuditLogMetadata = AuditLogMetadataObject;

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: AuditLogMetadata;
  createdAt: Date;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isAuditLogMetadataValue = (value: unknown): value is AuditLogMetadataValue => {
  if (value === null) {
    return true;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isAuditLogMetadataValue);
  }

  if (isRecord(value)) {
    return Object.values(value).every(isAuditLogMetadataValue);
  }

  return false;
};

export const isAuditLogMetadata = (value: unknown): value is AuditLogMetadata => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(isAuditLogMetadataValue);
};

export {
  AUDIT_ACTION_GROUPS,
  matchesAuditActionGroup,
  normalizeAuditActionGroup,
  type AuditActionGroup
} from './action-groups.js';
