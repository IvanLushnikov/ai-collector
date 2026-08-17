import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { transitionDialogue } from '../../src/dialogue/state-machine.js';

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), 'golden');

type GoldenCase = {
  id: string;
  title: string;
  userText: string;
  expected: { outcome: string; state: string };
};

const cases: GoldenCase[] = readdirSync(goldenDir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(join(goldenDir, name), 'utf8')) as GoldenCase);

describe('dialogue golden set', () => {
  it('loads at least five synthetic cases without real PII', () => {
    expect(cases.length).toBeGreaterThanOrEqual(5);
    for (const item of cases) {
      expect(item.userText).not.toMatch(/\+7\d{10}/);
    }
  });

  it.each(cases)('$id requests handoff or stays fail-closed', (item) => {
    const next = transitionDialogue({
      state: 'identity',
      identityVerified: false,
      debtAmount: 1000
    }, { type: 'handoff_requested' });
    expect(next).toBe('handoff');
    expect(item.expected.state).toBe('handoff');
  });
});
