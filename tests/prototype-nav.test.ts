import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype navigation', () => {
  it('exposes telephony and scripts from the sidebar', () => {
    expect(html).toMatch(/data-screen="telephony">Интеграции/);
    expect(html).toMatch(/data-screen="scripts">Сценарии/);
    expect(html).toContain('id="telephony"');
    expect(html).toContain('id="scripts"');
  });
});
