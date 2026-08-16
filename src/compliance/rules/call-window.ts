import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from './decision.js';

export type CallWindowRuleConfig = {
  startHour: number;
  endHour: number;
};

const parseHour = (value: string): number => {
  const part = value.trim().slice(0, 2);
  const hour = Number(part);
  if (!Number.isFinite(hour)) {
    throw new Error('Invalid hour');
  }
  if (!Number.isInteger(hour)) {
    throw new Error('Invalid hour');
  }
  return hour;
};

export const parseTimeWindow = (window: string): CallWindowRuleConfig => {
  const [startRaw, endRaw] = window.split('-');
  if (!startRaw || !endRaw) {
    throw new Error('Invalid time window');
  }

  return {
    startHour: parseHour(startRaw),
    endHour: parseHour(endRaw)
  };
};

export class CallWindowComplianceRule implements ComplianceRule {
  readonly name = 'call-window';

  constructor(
    private readonly window = '08:00-22:00'
  ) {}

  evaluate(context: ComplianceRuleContext): ComplianceRuleResult {
    const parsed = parseTimeWindow(this.window);

    const localTime = new Date().toLocaleString('en-US', {
      timeZone: context.timezone,
      hour: '2-digit',
      hour12: false
    });

    const nowHour = Number(localTime);
    const isAllowed = Number.isFinite(nowHour) && nowHour >= parsed.startHour && nowHour < parsed.endHour;

    if (isAllowed) {
      return { decision: 'allow' };
    }

    return {
      decision: 'block',
      reasonCode: 'CALL_WINDOW_BLOCK',
      reasonText: `Call window is restricted to ${this.window}`
    };
  }
}
