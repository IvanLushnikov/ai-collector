import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const globalQueue = html.match(/<section class="screen" id="reviewQueue">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype review queue', () => {
  it('renders a table on the global queue screen', () => {
    expect(globalQueue).toContain('id="reviewQueueBody"');
    expect(globalQueue).toContain('<tbody');
    expect(html).toContain('function renderReviewQueue()');
    expect(html).toContain("fillBody(tbody)");
  });

  it('does not change campaign status from a review decision', () => {
    const fn = html.match(/function updateReviewDecision[\s\S]*?\n  \}/)?.[0] ?? '';
    expect(fn).not.toContain('setCampaignState');
    expect(html).not.toMatch(/option value="manual_override"/);
    expect(html).not.toMatch(/option value="legal_review"/);
    expect(html).toContain('Подтвердить разбор');
    expect(html).toContain('Оставить в очереди');
  });
});
