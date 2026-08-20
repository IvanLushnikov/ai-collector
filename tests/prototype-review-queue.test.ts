import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const audit = html.match(/<section class="screen" id="auditLog">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype audit log', () => {
  it('lists staff actions with time, actor, object, change and IP', () => {
    expect(audit).toContain('>Время<');
    expect(audit).toContain('>Кто<');
    expect(audit).toContain('>Объект<');
    expect(audit).toContain('>Что изменилось<');
    expect(audit).toContain('>IP<');
    expect(html).toContain('не зафиксирован');
    expect(html).toContain('function isStaffAuditEvent');
    expect(html).toContain('SYSTEM_AUDIT_ACTORS');
    expect(html).toContain('const escapeHtml=');
    expect(html).toContain('escapeHtml(row.who)');
    expect(html).not.toContain('id="reviewQueue"');
  });
});
