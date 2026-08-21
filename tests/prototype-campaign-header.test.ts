import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype campaign header', () => {
  it('changes status from the status badge menu and shows percent-only progress', () => {
    expect(html).not.toContain('id="openPauseReason"');
    expect(html).not.toContain('Открыть причину');
    expect(html).not.toContain('data-camp-tab-link="launch"');
    expect(html).toMatch(/id="launchCampaign"[^>]*>Запустить кампанию/);
    expect(html).toContain('id="campaignStatusMenu"');
    expect(html).toContain('applyCampaignStatusFromMenu');
    expect(html).not.toContain('id="pauseCampaign">Приостановить кампанию');
    expect(html).not.toContain('id="stopCampaign">Остановить кампанию');
    expect(html).toContain('formatCampaignProgressLabel');
    expect(html).toContain('formatCampaignProgressLabel(snapshot)');
    expect(html).toContain('68% обзвонили');
  });

  it('fills overview KPI from report API and keeps analytics campaign filter', () => {
    expect(html).toContain('syncCampaignOverviewMetricsFromReport');
    expect(html).toContain("id === 'overview'");
    expect(html).toContain('loadCampaignReport');
    expect(html).toContain('data-analytics-campaign');
    expect(html).toContain('campaignOverviewBlockedValue');
    expect(html).toContain('campaignOverviewReviewOpenValue');
  });
});
