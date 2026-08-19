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
});
