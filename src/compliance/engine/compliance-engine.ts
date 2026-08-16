import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult, ComplianceDecision } from '../rules/decision.js';

type ComplianceDecisionPersistence = {
  create: (args: {
    data: {
      tenantId: string;
      campaignId: string;
      debtorRecordId: string;
      decision: ComplianceDecision;
      reasonCode: string;
      reasonText: string;
      ruleVersion: string;
      checkedAt: Date;
    };
  }) => Promise<unknown>;
};

type ComplianceEngineOptions = {
  ruleVersion?: string;
  complianceDecisionStore?: ComplianceDecisionPersistence;
};

export type ComplianceEngineResult = {
  decision: ComplianceDecision;
  blockedReasons: ComplianceRuleResult[];
  rules: string[];
};

export class ComplianceEngine {
  private readonly rules: ComplianceRule[];
  private readonly ruleVersion: string;
  private readonly complianceDecisionStore?: ComplianceDecisionPersistence;

  constructor(rules: ComplianceRule[], options: ComplianceEngineOptions = {}) {
    this.rules = rules;
    this.ruleVersion = options.ruleVersion ?? 'v1';
    this.complianceDecisionStore = options.complianceDecisionStore;
  }

  async evaluate(context: ComplianceRuleContext): Promise<ComplianceEngineResult> {
    const results = await Promise.all(this.rules.map((rule) => Promise.resolve(rule.evaluate(context))));

    const blockedReasons = results.filter((result) => result.decision === 'block');
    const decision: ComplianceDecision = blockedReasons.length > 0 ? 'block' : 'allow';

    const reason = createDecisionReason(decision, blockedReasons);
    if (this.complianceDecisionStore) {
      await this.complianceDecisionStore.create({
        data: {
          tenantId: context.tenantId,
          campaignId: context.campaignId,
          debtorRecordId: context.debtorRecordId,
          decision,
          reasonCode: reason.code,
          reasonText: reason.text,
          ruleVersion: this.ruleVersion,
          checkedAt: new Date()
        }
      });
    }

    return {
      decision,
      blockedReasons,
      rules: this.rules.map((rule) => rule.name)
    };
  }
}

const createDecisionReason = (decision: ComplianceDecision, blockedReasons: ComplianceRuleResult[]): { code: string; text: string } => {
  if (decision === 'allow') {
    return {
      code: 'ALLOW',
      text: 'All compliance rules passed'
    };
  }

  const codes = blockedReasons
    .map((reason) => reason.reasonCode || 'UNKNOWN')
    .filter((code) => code.length > 0);
  const texts = blockedReasons
    .map((reason) => reason.reasonText || reason.reasonCode || 'Unknown block reason');

  return {
    code: codes.length > 0 ? codes.join('|') : 'COMPLIANCE_BLOCK',
    text: texts.length > 0 ? texts.join('; ') : 'Compliance blocked the call'
  };
};
