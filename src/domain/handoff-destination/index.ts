export type HandoffDestination = {
  number: string;
  windowStart: string;
  windowEnd: string;
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isHandoffDestinationConfigured = (
  value: Partial<HandoffDestination> | null | undefined
): boolean => Boolean(value?.number?.trim());

export const isHandoffWindowWithinCallWindow = (
  destination: Pick<HandoffDestination, 'windowStart' | 'windowEnd'>,
  callWindow: { start: string; end: string }
): boolean => {
  if (!TIME.test(destination.windowStart) || !TIME.test(destination.windowEnd)) {
    return false;
  }
  return destination.windowStart >= callWindow.start && destination.windowEnd <= callWindow.end;
};
