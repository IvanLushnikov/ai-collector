import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const home = html.match(/<section class="screen active" id="home">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype home risk column', () => {
  it('uses open-reason CTA for auto-pause and has no bare KPI columns', () => {
    expect(home).toContain('Риск / причина');
    expect(home).toContain('data-open-campaign="launch">Открыть причину');
    expect(home).not.toContain('Перенастроить');
    expect(home).not.toContain('3 084');
    expect(home).not.toContain('1 172');
    expect(home).not.toContain('Успешные диалоги');
  });
});
