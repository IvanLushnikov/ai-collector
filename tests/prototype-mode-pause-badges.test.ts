import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const home = html.match(/<section class="screen active" id="home">[\s\S]*?<\/section>/)?.[0] ?? '';
const calls = html.match(/data-camp-view="calls"[\s\S]*?<\/section>/)?.[0] ?? html;

describe('prototype mode and pause badges (OP-D-007)', () => {
  it('distinguishes system pause from manual pause without shared styling', () => {
    expect(html).toContain("campaignLifecycle.status === 'auto_paused'");
    expect(html).toMatch(/auto_paused[\s\S]{0,120}tag stop/);
    expect(html).toMatch(/manual_paused[\s\S]{0,120}tag warn/);
    expect(home).toContain('class="tag stop">приостановлена системой');
    expect(home).toContain('class="tag warn">приостановлена');
    expect(html).toContain("id=\"campaignAutoPauseBanner\"");
    expect(html).toContain("id=\"campaignManualPauseBanner\"");
  });

  it('shows live/демо mode badges in campaign header and call rows when source is known', () => {
    expect(html).toContain('id="campaignModeBadge"');
    expect(html).toContain('syncCampaignModeBadge');
    expect(html).toContain("badge.textContent = 'бой'");
    expect(html).toContain("badge.textContent = 'демо'");
    expect(calls).toContain('id="callsDataSourceBadge"');
    expect(html).toContain('formatCallSourceBadge');
    expect(html).toContain('data-call-source-badge');
  });
});
