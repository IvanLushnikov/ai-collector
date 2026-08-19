import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const wizard = html.match(/id="campaignWizard"[\s\S]*?id="phoneModal"/)?.[0] ?? '';

describe('prototype wizard', () => {
  it('uses four steps and finishes on overview without a pre-launch check step', () => {
    expect(wizard).toContain('data-wstep="1">1. Кампания');
    expect(wizard).toContain('data-wstep="2">2. База');
    expect(wizard).toContain('data-wstep="3">3. Сценарий');
    expect(wizard).toContain('data-wstep="4">4. Телефония');
    expect(wizard).not.toContain('data-wstep="5"');
    expect(wizard).not.toContain('Проверка перед запуском');
    expect(html).toContain("q('#wizardCreate').style.display=wizardStep===4");
    expect(html).toContain('Перейти к обзору');
  });
});
