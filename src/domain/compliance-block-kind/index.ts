export type ComplianceBlockKind = 'permanent' | 'temporary' | 'campaign_pause';

export const CAMPAIGN_PAUSE_REASON_TEXT = 'Кампания приостановлена — новые звонки не создаются';

const TEMPORARY_REASON_CODES = new Set(['CALL_WINDOW_BLOCK', 'FREQUENCY_LIMIT_BLOCK']);

export const resolveBlockKindFromReasonCode = (
  reasonCode: string | null | undefined
): ComplianceBlockKind | null => {
  if (!reasonCode) {
    return null;
  }

  const codes = reasonCode.split('|').map((code) => code.trim()).filter(Boolean);
  if (codes.includes('SUPPRESSION_BLOCK')) {
    return 'permanent';
  }
  if (codes.some((code) => TEMPORARY_REASON_CODES.has(code))) {
    return 'temporary';
  }

  return null;
};

export type ComplianceDecisionSummaryInput = {
  decision: string;
  reasonCode?: string | null;
  reasonText?: string | null;
  checkedAt?: string | Date | null;
};

export type ComplianceDecisionSummary = {
  decision: string;
  reasonCode: string | null;
  reasonText: string | null;
  checkedAt: string | Date | null;
  blockKind: ComplianceBlockKind | null;
};

export const toComplianceDecisionSummary = (
  input: ComplianceDecisionSummaryInput
): ComplianceDecisionSummary => ({
  decision: input.decision,
  reasonCode: input.reasonCode ?? null,
  reasonText: input.reasonText ?? null,
  checkedAt: input.checkedAt ?? null,
  blockKind: input.decision === 'block'
    ? resolveBlockKindFromReasonCode(input.reasonCode)
    : null
});

export const enrichBlockedReason = <T extends { decision: string; reasonCode?: string }>(
  reason: T
): T & { blockKind: ComplianceBlockKind | null } => ({
  ...reason,
  blockKind: reason.decision === 'block'
    ? resolveBlockKindFromReasonCode(reason.reasonCode)
    : null
});
