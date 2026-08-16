import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from './decision.js';

export class FakeAllowComplianceRule implements ComplianceRule {
  name = 'fake-allow';

  evaluate(_context: ComplianceRuleContext): ComplianceRuleResult {
    return {
      decision: 'allow'
    };
  }
}
