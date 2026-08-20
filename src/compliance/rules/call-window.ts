import { ComplianceRule, ComplianceRuleContext, ComplianceRuleResult } from './decision.js';
import { isProductNonWorkingHoliday, localCalendarDate } from './russian-holidays.js';

export type CallWindowRuleConfig = {
  startHour: number;
  endHour: number;
};

const WEEKDAY_WINDOW = { startHour: 8, endHour: 22, label: '08:00-22:00' } as const;
const WEEKEND_WINDOW = { startHour: 9, endHour: 20, label: '09:00-20:00' } as const;

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

const localWeekdayAndHour = (timezone: string, now: Date): { weekday: string; hour: number } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);

  return { weekday, hour };
};

const isWeekendDay = (weekday: string): boolean => {
  return weekday === 'Sat' || weekday === 'Sun';
};

export class CallWindowComplianceRule implements ComplianceRule {
  readonly name = 'call-window';

  evaluate(context: ComplianceRuleContext): ComplianceRuleResult {
    const now = new Date();
    const { weekday, hour } = localWeekdayAndHour(context.timezone, now);
    const holiday = isProductNonWorkingHoliday(localCalendarDate(context.timezone, now));
    const weekendLike = isWeekendDay(weekday) || holiday;
    const window = weekendLike ? WEEKEND_WINDOW : WEEKDAY_WINDOW;
    const isAllowed = Number.isFinite(hour) && hour >= window.startHour && hour < window.endHour;

    if (isAllowed) {
      return { decision: 'allow' };
    }

    return {
      decision: 'block',
      reasonCode: 'CALL_WINDOW_BLOCK',
      reasonText: 'Вне разрешённого окна звонка'
    };
  }
}
