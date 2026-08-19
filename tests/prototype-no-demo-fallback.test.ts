import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype evidence views', () => {
  it('does not replace unavailable call or audit evidence with demo data', () => {
    expect(html).not.toContain('Используем демо-события');
    expect(html).not.toContain('Используем демо-данные');
    expect(html).toContain("auditLogItems=[]");
    expect(html).toContain("callCards=[]");
  });
});
