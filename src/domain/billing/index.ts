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
