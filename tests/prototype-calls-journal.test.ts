import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const calls = html.match(/data-camp-view="calls"[\s\S]*?<\/section>/)?.[0] ?? html;

describe('prototype calls journal', () => {
  it('opens a debtor by name and keeps attempt outcome separate from conversation result', () => {
    expect(calls).toContain('Должник');
    expect(calls).toContain('Статус попытки');
    expect(html).toContain('debtor-link');
    expect(html).toContain('value="handoff">Перевод оператору');
    expect(html).not.toContain('value="transferred"');
    expect(calls).not.toContain('>Карточка<');
    expect(html).toContain('Звонков пока нет');
  });
});
