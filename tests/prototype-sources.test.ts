import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const sources = html.match(/<section class="screen" id="sources">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype sources', () => {
  it('marks exchange and folder as not in this release', () => {
    expect(sources).toContain('не в этом релизе');
    expect(sources).not.toContain('подключена');
    expect(sources).toContain('Загрузка файла');
  });
});
