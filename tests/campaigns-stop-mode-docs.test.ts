import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const apiDocs = readFileSync(new URL('../docs/campaigns-api.md', import.meta.url), 'utf8');

describe('campaigns API stop mode docs (OP-T-002a)', () => {
  it('documents graceful vs force without inventing stopped enum', () => {
    expect(apiDocs).toContain('OP-T-002a');
    expect(apiDocs).toContain('graceful');
    expect(apiDocs).toContain('force');
    expect(apiDocs).toContain('stopMode');
    expect(apiDocs).toContain('completed');
    expect(apiDocs).toContain('forceInterruptsActiveAttempts');
    expect(apiDocs).toContain('ещё не реализовано');
    expect(apiDocs).toContain('Нет обхода compliance');
    expect(apiDocs).toContain('не вводится');
    expect(apiDocs).toContain('Отдельный enum `stopped`');
    expect(apiDocs).toMatch(/`stopped`.*\*\*не вводится\*\*|не вводится/);
  });
});
