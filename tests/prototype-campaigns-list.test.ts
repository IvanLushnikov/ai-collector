import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const home = html.match(/<section class="screen active" id="home">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype campaigns list on home', () => {
  it('uses a dense ops table with status, reason, mode, progress, updated', () => {
    expect(home).toMatch(/<th[^>]*>Название/);
    expect(home).toMatch(/<th[^>]*>Статус/);
    expect(home).toMatch(/<th[^>]*>Причина/);
    expect(home).toMatch(/<th[^>]*>Режим/);
    expect(home).toMatch(/<th[^>]*>Прогресс/);
    expect(home).toMatch(/<th[^>]*>Обновлено/);
    expect(home).toContain('class="campaign-reason">н/д');
    expect(home).toContain('class="campaign-mode"');
    expect(home).toContain('>демо<');
    expect(home).toContain('class="campaign-updated">н/д');
    expect(home).toContain('class="tag stop">приостановлена системой');
    expect(home).toContain('class="tag warn">приостановлена');
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
