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

    if (context.consentStatus !== 'given') {
      return {
        decision: 'block',
        reasonCode: 'CONSENT_PENDING_BLOCK',
        reasonText: 'Consent status is pending'
      };
    }

    return { decision: 'allow' };
  }
}
