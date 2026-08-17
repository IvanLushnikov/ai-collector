import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype report role', () => {
  it('marks the role selector as a rights demo', () => {
    expect(html).toContain('Демонстрация прав');
    expect(html).not.toContain('Роль для принятия решений');
    expect(html).not.toContain('Compliance officer');
    expect(html).toContain('Специалист по ограничениям');
  });
});
