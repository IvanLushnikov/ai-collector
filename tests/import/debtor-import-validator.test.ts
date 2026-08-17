import { expect, it, describe } from 'vitest';
import { parseDebtorImportCsv } from '../../src/import/debtor-import-parser.js';
import { validateDebtorImportRows } from '../../src/import/debtor-import-validator.js';

describe('validateDebtorImportRows', () => {
  it('accepts valid rows', () => {
    const csv = `externalId,phone,timezone,debtAmount,debtStatus,consentStatus
AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given`;
    const parsed = parseDebtorImportCsv(csv);

    const result = validateDebtorImportRows(parsed.rows);

    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toMatchObject(parsed.rows[0]);
  });

  it('returns errors for missing required columns', () => {
    const parsed = parseDebtorImportCsv('externalId,phone\nAB-1001,+7 1111111');

    const result = validateDebtorImportRows(parsed.rows);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      row: 1,
      field: 'header',
      message: 'Missing required columns: timezone, debtAmount, debtStatus, consentStatus'
    });
    expect(result.errors[0].row).toBe(1);
  });

  it('returns errors for empty required values', () => {
    const parsed = parseDebtorImportCsv('externalId,phone,timezone,debtAmount,debtStatus,consentStatus\nAB-1001,,Europe/Moscow,15320.50,active,given');

    const result = validateDebtorImportRows(parsed.rows);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      row: 2,
      field: 'phone',
      message: 'Required field phone is missing'
    });
    expect(result.validRows).toHaveLength(0);
  });

  it('returns errors for invalid phone and excludes from valid rows', () => {
    const parsed = parseDebtorImportCsv('externalId,phone,timezone,debtAmount,debtStatus,consentStatus\nAB-1001,123,Europe/Moscow,15320.50,active,given');

    const result = validateDebtorImportRows(parsed.rows);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      row: 2,
      field: 'phone',
      message: 'Phone number length is invalid for E.164'
    });
    expect(result.validRows).toHaveLength(0);
  });

  it('normalizes phone in valid row', () => {
    const parsed = parseDebtorImportCsv('externalId,phone,timezone,debtAmount,debtStatus,consentStatus\nAB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given');

    const result = validateDebtorImportRows(parsed.rows);

    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].phone).toBe('+79501234567');
  });

  it('deduplicates rows by externalId', () => {
    const parsed = parseDebtorImportCsv(
      'externalId,phone,timezone,debtAmount,debtStatus,consentStatus\n' +
      'AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given\n' +
      'AB-1001,+7 950 123 45 67,Europe/Moscow,5600.00,active,pending'
    );

    const result = validateDebtorImportRows(parsed.rows);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      row: 3,
      field: 'externalId',
      message: 'Duplicate externalId AB-1001'
    });
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0].externalId).toBe('AB-1001');
  });

  it('accepts rows without optional identity columns', () => {
    const parsed = parseDebtorImportCsv(
      'externalId,phone,timezone,debtAmount,debtStatus,consentStatus\nAB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given'
    );

    const result = validateDebtorImportRows(parsed.rows);

    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0].displayName).toBeUndefined();
    expect(result.validRows[0].agreementRef).toBeUndefined();
  });
});
