export type ComplianceDecision = 'allow' | 'block';

export type ComplianceDecisionStatus = ComplianceDecision;

export type ComplianceRuleContext = {
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  phone: string;
  timezone: string;
  debtAmount: number;
  debtStatus: string;
  consentStatus: string;
  creditorKey?: string;
  obligationId?: string;
  occurredAt?: Date;
};

export type ComplianceRuleResult = {
  decision: ComplianceDecision;
  reasonCode?: string;
  reasonText?: string;
};

export interface ComplianceRule {
  readonly name: string;

  evaluate(context: ComplianceRuleContext): Promise<ComplianceRuleResult> | ComplianceRuleResult;
}
