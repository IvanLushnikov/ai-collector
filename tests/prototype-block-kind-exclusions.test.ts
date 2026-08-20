import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const base = html.match(/data-camp-view="base"[\s\S]*?data-camp-view="scenario"/)?.[0] ?? html;

describe('prototype block kind exclusions (OP-D-009)', () => {
  it('defines domain blockKind labels, classes, hints and render helper', () => {
    expect(html).toContain("permanent:'Постоянное исключение'");
    expect(html).toContain("temporary:'Временная блокировка'");
    expect(html).toContain("campaign_pause:'Пауза кампании'");
    expect(html).toContain('formatBlockKindClass');
    expect(html).toContain('formatBlockKindHint');
    expect(html).toContain('renderBlockKindBlock');
    expect(html).toContain("permanent:'block-permanent'");
    expect(html).toContain("temporary:'block-temporary'");
    expect(html).toContain("campaign_pause:'block-campaign-pause'");
    expect(html).toContain("BLOCK_KIND_ORDER=['permanent','temporary','campaign_pause']");
  });

  it('visually separates the three restriction types on Base with one-sentence hints', () => {
    expect(base).toContain('id="campaignBaseWhyNotCalledPanel"');
    expect(base).toContain('Почему не звонили');
    expect(base).toContain('id="campaignBaseBlockKindLegend"');
    expect(base).toContain('id="campaignBaseHoldTableBody"');
    expect(html).toContain('base-block-kind-legend');
    expect(html).toContain('base-block-kind-card');
    expect(html).toContain('renderCampaignBasePanel');
    expect(html).toContain('renderBlockKindLegendHtml');
    expect(html).toMatch(/permanent:[\s\S]{0,120}списке исключений/);
    expect(html).toMatch(/temporary:[\s\S]{0,120}Ограничение временное/);
    expect(html).toMatch(/campaign_pause:[\s\S]{0,120}Кампания приостановлена/);
    expect(html).toContain('.tag.block-permanent');
    expect(html).toContain('.tag.block-temporary');
    expect(html).toContain('.tag.block-campaign-pause');
  });

  it('shows blockKind in calls journal and call card without inventing new kinds', () => {
    expect(html).toContain('renderBlockKindBlock(item.complianceDecision?.blockKind');
    expect(html).toContain('renderBlockKindBlock(displayItem.complianceDecision?.blockKind');
    expect(html).toContain("blockKind:'permanent'");
    expect(html).toContain("blockKind:'temporary'");
    expect(html).toContain("blockKind:'campaign_pause'");
    expect(html).toContain('formatBlockKindTerm');
    expect(html).toMatch(/id === 'base'[\s\S]{0,80}renderCampaignBasePanel/);
  });

  it('keeps prototype.html and public/prototype.html identical', () => {
    const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');
    expect(publicHtml).toBe(html);
  });
});
