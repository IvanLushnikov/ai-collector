import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const home = html.match(/<section class="screen active" id="home">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype campaigns list on home', () => {
  it('keeps only agreed columns and mass actions on the home list', () => {
    expect(home).toMatch(/<th[^>]*>Название/);
    expect(home).toMatch(/<th[^>]*>Статус/);
    expect(home).toMatch(/<th[^>]*>Прогресс/);
    expect(home).not.toContain('Риск / причина');
    expect(home).not.toContain('Открыть причину');
    expect(home).not.toMatch(/data-open-campaign="settings">Перенастроить/);
    expect(home).not.toContain('Автопауза');
    expect(home).toContain('приостановлена системой');
    expect(html).not.toContain('id="campaigns"');
  });

  it('loads home campaigns from GET /tenants/:tenantId/campaigns (не demo/local)', () => {
    expect(html).toContain('`${reportApiBaseUrl}/tenants/${context.tenantId}/campaigns`');
  });
});
