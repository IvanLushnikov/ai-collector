export type BillingRateConfig = {
  connectedMinuteRateRub: number;
};

export const defaultCampaignBillingRates: BillingRateConfig = {
  // В v0: один подключенный минутный слот считается как 1.20 ₽.
  connectedMinuteRateRub: 1.2
};

export const validateCampaignBillingRates = (rates: BillingRateConfig = defaultCampaignBillingRates): BillingRateConfig => {
  if (!Number.isFinite(rates.connectedMinuteRateRub) || rates.connectedMinuteRateRub <= 0) {
    throw new Error('connectedMinuteRateRub must be a positive finite number');
  }

  return rates;
};

export const calculateCostFromMinutes = (
  connectedMinutes: number,
  denominator: number,
  rates: BillingRateConfig = defaultCampaignBillingRates
): number | null => (
  denominator > 0 && Number.isFinite(connectedMinutes) && connectedMinutes >= 0
    ? validateCampaignBillingRates(rates).connectedMinuteRateRub * (connectedMinutes / denominator)
    : null
);

export const SPEECH_USAGE_EVENT_TYPES = ['asr_units', 'tts_units', 'llm_units'] as const;

export type BillableUsageEvent = {
  eventType: string;
  quantity: number;
  credentialMode?: 'platform' | 'byok' | 'fake' | string;
};

export const isPlatformBillableUsage = (event: BillableUsageEvent): boolean => {
  if ((SPEECH_USAGE_EVENT_TYPES as readonly string[]).includes(event.eventType)) {
    return event.credentialMode === 'platform';
  }
  return true;
};

export const sumPlatformSpeechUnits = (events: readonly BillableUsageEvent[]): number =>
  events
    .filter(isPlatformBillableUsage)
    .filter((event) => (SPEECH_USAGE_EVENT_TYPES as readonly string[]).includes(event.eventType))
    .reduce((sum, event) => sum + Number(event.quantity), 0);

