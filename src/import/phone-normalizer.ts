export type PhoneValidationError = {
  code: 'INVALID_PHONE_FORMAT';
  message: string;
};

export type PhoneNormalizeResult = {
  value?: string;
  error?: PhoneValidationError;
};

const removeSeparators = (value: string): string => {
  return value.replace(/[\s\-()]/g, '');
};

const toDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const normalizePhone = (rawPhone: string): PhoneNormalizeResult => {
  const trimmed = rawPhone.trim();

  if (trimmed.length === 0) {
    return {
      error: {
        code: 'INVALID_PHONE_FORMAT',
        message: 'Phone is empty'
      }
    };
  }

  const withCleanSeparators = removeSeparators(trimmed);
  if (withCleanSeparators.length === 0) {
    return {
      error: {
        code: 'INVALID_PHONE_FORMAT',
        message: 'Phone is empty'
      }
    };
  }

  const hasPlusPrefix = withCleanSeparators.startsWith('+');
  const compact = hasPlusPrefix ? withCleanSeparators : `+${toDigits(withCleanSeparators)}`;

  const withoutPlus = compact.startsWith('+') ? compact.slice(1) : compact;
  const digits = toDigits(withoutPlus);

  if (!/^\d+$/.test(digits)) {
    return {
      error: {
        code: 'INVALID_PHONE_FORMAT',
        message: 'Phone contains invalid characters'
      }
    };
  }

  const length = digits.length;
  if (length < 7 || length > 15) {
    return {
      error: {
        code: 'INVALID_PHONE_FORMAT',
        message: 'Phone number length is invalid for E.164'
      }
    };
  }

  const normalized = `+${digits}`;

  return { value: normalized };
};
