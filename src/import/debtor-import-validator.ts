import { DebtorImportRawRow } from './debtor-import-parser.js';
import { normalizePhone } from './phone-normalizer.js';

export const mandatoryDebtorImportFields = [
  'externalId',
  'phone',
  'timezone',
  'debtAmount',
  'debtStatus',
  'consentStatus'
] as const;

export type DebtorImportValidationError = {
  row: number;
  field: string;
  message: string;
};

export type DebtorImportValidationResult = {
  validRows: DebtorImportRawRow[];
  errors: DebtorImportValidationError[];
};

const fieldLabels: Record<string, string> = {
  externalId: 'номер клиента',
  phone: 'телефон',
  timezone: 'часовой пояс',
  debtAmount: 'сумма долга',
  debtStatus: 'статус долга',
  consentStatus: 'статус согласия'
};

const labelList = (fields: readonly string[]): string =>
  fields.map((field) => fieldLabels[field] ?? field).join(', ');

const isEmpty = (value: unknown): boolean => {
  return typeof value !== 'string' || value.trim().length === 0;
};

export const validateDebtorImportRows = (rows: DebtorImportRawRow[]): DebtorImportValidationResult => {
  const errors: DebtorImportValidationError[] = [];
  const presentColumns = new Set<string>();
  const seenExternalIds = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => presentColumns.add(key));
  });

  const missingColumns = mandatoryDebtorImportFields.filter((field) => !presentColumns.has(field));

  if (missingColumns.length > 0) {
    errors.push({
      row: 1,
      field: 'header',
      message: `Не удалось загрузить базу. Добавьте столбцы: ${labelList(missingColumns)}.`
    });

    return {
      validRows: [],
      errors
    };
  }

  const validRows = rows.filter((row, index) => {
    const rowNumber = index + 2;
    const rowErrors: DebtorImportValidationError[] = [];
    const fieldsToValidate = mandatoryDebtorImportFields.filter((field) => !missingColumns.includes(field));

    fieldsToValidate.forEach((field) => {
      if (isEmpty(row[field])) {
        rowErrors.push({
          row: rowNumber,
          field,
          message: `Не хватает поля «${fieldLabels[field] ?? field}». Заполните его в строке и загрузите файл снова.`
        });
      }
    });

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return false;
    }

    const normalizedPhone = normalizePhone(String(row.phone));
    if (normalizedPhone.error) {
      errors.push({
        row: rowNumber,
        field: 'phone',
        message: normalizedPhone.error.message
      });
      return false;
    }

    const externalId = String(row.externalId);
    if (seenExternalIds.has(externalId)) {
      errors.push({
        row: rowNumber,
        field: 'externalId',
        message: `Номер клиента ${externalId} уже есть в файле. Оставьте одну строку.`
      });
      return false;
    }

    seenExternalIds.add(externalId);

    row.phone = normalizedPhone.value as string;

    return true;
  });

  return {
    validRows,
    errors
  };
};
