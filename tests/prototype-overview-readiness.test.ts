import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const overview = html.match(/<div class="campaign-view active" data-camp-view="overview">[\s\S]*?<div class="campaign-view" data-camp-view="base">/)?.[0] ?? '';

describe('prototype overview readiness', () => {
  it('does not show four ready checkmarks as facts before the API', () => {
    expect(overview).toContain('Не проверено');
    expect(overview.match(/class="ready-icon">✓/g) ?? []).toHaveLength(0);
    expect(html).not.toContain('Кампания в рабочем режиме. Риск-событий нет.');
  });
});
