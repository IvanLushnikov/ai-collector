import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype calls journal', () => {
  it('uses API handoff outcome and human-readable decisions', () => {
    expect(html).toContain('value="handoff">Перевод оператору');
    expect(html).not.toContain('value="transferred"');
    expect(html).toContain('Статус попытки');
    expect(html).toContain('formatDecisionLabel');
    expect(html).not.toContain('Источник исхода');
  });
});
