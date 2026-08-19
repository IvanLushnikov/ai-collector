import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype launch confirmation', () => {
  it('confirms limited launch from overview header without sandbox wording', () => {
    expect(html).toContain('function openConfirmLaunch()');
    expect(html).toContain('будет ограничено запущена');
    expect(html).toContain("q('#launchCampaign')?.addEventListener('click'");
    expect(html).toContain('openConfirmLaunch()');
    expect(html).not.toContain('Режим: песочница');
    expect(html).not.toContain('Первые звонки появятся');
    expect(html).not.toContain('полностью автономн');
  });

  it('launches via PATCH campaign status after confirm, fail-closed on API error', () => {
    expect(html).toContain('/status');
    expect(html).toContain("method:'PATCH'");
    expect(html).toContain("'X-User-Role':currentAuth.role");
    expect(html).toContain("status: 'running'");
  });
});
