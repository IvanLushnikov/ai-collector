import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from './decision.js';

const blockedStatuses = new Set(['closed', 'disputed', 'bankruptcy', 'contact_forbidden']);

export class DebtStatusRule implements ComplianceRule {
  readonly name = 'debt-status';

  evaluate(context: ComplianceRuleContext): ComplianceRuleResult {
    if (blockedStatuses.has(context.debtStatus)) {
      return {
        decision: 'block',
        reasonCode: 'DEBT_STATUS_BLOCK',
        reasonText: `Debt status ${context.debtStatus} is blocked`
      };
    }

    return { decision: 'allow' };
  }
}
