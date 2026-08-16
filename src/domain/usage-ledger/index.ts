import type { UsageEventType } from '../usage-event/index.js';

export interface UsageLedgerTotalsItem {
  eventType: UsageEventType;
  unit: string;
  totalQuantity: number;
}

export interface UsageLedgerAggregateResult {
  totals: UsageLedgerTotalsItem[];
}

type UsageLedgerEventRecord = {
  sourceId: string;
  eventType: UsageEventType;
  quantity: number;
  unit: string;
};

type UsageLedgerDependencies = {
  usageEvent: {
    findMany: (args: {
      where: { tenantId: string; campaignId: string };
      select: { sourceId: true; eventType: true; quantity: true; unit: true };
    }) => Promise<UsageLedgerEventRecord[]>;
  };
};

const totalsMapKey = (eventType: UsageEventType, unit: string): string =>
  `${eventType}::${unit}`;

export const calculateUsageLedgerTotals = async (
  deps: UsageLedgerDependencies,
  args: { tenantId: string; campaignId: string }
): Promise<UsageLedgerAggregateResult> => {
  const usageEvents = await deps.usageEvent.findMany({
    where: {
      tenantId: args.tenantId,
      campaignId: args.campaignId
    },
    select: {
      sourceId: true,
      eventType: true,
      quantity: true,
      unit: true
    }
  });

  const totalsByKey = new Map<string, number>();
  const seenSourceIds = new Set<string>();

  for (const event of usageEvents) {
    if (seenSourceIds.has(event.sourceId)) {
      continue;
    }
    seenSourceIds.add(event.sourceId);

    const key = totalsMapKey(event.eventType, event.unit);
    totalsByKey.set(key, (totalsByKey.get(key) ?? 0) + event.quantity);
  }

  const totals: UsageLedgerTotalsItem[] = Array.from(totalsByKey.entries()).map(([key, totalQuantity]) => {
    const [eventType, unit] = key.split('::');
    return {
      eventType: eventType as UsageEventType,
      unit,
      totalQuantity
    };
  });

  totals.sort((left, right) => {
    if (left.eventType === right.eventType) {
      return left.unit.localeCompare(right.unit);
    }
    return left.eventType.localeCompare(right.eventType);
  });

  return { totals };
};
