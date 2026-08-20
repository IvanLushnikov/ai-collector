import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const audit = html.match(/<section class="screen" id="auditLog">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype audit log', () => {
  it('renders a decision-trail table with was→became and kind filters', () => {
    expect(audit).toContain('>Время<');
    expect(audit).toContain('>Кто<');
    expect(audit).toContain('>Событие<');
    expect(audit).toContain('>Объект<');
    expect(audit).toContain('>Было → стало<');
    expect(audit).toContain('>Почему<');
    expect(audit).toContain('id="auditKindFilter"');
    expect(audit).toContain('Решения');
    expect(audit).toContain('Статусы кампании');
    expect(audit).toContain('Блокировки');
    expect(audit).toContain('Пока нет зафиксированных действий');
    expect(audit).not.toContain('>IP<');
    expect(html).toContain('formatAuditTransition');
    expect(html).toContain('function isStaffAuditEvent');
    expect(html).toContain('SYSTEM_AUDIT_ACTORS');
    expect(html).not.toContain('id="reviewQueue"');
  });
});
