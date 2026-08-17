/**
 * Product-frame calendar of Russian non-working public holidays for 2026–2027.
 *
 * This list is a product rulebook approximation for Lab/Pilot encoding.
 * It is not a legal sign-off, not the official production calendar,
 * and must not be described in UI as a fact of ФЗ-230.
 */

const PRODUCT_RUSSIAN_NON_WORKING_DAYS_2026_2027 = new Set([
  '2026-01-01',
  '2026-01-02',
  '2026-01-03',
  '2026-01-04',
  '2026-01-05',
  '2026-01-06',
  '2026-01-07',
  '2026-01-08',
  '2026-02-23',
  '2026-03-08',
  '2026-05-01',
  '2026-05-09',
  '2026-06-12',
  '2026-11-04',
  '2027-01-01',
  '2027-01-02',
  '2027-01-03',
  '2027-01-04',
  '2027-01-05',
  '2027-01-06',
  '2027-01-07',
  '2027-01-08',
  '2027-02-23',
  '2027-03-08',
  '2027-05-01',
  '2027-05-09',
  '2027-06-12',
  '2027-11-04'
]);

export const localCalendarDate = (timezone: string, now: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
};

export const isProductNonWorkingHoliday = (isoDate: string): boolean => {
  return PRODUCT_RUSSIAN_NON_WORKING_DAYS_2026_2027.has(isoDate);
};
