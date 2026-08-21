import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');

describe('prototype audit actor type (OP-T-010)', () => {
  it('formatActorLabel uses metadata.actorType when present', () => {
    expect(html).toMatch(/const formatActorLabel=\(actor='',\s*metadata=\{\}\)=>/);
    expect(html).toContain("metadata?.actorType === 'system'");
    expect(html).toContain("metadata?.actorType === 'user'");
    expect(html).toContain('formatActorLabel(item.actor, item.metadata)');
  });

  it('mapApiAuditItem passes actorType and actorRole from metadata', () => {
    expect(html).toMatch(/function mapApiAuditItem[\s\S]*?actorType: metadata\.actorType/);
    expect(html).toMatch(/function mapApiAuditItem[\s\S]*?actorRole: metadata\.actorRole/);
    expect(html).toContain("entry.metadata?.actorType === 'system'");
  });

  it('keeps root and public prototype identical', () => {
    const rootHash = createHash('sha256').update(html).digest('hex');
    const publicHash = createHash('sha256').update(publicHtml).digest('hex');
    expect(publicHash).toBe(rootHash);
  });
});
