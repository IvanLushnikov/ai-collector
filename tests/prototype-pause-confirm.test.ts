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

  it('persists manual pause through the status API before changing the UI', () => {
    expect(html).toContain("await persistCampaignStatus('manual_paused')");
    expect(html).toContain("persistCampaignStatus('running')");
    expect(html).toContain("body:JSON.stringify({status})");
    expect(html).not.toContain("status: 'stopped'");
  });
});
