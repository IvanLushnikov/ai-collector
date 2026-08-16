export type DebtorImportRawRow = Record<string, string>;

export type DebtorImportParseResult = {
  rows: DebtorImportRawRow[];
};

const lineDelimiterRegex = /\r?\n/;

const parseCsvRow = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const normalizeRows = (raw: string): string[][] => {
  return raw
    .split(lineDelimiterRegex)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => parseCsvRow(line));
};

export const parseDebtorImportCsv = (rawCsv: string): DebtorImportParseResult => {
  const normalized = (rawCsv ?? '').trim();
  if (normalized.length === 0) {
    throw new Error('EMPTY_CSV: CSV content must not be empty');
  }

  const rows = normalizeRows(rawCsv);

  if (rows.length === 0) {
    throw new Error('EMPTY_CSV: CSV file has no data rows');
  }

  const [header, ...rawRows] = rows;
  if (header.length === 0) {
    throw new Error('INVALID_CSV: Header row is missing');
  }

  const headerCells = header.map((item) => item.trim());

  return {
    rows: rawRows.map((rowCells) => {
      const row: DebtorImportRawRow = {};
      headerCells.forEach((headerCell, index) => {
        row[headerCell] = rowCells[index] ?? '';
      });
      return row;
    })
  };
};
