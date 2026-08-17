import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const base = html.match(/data-camp-view="base"[\s\S]*?data-camp-view="scenario"/)?.[0] ?? '';

describe('prototype base metrics', () => {
  it('separates accepted-into-base from call eligibility', () => {
    expect(base).toContain('Принято в базу');
    expect(base).toContain('Допуск к звонку не равен приёму в базу');
    expect(base).not.toContain('>Допущено<');
    expect(base).not.toContain('скачать проблемные');
  });
});
