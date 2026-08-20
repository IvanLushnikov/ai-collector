import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const overview = html.match(/<div class="campaign-view active" data-camp-view="overview">[\s\S]*?<div class="campaign-view" data-camp-view="base">/)?.[0] ?? '';

describe('prototype overview', () => {
  it('shows KPI cards without readiness or activity blocks and replaces cost with avg duration', () => {
    expect(overview).toContain('campaignOverviewAvgDurationValue');
    expect(overview).not.toContain('Готовность к запуску');
    expect(overview).not.toContain('Последние действия');
    expect(overview).not.toContain('campaignOverviewCostValue');
    expect(overview).not.toContain('Стоимость');
  });

  it('keeps risk/status banners above KPI and mutes green KPI when not running', () => {
    const riskIdx = overview.indexOf('id="campaignOverviewRiskStack"');
    const kpiIdx = overview.indexOf('id="campaignOverviewKpis"');
    expect(riskIdx).toBeGreaterThan(-1);
    expect(kpiIdx).toBeGreaterThan(riskIdx);
    expect(overview.indexOf('campaignAutoPauseBanner')).toBeGreaterThan(riskIdx);
    expect(overview.indexOf('campaignAutoPauseBanner')).toBeLessThan(kpiIdx);
    expect(overview.indexOf('campaignReviewQueueBanner')).toBeGreaterThan(riskIdx);
    expect(overview.indexOf('campaignReviewQueueBanner')).toBeLessThan(kpiIdx);
    expect(overview).not.toContain('риск-событий нет');
    expect(html).toContain('#campaignOverviewKpis.is-risk .metric.ok');
    expect(html).toContain("overviewKpis.classList.toggle('is-risk'");
  });
});
