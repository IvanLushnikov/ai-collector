import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from './decision.js';

export type SuppressionMatch = {
  tenantId: string;
  phone?: string | null;
  externalId?: string | null;
};

export type SuppressionLookup = {
  matches: (input: { tenantId: string; phone: string; externalId?: string | null }) => Promise<boolean>;
};

export const createInMemorySuppressionLookup = (entries: SuppressionMatch[] = []): SuppressionLookup => {
  return {
    async matches(input) {
      return entries.some((entry) => {
        if (entry.tenantId !== input.tenantId) {
          return false;
        }

        if (entry.phone && entry.phone === input.phone) {
          return true;
        }

        if (entry.externalId && input.externalId && entry.externalId === input.externalId) {
          return true;
        }

        return false;
      });
    }
  };
};

export class SuppressionRule implements ComplianceRule {
  readonly name = 'suppression';

  constructor(private readonly lookup: SuppressionLookup) {}

  async evaluate(context: ComplianceRuleContext): Promise<ComplianceRuleResult> {
    const blocked = await this.lookup.matches({
      tenantId: context.tenantId,
      phone: context.phone,
      externalId: context.obligationId
    });

    if (!blocked) {
      return { decision: 'allow' };
    }

    return {
      decision: 'block',
      reasonCode: 'SUPPRESSION_BLOCK',
      reasonText: 'Contact is on the tenant suppression list'
    };
  }
}
