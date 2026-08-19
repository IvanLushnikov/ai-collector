import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype test call', () => {
  it('does not start the campaign from the connection check', () => {
    const handler = html.match(/q\('#runTestCall'\)\?\.addEventListener\('click',[\s\S]*?\}\);/)?.[0] ?? '';
    expect(handler).not.toContain("setCampaignState('running'");
    expect(html).toContain('Проверить соединение');
    expect(html).toContain('Кампания не запущена');
  });
});
