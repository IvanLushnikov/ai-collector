import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const scripts = html.match(/<section class="screen" id="scripts">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype scripts library', () => {
  it('labels the dialog preview as a test dialog', () => {
    expect(scripts).toContain('data-test-dialog>Тестовый диалог');
    expect(scripts).not.toContain('Прослушать');
  });
});
