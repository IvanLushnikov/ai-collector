import { expect, it, describe } from 'vitest';
import { parseDebtorImportCsv } from '../../src/import/debtor-import-parser.js';

describe('parseDebtorImportCsv', () => {
  it('returns raw rows from valid csv', () => {
    const csv = `externalId,phone,timezone,debtAmount,debtStatus,consentStatus
AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given
CD-1002,+7 903 222 11 22,Asia/Yekaterinburg,5600,active,pending`;

    const result = parseDebtorImportCsv(csv);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      externalId: 'AB-1001',
      phone: '+7 (950) 123-45-67',
      timezone: 'Europe/Moscow',
      debtAmount: '15320.50',
      debtStatus: 'active',
      consentStatus: 'given'
    });
    expect(result.rows[1]).toEqual({
      externalId: 'CD-1002',
      phone: '+7 903 222 11 22',
      timezone: 'Asia/Yekaterinburg',
      debtAmount: '5600',
      debtStatus: 'active',
      consentStatus: 'pending'
    });
  });

  it('keeps optional identity columns when present', () => {
    const csv = `externalId,phone,timezone,debtAmount,debtStatus,consentStatus,displayName,agreementRef
AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given,Иванов И.И.,ДГ-4412`;

    const result = parseDebtorImportCsv(csv);

    expect(result.rows[0]).toMatchObject({
      displayName: 'Иванов И.И.',
      agreementRef: 'ДГ-4412'
    });
  });

  it('throws for empty csv', () => {
    expect(() => parseDebtorImportCsv('')).toThrowError(/EMPTY_CSV/);
    expect(() => parseDebtorImportCsv('   \n\r\n')).toThrowError(/EMPTY_CSV/);
  });
});

describe('parseDebtorImportXlsx', () => {
  it('parses the same fields as CSV without evaluating formulas', async () => {
    const { parseDebtorImportXlsx } = await import('../../src/import/xlsx-parser.js');
    const { buildDebtorXlsx } = await import('./xlsx-fixture.js');
    const buffer = buildDebtorXlsx([
      ['externalId', 'phone', 'timezone', 'debtAmount', 'debtStatus', 'consentStatus'],
      ['AB-1001', '+7 (950) 123-45-67', 'Europe/Moscow', '15320.50', 'active', 'given']
    ]);

    expect(parseDebtorImportXlsx(buffer).rows[0]).toMatchObject({
      externalId: 'AB-1001',
      phone: '+7 (950) 123-45-67',
      timezone: 'Europe/Moscow',
      debtAmount: '15320.50',
      debtStatus: 'active',
      consentStatus: 'given'
    });
  });

  it('rejects an empty sheet', async () => {
    const { parseDebtorImportXlsx } = await import('../../src/import/xlsx-parser.js');
    const { buildDebtorXlsx } = await import('./xlsx-fixture.js');
    expect(() => parseDebtorImportXlsx(buildDebtorXlsx([]))).toThrowError(/EMPTY_XLSX/);
  });

  it('keeps a stored formula string without evaluating it', async () => {
    const { parseDebtorImportXlsx } = await import('../../src/import/xlsx-parser.js');
    const { buildDebtorXlsx } = await import('./xlsx-fixture.js');
    const buffer = buildDebtorXlsx([
      ['externalId', 'phone', 'timezone', 'debtAmount', 'debtStatus', 'consentStatus'],
      ['AB-1001', '+79501234567', 'Europe/Moscow', '=A1+1', 'active', 'given']
    ]);

    expect(parseDebtorImportXlsx(buffer).rows[0]?.debtAmount).toBe('=A1+1');
  });
});
