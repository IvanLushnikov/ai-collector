import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype campaign header', () => {
  it('keeps open-reason as the primary auto-pause CTA toward launch', () => {
    expect(html).toContain('id="openPauseReason"');
    expect(html).toContain('data-camp-tab-link="launch"');
    expect(html).toContain('Открыть причину');
    expect(html).toMatch(/openReasonButton\.style\.display = nextStatus === 'auto_paused'/);
    expect(html).toMatch(/settingsButton\.style\.display = nextStatus === 'auto_paused' \? 'none'/);
  });
});
