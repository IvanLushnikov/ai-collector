import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const scenario = html.match(/data-camp-view="scenario"[\s\S]*?data-camp-view="phone"/)?.[0] ?? '';

describe('prototype campaign scenario', () => {
  it('exposes only client-editable scenario fields and hides conversation logic', () => {
    expect(scenario).toContain('Шаблон');
    expect(scenario).toContain('Голос');
    expect(scenario).toContain('Первая фраза');
    expect(scenario).toContain('Максимальная длительность');
    expect(scenario).toContain('Перевод оператору');
    expect(scenario).not.toContain('script-flow');
    expect(scenario).not.toContain('Представиться');
    expect(html).not.toContain('id="scripts"');
  });
});
