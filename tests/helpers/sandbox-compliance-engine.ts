import { ComplianceEngine } from '../../src/compliance/engine/compliance-engine.js';
import { ConsentStatusRule } from '../../src/compliance/rules/consent-status.js';
import { DebtStatusRule } from '../../src/compliance/rules/debt-status.js';
import { FrequencyLimitRule } from '../../src/compliance/rules/frequency-limit.js';
import { createInMemoryFrequencyLedgerRepository } from '../../src/domain/frequency-ledger/index.js';
import {
  SuppressionRule,
  createInMemorySuppressionLookup
} from '../../src/compliance/rules/suppression.js';
import type { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from '../../src/compliance/rules/decision.js';

/** Test-only open call window; keeps real consent/debt/frequency/suppression gates. */
class TestOpenCallWindowRule implements ComplianceRule {
  readonly name = 'call-window';
  evaluate(_context: ComplianceRuleContext): ComplianceRuleResult {
    return { decision: 'allow' };
  }
}

export const createSandboxApiComplianceEngine = (): ComplianceEngine =>
  new ComplianceEngine([
    new TestOpenCallWindowRule(),
    new ConsentStatusRule(),
    new DebtStatusRule(),
    new FrequencyLimitRule(createInMemoryFrequencyLedgerRepository()),
    new SuppressionRule(createInMemorySuppressionLookup())
  ], { ruleVersion: 'v1-test' });
