import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype import report', () => {
  it('shows found / ready / fix / duplicate counters and marks the sample file', () => {
    expect(html).toContain('id="importFoundCount"');
    expect(html).toContain('id="importReadyCount"');
    expect(html).toContain('id="importFixCount"');
    expect(html).toContain('id="importDupCount"');
    expect(html).toContain('Это пример, не боевой импорт');
    expect(html).toContain('Продолжить с принятыми записями');
    expect(html).toContain('Исправить файл');
  });
});
