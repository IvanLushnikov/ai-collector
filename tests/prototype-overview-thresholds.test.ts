import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');
const overview = html.match(/<div class="campaign-view active" data-camp-view="overview">[\s\S]*?<div class="campaign-view" data-camp-view="base">/)?.[0] ?? '';

describe('prototype overview metric thresholds', () => {
  it('keeps prototype.html and public/prototype.html identical', () => {
    expect(publicHtml).toBe(html);
  });

  it('defines UI threshold constants and helpers with comments', () => {
    expect(html).toContain('overviewMetricThresholds');
    expect(html).toContain('blockedSharePct');
    expect(html).toContain('reviewOpenCount');
    expect(html).toContain('connectSharePct');
    expect(html).toContain('Not client SLA');
    expect(html).toContain('overviewMetricStateFromBands');
    expect(html).toContain('applyOverviewMetricTone');
  });

  it('shows compliance-oriented overview KPI cards with dynamic tone hooks', () => {
    expect(overview).toContain('id="campaignOverviewBlockedMetric"');
    expect(overview).toContain('id="campaignOverviewReviewOpenMetric"');
    expect(overview).toContain('id="campaignOverviewCompletedMetric"');
    expect(overview).toContain('Блокировки');
    expect(overview).toContain('Очередь проверки');
    expect(html).toContain('applyOverviewMetricTone(');
    expect(html).toContain('overviewMetricThresholds.blockedSharePct');
    expect(html).toContain('overviewMetricThresholds.reviewOpenCount');
    expect(html).toContain('overviewMetricThresholds.connectSharePct');
  });

  it('uses state border colors without glow animation', () => {
    expect(html).toContain('.metric.stop{border-top:3px solid var(--red)}');
    expect(html).not.toMatch(/glow|@keyframes/i);
    expect(html).toContain('#campaignOverviewKpis.is-risk .metric.warn');
  });
});
