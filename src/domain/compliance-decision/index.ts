export type ComplianceDecisionStatus = 'allow' | 'block';

export interface ComplianceDecision {
  id: string;
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  decision: ComplianceDecisionStatus;
  reasonCode: string;
  reasonText: string;
  ruleVersion: string;
  checkedAt: Date;
}
