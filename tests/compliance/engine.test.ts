import { expect, describe, it, vi } from 'vitest';
import { ComplianceEngine } from '../../src/compliance/engine/compliance-engine.js';
import { FakeAllowComplianceRule } from '../../src/compliance/rules/fake-allow.js';
import { DebtStatusRule } from '../../src/compliance/rules/debt-status.js';
import { ConsentStatusRule } from '../../src/compliance/rules/consent-status.js';

const context = {
  tenantId: 'tenant-1',
  campaignId: 'campaign-1',
  debtorRecordId: 'debtor-1',
  phone: '+79501234567',
  timezone: 'Europe/Moscow',
  debtAmount: 1000
};

describe('ComplianceEngine', () => {
  it('returns allow when all rules allow', async () => {
    const engine = new ComplianceEngine([
      new FakeAllowComplianceRule(),
      new FakeAllowComplianceRule()
    ]);

    const result = await engine.evaluate({
      ...context,
      debtStatus: 'active',
      consentStatus: 'given'
    });

    expect(result).toEqual({
      decision: 'allow',
      blockedReasons: [],
      rules: ['fake-allow', 'fake-allow']
    });
  });

  it('returns block when any rule blocks and keeps all blocking reasons', async () => {
    const engine = new ComplianceEngine([
      new ConsentStatusRule(),
      new DebtStatusRule(),
      new FakeAllowComplianceRule()
    ]);

    const result = await engine.evaluate({
      ...context,
      debtStatus: 'closed',
      consentStatus: 'revoked'
    });

    expect(result.decision).toBe('block');
    expect(result.rules).toEqual(['consent-status', 'debt-status', 'fake-allow']);
    expect(result.blockedReasons).toEqual([
      {
        decision: 'block',
        reasonCode: 'CONSENT_REVOKED',
        reasonText: 'Consent status is revoked'
      },
      {
        decision: 'block',
        reasonCode: 'DEBT_STATUS_BLOCK',
        reasonText: 'Debt status closed is blocked'
      }
    ]);
  });

  it('persists a compliance decision log entry', async () => {
    const create = vi.fn(async () => ({}));
    const engine = new ComplianceEngine(
      [new ConsentStatusRule()],
      {
        complianceDecisionStore: { create },
        ruleVersion: 'v-test'
      }
    );

    await engine.evaluate({
      ...context,
      debtStatus: 'active',
      consentStatus: 'revoked'
    });

    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        campaignId: 'campaign-1',
        debtorRecordId: 'debtor-1',
        decision: 'block',
        reasonCode: 'CONSENT_REVOKED',
        reasonText: 'Consent status is revoked',
        ruleVersion: 'v-test',
        checkedAt: expect.any(Date)
      }
    });
  });

  it('persists an allow decision when no rules are blocking', async () => {
    const create = vi.fn(async () => ({}));
    const engine = new ComplianceEngine(
      [new FakeAllowComplianceRule()],
      { complianceDecisionStore: { create } }
    );

    await engine.evaluate({
      ...context,
      debtStatus: 'active',
      consentStatus: 'given'
    });

    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        campaignId: 'campaign-1',
        debtorRecordId: 'debtor-1',
        decision: 'allow',
        reasonCode: 'ALLOW',
        reasonText: 'All compliance rules passed',
        ruleVersion: 'v1',
        checkedAt: expect.any(Date)
      }
    });
  });
});
