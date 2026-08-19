import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype pause confirmation', () => {
  it('asks before pausing and does not use a bare Pause label', () => {
    expect(html).toContain('Приостановить кампанию?');
    expect(html).toContain('Новые звонки не создаются.');
    expect(html).toContain('id="pauseCampaign">Приостановить кампанию');
    expect(html).not.toContain('id="pauseCampaign">Пауза');
    expect(html).toContain('Продолжить обзвон');
  });

  it('keeps manual pause as a local UI state, not an API enum', () => {
    expect(html).toContain("setCampaignState('manual_paused'");
    expect(html).not.toContain("status: 'manual_paused'");
    expect(html).not.toContain("status: 'stopped'");
  });
});
