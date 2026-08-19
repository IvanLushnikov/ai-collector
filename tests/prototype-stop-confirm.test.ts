import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype stop confirmation', () => {
  it('confirms stop as completed without a one-step toast', () => {
    expect(html).toContain('Остановить кампанию?');
    expect(html).toContain("setCampaignState('completed'");
    expect(html).not.toContain("setCampaignState('stopped'");
    expect(html).toContain("label:'завершена'");
  });

  it('stops via PATCH completed and does not invent a stopped enum', () => {
    expect(html).toContain("status: 'completed'");
    expect(html).toContain('/status');
    expect(html).not.toContain("status: 'stopped'");
  });
});
