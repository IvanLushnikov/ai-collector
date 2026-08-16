import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from './decision.js';

export class ConsentStatusRule implements ComplianceRule {
  readonly name = 'consent-status';

  evaluate(context: ComplianceRuleContext): ComplianceRuleResult {
    if (context.consentStatus === 'revoked') {
      return {
        decision: 'block',
        reasonCode: 'CONSENT_REVOKED',
        reasonText: 'Consent status is revoked'
      };
    }

    return { decision: 'allow' };
  }
}
