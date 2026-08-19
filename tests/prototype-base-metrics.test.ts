import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const base = html.match(/data-camp-view="base"[\s\S]*?data-camp-view="scenario"/)?.[0] ?? '';

describe('prototype base metrics', () => {
  it('shows only upload file name and date without row-level import breakdown', () => {
    expect(base).toContain('id="campaignBaseFileTitle"');
    expect(base).toContain('id="campaignBaseFileMeta"');
    expect(base).toContain('Когда загружали файл базы');
    expect(base).not.toContain('Поле файла');
    expect(base).not.toContain('Принято в базу');
    expect(base).not.toContain('скачать проблемные');
  });
});
