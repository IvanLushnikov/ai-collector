export interface SuppressionEntry {
  id: string;
  tenantId: string;
  phone?: string | null;
  externalId?: string | null;
  reason: string;
  createdAt: Date;
}

export const isSuppressionEntry = (value: unknown): value is SuppressionEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Record<string, unknown>;
  const phone = entry.phone;
  const externalId = entry.externalId;
  const hasPhone = typeof phone === 'string' && phone.length > 0;
  const hasExternalId = typeof externalId === 'string' && externalId.length > 0;

  return (
    typeof entry.id === 'string'
    && typeof entry.tenantId === 'string'
    && typeof entry.reason === 'string'
    && entry.reason.length > 0
    && entry.createdAt instanceof Date
    && (phone === null || phone === undefined || typeof phone === 'string')
    && (externalId === null || externalId === undefined || typeof externalId === 'string')
    && (hasPhone || hasExternalId)
  );
};
