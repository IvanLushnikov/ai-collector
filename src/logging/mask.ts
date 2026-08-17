const PHONE_KEYS = new Set(['phone', 'phonenumber']);

export const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) {
    return '••••';
  }

  const last4 = digits.slice(-4);
  const grouped = `${last4.slice(0, 2)}-${last4.slice(2)}`;
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 •••-••-${grouped}`;
  }

  return `••••${last4}`;
};

export const maskSensitiveFields = <T>(value: T): T => {
  return maskValue(value) as T;
};

const maskValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(maskValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
        if (PHONE_KEYS.has(key.toLowerCase()) && typeof nested === 'string') {
          return [key, maskPhone(nested)];
        }

        return [key, maskValue(nested)];
      })
    );
  }

  return value;
};
