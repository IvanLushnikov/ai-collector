import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');

describe('prototype audit decision trail from API (review fix)', () => {
  it('mapApiAuditItem keeps metadata previous/next for formatAuditTransition', () => {
    expect(html).toContain('function mapApiAuditItem');
    expect(html).toMatch(/function mapApiAuditItem[\s\S]*?metadata,/);
    expect(html).toMatch(/function mapApiAuditItem[\s\S]*?previousValue:/);
    expect(html).toMatch(/function mapApiAuditItem[\s\S]*?nextValue:/);
    expect(html).toContain('formatAuditTransition(item, metadata)');
    expect(html).toContain('metadata.previousValue');
    expect(html).toContain('metadata.nextValue');
  });

  it('keeps root and public prototype identical', () => {
    const rootHash = createHash('sha256').update(html).digest('hex');
    const publicHash = createHash('sha256').update(publicHtml).digest('hex');
    expect(publicHash).toBe(rootHash);
  });

  it('loads live audit logs with actionGroup query from auditKindFilter', () => {
    expect(html).toContain('function auditKindFilterToActionGroup');
    expect(html).toContain('?actionGroup=${encodeURIComponent(actionGroup)}');
    expect(html).toContain("if (auditLogSource === 'live')");
    expect(html).toContain("q('#auditKindFilter')?.addEventListener('change',async ()=>{");
  });
});
