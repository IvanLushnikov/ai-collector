import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const mapping = html.match(/id="mappingBlock"[\s\S]*?<\/div><\/div><\/div>/)?.[0] ?? html;

describe('prototype import mapping', () => {
  it('maps timezone, debt status and consent status', () => {
    expect(mapping).toContain('Часовой пояс');
    expect(mapping).toContain('Статус долга');
    expect(mapping).toContain('Статус согласия');
    expect(mapping).not.toContain('будут допущены после исключений');
  });

  it('keeps separate copy for accepted into base vs admitted to calls', () => {
    expect(mapping).toContain('Принято в базу');
    expect(mapping).toContain('ещё не допуск к звонку');
  });
});
