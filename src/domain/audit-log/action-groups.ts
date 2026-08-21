export type AuditActionGroup = 'block' | 'campaign_status' | 'decision';

const AUDIT_ACTION_GROUP_ALIASES: Record<string, AuditActionGroup> = {
  blocks: 'block',
  review: 'decision'
};

export const AUDIT_ACTION_GROUPS: Record<AuditActionGroup, readonly string[]> = {
  block: ['campaign.auto_paused', 'call.sandbox_blocked'],
  campaign_status: ['campaign.created', 'campaign.status_updated', 'campaign.safe_resumed'],
  decision: [
    'review_item.resolved',
    'call.qa_updated',
    'script_version.created',
    'call.sandbox_started'
  ]
};

export const normalizeAuditActionGroup = (value: string): AuditActionGroup | null => {
  const normalized = value.trim().toLowerCase();
  const alias = AUDIT_ACTION_GROUP_ALIASES[normalized];
  if (alias) {
    return alias;
  }

  if (normalized in AUDIT_ACTION_GROUPS) {
    return normalized as AuditActionGroup;
  }

  return null;
};

export const matchesAuditActionGroup = (action: string, group: AuditActionGroup): boolean =>
  AUDIT_ACTION_GROUPS[group].includes(action);
