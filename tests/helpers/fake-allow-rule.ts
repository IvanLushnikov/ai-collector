import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from '../../src/compliance/rules/decision.js';

export class FakeAllowComplianceRule implements ComplianceRule {
  name = 'fake-allow';

  evaluate(_context: ComplianceRuleContext): ComplianceRuleResult {
    return {
      decision: 'allow'
    };
  }
}
