import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const campaigns = html.match(/<section class="screen" id="campaigns">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype campaigns list', () => {
  it('shows auto-pause in the filter and opens launch from the reason CTA', () => {
    expect(campaigns).toContain('Автопауза');
    expect(campaigns).toContain('data-open-campaign="launch">Открыть причину');
    expect(campaigns).toContain('демо');
    expect(campaigns).not.toMatch(/data-open-campaign="settings">Перенастроить/);
  });
});
