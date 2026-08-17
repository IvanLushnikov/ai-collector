export const isPilotCapReached = (input: {
  dailyCallCap?: number | null;
  startedToday: number;
  channel: 'sandbox' | 'live' | 'fake';
}): boolean => {
  if (input.channel === 'sandbox' || input.channel === 'fake') {
    return false;
  }
  if (input.dailyCallCap == null) {
    return false;
  }
  return input.startedToday >= input.dailyCallCap;
};
