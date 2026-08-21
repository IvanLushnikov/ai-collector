import { inflateRawSync } from 'node:zlib';
import { parseDebtorImportCsv, type DebtorImportParseResult } from './debtor-import-parser.js';

const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
const MAX_UNCOMPRESSED_ENTRY_BYTES = 32 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 64;

type ZipEntry = { name: string; data: Buffer };

const readU16 = (buffer: Buffer, offset: number): number => buffer.readUInt16LE(offset);
const readU32 = (buffer: Buffer, offset: number): number => buffer.readUInt32LE(offset);

export const extractZipEntries = (buffer: Buffer): ZipEntry[] => {
  const entries: ZipEntry[] = [];
  let offset = 0;
  let totalUncompressed = 0;
  while (offset + 30 <= buffer.length && buffer.toString('ascii', offset, offset + 2) === 'PK') {
    const signature = readU32(buffer, offset);
    if (signature !== 0x04034b50) {
      break;
    }
    if (entries.length >= MAX_ZIP_ENTRIES) {
      throw new Error('IMPORT_TOO_LARGE: spreadsheet archive has too many entries');
    }
    const method = readU16(buffer, offset + 8);
    const compressedSize = readU32(buffer, offset + 18);
    const uncompressedSize = readU32(buffer, offset + 22);
    const fileNameLength = readU16(buffer, offset + 26);
    const extraLength = readU16(buffer, offset + 28);
    const nameStart = offset + 30;
    const name = buffer.toString('utf8', nameStart, nameStart + fileNameLength);
    const dataStart = nameStart + fileNameLength + extraLength;
    if (dataStart + compressedSize > buffer.length) {
      throw new Error('INVALID_XLSX: truncated zip entry');
    }
    if (uncompressedSize > MAX_UNCOMPRESSED_ENTRY_BYTES) {
      throw new Error('IMPORT_TOO_LARGE: spreadsheet entry exceeds size limit');
    }
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let data: Buffer;
    if (method === 0) {
      data = Buffer.from(compressed);
    } else {
      const inflateLimit = uncompressedSize > 0
        ? Math.min(uncompressedSize, MAX_UNCOMPRESSED_ENTRY_BYTES)
        : MAX_UNCOMPRESSED_ENTRY_BYTES;
      try {
        data = inflateRawSync(compressed, { maxOutputLength: inflateLimit });
      } catch {
        throw new Error('IMPORT_TOO_LARGE: spreadsheet entry could not be safely decompressed');
      }
    }
    if (data.length > MAX_UNCOMPRESSED_ENTRY_BYTES) {
      throw new Error('IMPORT_TOO_LARGE: spreadsheet entry exceeds size limit');
    }
    if (uncompressedSize > 0 && data.length > uncompressedSize) {
      throw new Error('IMPORT_TOO_LARGE: spreadsheet entry exceeds declared size');
    }
    totalUncompressed += data.length;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error('IMPORT_TOO_LARGE: spreadsheet uncompressed size exceeds limit');
    }
    entries.push({ name, data });
    offset = dataStart + compressedSize;
  }
  return entries;
};

const decodeXmlEntities = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const parseSharedStrings = (xml: string): string[] =>
  [...xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((match) => decodeXmlEntities(match[1] ?? ''));

const columnIndex = (cellRef: string): number => {
  const letters = cellRef.replace(/\d+/g, '');
  let index = 0;
  for (const char of letters) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
};

export const parseDebtorImportXlsx = (buffer: Buffer): DebtorImportParseResult => {
  if (!buffer?.length) {
    throw new Error('EMPTY_XLSX: spreadsheet content must not be empty');
  }
  if (buffer.length > MAX_IMPORT_BYTES) {
    throw new Error('IMPORT_TOO_LARGE: file exceeds 100 MB');
  }

  const entries = extractZipEntries(buffer);
  const sheet = entries.find((entry) => entry.name === 'xl/worksheets/sheet1.xml');
  if (!sheet) {
    throw new Error('EMPTY_XLSX: spreadsheet has no data sheet');
  }

  const shared = entries.find((entry) => entry.name === 'xl/sharedStrings.xml');
  const strings = shared ? parseSharedStrings(shared.data.toString('utf8')) : [];
  const rowsXml = [...sheet.data.toString('utf8').matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];
  if (rowsXml.length === 0) {
    throw new Error('EMPTY_XLSX: spreadsheet has no data rows');
  }

  const grid = rowsXml.map((rowMatch) => {
    const cells = [...rowMatch[1].matchAll(/<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g)];
    const values: string[] = [];
    for (const cell of cells) {
      const col = columnIndex(cell[1]);
      const attrs = cell[3] ?? '';
      const body = cell[4] ?? '';
      let value = '';
      if (/\bt="s"/.test(attrs)) {
        const index = Number((body.match(/<v>(\d+)<\/v>/) ?? [])[1]);
        value = strings[index] ?? '';
      } else if (/\bt="inlineStr"/.test(attrs)) {
        value = decodeXmlEntities((body.match(/<t[^>]*>([^<]*)<\/t>/) ?? [])[1] ?? '');
      } else {
        value = decodeXmlEntities((body.match(/<v>([^<]*)<\/v>/) ?? [])[1] ?? '');
      }
      values[col] = value;
    }
    return values;
  });

  const [header, ...dataRows] = grid;
  if (!header?.length) {
    throw new Error('EMPTY_XLSX: spreadsheet has no data rows');
  }

  const csv = [
    header.join(','),
    ...dataRows.map((row) => header.map((_, index) => row[index] ?? '').join(','))
  ].join('\n');

  return parseDebtorImportCsv(csv);
};

export const MAX_DEBTOR_IMPORT_BYTES = MAX_IMPORT_BYTES;
