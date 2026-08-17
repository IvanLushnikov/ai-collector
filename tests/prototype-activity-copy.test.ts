import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype activity copy', () => {
  it('uses operator-facing phrases instead of internal state names', () => {
    expect(html).not.toContain('campaign state:');
    expect(html).not.toContain('safe-resume выполнен');
    expect(html).toContain('Кампания приостановлена системой.');
  });
});
