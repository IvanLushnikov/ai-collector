import { describe, expect, it } from 'vitest';
import {
  AUDIT_ACTION_GROUPS,
  matchesAuditActionGroup,
  normalizeAuditActionGroup
} from '../src/domain/audit-log/index.js';

describe('audit log action groups', () => {
  it('normalizes canonical and alias group names', () => {
    expect(normalizeAuditActionGroup('block')).toBe('block');
    expect(normalizeAuditActionGroup('blocks')).toBe('block');
    expect(normalizeAuditActionGroup('campaign_status')).toBe('campaign_status');
    expect(normalizeAuditActionGroup('decision')).toBe('decision');
    expect(normalizeAuditActionGroup('review')).toBe('decision');
    expect(normalizeAuditActionGroup('unknown')).toBeNull();
  });

  it('matches known actions per group', () => {
    expect(matchesAuditActionGroup('campaign.auto_paused', 'block')).toBe(true);
    expect(matchesAuditActionGroup('call.sandbox_blocked', 'block')).toBe(true);
    expect(matchesAuditActionGroup('campaign.status_updated', 'campaign_status')).toBe(true);
    expect(matchesAuditActionGroup('review_item.resolved', 'decision')).toBe(true);
    expect(matchesAuditActionGroup('campaign.status_updated', 'block')).toBe(false);
  });

  it('documents all groups with at least one action', () => {
    for (const actions of Object.values(AUDIT_ACTION_GROUPS)) {
      expect(actions.length).toBeGreaterThan(0);
    }
  });
});
