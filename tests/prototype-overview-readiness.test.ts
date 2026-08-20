import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const overview = html.match(/<div class="campaign-view active" data-camp-view="overview">[\s\S]*?<div class="campaign-view" data-camp-view="base">/)?.[0] ?? '';

describe('prototype overview', () => {
  it('shows KPI cards and launch building blocks without legacy readiness title', () => {
    expect(overview).toContain('campaignOverviewBlockedValue');
    expect(overview).toContain('campaignOverviewReviewOpenValue');
    expect(overview).toContain('campaignOverviewBlocksPanel');
    expect(overview).toContain('campaignReadinessBlocks');
    expect(overview).not.toContain('Готовность к запуску');
    expect(overview).not.toContain('Последние действия');
    expect(overview).not.toContain('campaignOverviewCostValue');
    expect(overview).not.toContain('Стоимость');
    expect(overview).toContain('overviewAnalyticsLink');
  });

  it('keeps risk/status banners above KPI and mutes neutral KPI when not running', () => {
    const riskIdx = overview.indexOf('id="campaignOverviewRiskStack"');
    const kpiIdx = overview.indexOf('id="campaignOverviewKpis"');
    expect(riskIdx).toBeGreaterThan(-1);
    expect(kpiIdx).toBeGreaterThan(riskIdx);
    expect(overview.indexOf('campaignAutoPauseBanner')).toBeGreaterThan(riskIdx);
    expect(overview.indexOf('campaignAutoPauseBanner')).toBeLessThan(kpiIdx);
    expect(overview.indexOf('campaignReviewQueueBanner')).toBeGreaterThan(riskIdx);
    expect(overview.indexOf('campaignReviewQueueBanner')).toBeLessThan(kpiIdx);
    expect(overview).not.toContain('риск-событий нет');
    expect(html).toContain('#campaignOverviewKpis.is-risk .metric.info');
    expect(html).toContain("overviewKpis.classList.toggle('is-risk'");
  });
});
