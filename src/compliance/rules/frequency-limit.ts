import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from './decision.js';
import {
  FrequencyLedgerRepository,
  PRODUCT_FREQUENCY_CAPS,
  periodStartForBucket,
  type FrequencyBucket
} from '../../domain/frequency-ledger/index.js';

const BUCKETS: FrequencyBucket[] = ['day', 'week', 'month'];

export class FrequencyLimitRule implements ComplianceRule {
  readonly name = 'frequency-limit';

  constructor(private readonly ledger: FrequencyLedgerRepository) {}

  async evaluate(context: ComplianceRuleContext): Promise<ComplianceRuleResult> {
    const occurredAt = context.occurredAt ?? new Date();
    const creditorKey = context.creditorKey ?? context.tenantId;
    const obligationId = context.obligationId ?? context.debtorRecordId;

    for (const bucket of BUCKETS) {
      const count = await this.ledger.getCount({
        tenantId: context.tenantId,
        creditorKey,
        obligationId,
        bucket,
        periodStart: periodStartForBucket(bucket, occurredAt)
      });

      if (count >= PRODUCT_FREQUENCY_CAPS[bucket]) {
        return {
          decision: 'block',
          reasonCode: 'FREQUENCY_LIMIT_BLOCK',
          reasonText: `Product frequency cap reached for ${bucket === 'day' ? 'daily' : bucket} bucket`
        };
      }
    }

    return { decision: 'allow' };
  }
}
