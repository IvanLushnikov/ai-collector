import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype analytics', () => {
  it('shows four agreed metrics for all campaigns with a single-campaign filter', () => {
    const analytics = html.match(/<section class="screen" id="analytics">[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(analytics).toContain('id="analytics"');
    expect(analytics).toContain('Обзвонено');
    expect(analytics).toContain('Соединилось');
    expect(analytics).toContain('Обещания');
    expect(analytics).toContain('из завершённых разговоров');
    expect(analytics).toContain('Стоимость');
    expect(analytics).toContain('id="analyticsCampaignFilter"');
    expect(analytics).toContain('Период');
    expect(html).toMatch(/data-screen-link="analytics"[^>]*>Аналитика/);
    expect(html).not.toContain('data-camp-view="report"');
  });

  it('loads analytics from campaign report API instead of hardcoded byCampaign only', () => {
    expect(html).toContain('async function renderAnalytics');
    expect(html).toContain('/report');
    expect(html).toContain("q('#analyticsNotice')");
  });
});
