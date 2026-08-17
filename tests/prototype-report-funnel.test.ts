import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype report funnel', () => {
  it('does not drill completed into all outcomes', () => {
    expect(html).toContain('data-report-outcome="completed"');
    expect(html).toContain('завершённые попытки, не все исходы');
    expect(html).not.toMatch(/<small>Завершено<\/small><b id="reportCompletedCalls">—<\/b><span class="report-kpi-subline">перейти к завершённым звонкам<\/span>/);
  });
});
