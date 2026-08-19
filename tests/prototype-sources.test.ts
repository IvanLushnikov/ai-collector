import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const sources = html.match(/<section class="screen" id="sources">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype sources', () => {
  it('offers file upload and API contract without not-in-this-release cards', () => {
    expect(sources).toContain('Загрузка файла');
    expect(sources).toContain('Подключить по API');
    expect(sources).not.toContain('не в этом релизе');
    expect(sources).toContain('не подключено');
    expect(html).toContain('id="apiSourceModal"');
  });
});
