import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');
const staticHtml = html.split('<script>')[0];

const forbiddenVisible = [
  'wrap-up',
  'safe-resume',
  'safe resume',
  'Автопауза',
  'автопауз',
  'Compliance:',
  'Нужна проверка',
  '>live<',
  "textContent = 'live'",
  "label: 'live'",
  'QA-бэклог',
  'QA-аналитик',
  'Controlled launch',
  'validation template',
  'probe-сценар',
  'probe-коннект',
  'production-контуре',
  'tone-guard',
  'policy guard',
  'test connection',
  'live-response',
  "|| 'n/a'",
  'Policy decision',
  'Compliance engine',
  'LLM guard',
  "'Handoff'",
];

describe('prototype microcopy (OP-D-011)', () => {
  it('keeps prototype.html and public/prototype.html in sync', () => {
    expect(publicHtml).toBe(html);
  });

  it('uses RU B2B ops phrases instead of forbidden visible anglicisms', () => {
    for (const phrase of forbiddenVisible) {
      expect(html).not.toContain(phrase);
    }
    expect(staticHtml).not.toMatch(/>\s*running\s*</i);
    expect(html).toContain('Приостановлена системой');
    expect(html).toContain('Требует проверки');
    expect(html).toContain('Причины блокировок');
    expect(html).toContain('Решение по ограничениям:');
    expect(html).toContain("badge.textContent = 'бой'");
  });
});
