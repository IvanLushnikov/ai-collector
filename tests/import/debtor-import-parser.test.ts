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

  it('throws for empty csv', () => {
    expect(() => parseDebtorImportCsv('')).toThrowError(/EMPTY_CSV/);
    expect(() => parseDebtorImportCsv('   \n\r\n')).toThrowError(/EMPTY_CSV/);
  });
});
