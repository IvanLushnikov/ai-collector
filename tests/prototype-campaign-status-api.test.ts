import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype campaign status commands', () => {
  it('waits for the server status API before updating a manual pause or continuation', () => {
    expect(html).toContain("async function persistCampaignStatus(status)");
    expect(html).toContain("/campaigns/${context.campaignId}/status");
    expect(html).toContain("body:JSON.stringify({status})");
    expect(html).toContain("await persistCampaignStatus('manual_paused')");
    expect(html).toContain("persistCampaignStatus('running')");
    expect(html).toContain("Статус кампании не изменён.");
  });
});
