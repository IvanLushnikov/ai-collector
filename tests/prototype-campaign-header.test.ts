import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype campaign header', () => {
  it('launches from overview header and does not offer open-reason or one-click resume after system pause', () => {
    expect(html).not.toContain('id="openPauseReason"');
    expect(html).not.toContain('Открыть причину');
    expect(html).not.toContain('data-camp-tab-link="launch"');
    expect(html).toMatch(/id="launchCampaign"[^>]*>Запустить кампанию/);
    expect(html).toContain('id="pauseCampaign">Приостановить кампанию');
    expect(html).toContain('id="resumeCampaign"');
    expect(html).toContain('id="stopCampaign">Остановить кампанию');
    expect(html).toMatch(/resumeButton\.style\.display = nextStatus === 'manual_paused' \? 'inline-flex' : 'none'/);
    expect(html).not.toMatch(/openReasonButton\.style\.display = nextStatus === 'auto_paused'/);
  });

  it('fills overview KPI from report API and keeps analytics campaign filter', () => {
    expect(html).toContain('syncCampaignOverviewMetricsFromReport');
    expect(html).toContain("id === 'overview'");
    expect(html).toContain('loadCampaignReport');
    expect(html).toContain('data-analytics-campaign');
    expect(html).toContain('н/д');
  });
});
