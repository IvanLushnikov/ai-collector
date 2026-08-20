import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype pause-before-edit (OP-T-006)', () => {
  it('locks scenario and telephony edits while running or auto_paused', () => {
    expect(html).toContain('Сначала приостановите кампанию');
    expect(html).toContain('id="scenarioEditLockNotice"');
    expect(html).toContain('id="phoneEditLockNotice"');
    expect(html).toContain('function applyPauseBeforeEditLocks');
    expect(html).toContain("campaignLifecycle.status === 'running' || campaignLifecycle.status === 'auto_paused'");
    expect(html).toContain('saveScenario.disabled = locked');
  });
});
