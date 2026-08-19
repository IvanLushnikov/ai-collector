import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const home = html.match(/<section class="screen active" id="home">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype home campaign list', () => {
  it('lists campaigns without risk column, row actions or open-reason CTA', () => {
    expect(home).toContain('<h1>Кампании</h1>');
    expect(home).not.toContain('<h1>Главная</h1>');
    expect(home).not.toContain('Риск / причина');
    expect(home).not.toContain('Открыть причину');
    expect(home).not.toContain('>Действия<');
    expect(home).not.toContain('data-open-campaign="report"');
    expect(home).not.toContain('>Открыть<');
    expect(home).not.toContain('>Отчёт<');
    expect(home).not.toContain('3 084');
    expect(home).not.toContain('1 172');
    expect(home).not.toContain('Успешные диалоги');
  });

  it('opens a campaign by name and shows progress as dialed N of M', () => {
    expect(home).toMatch(/data-open-campaign="overview"[^>]*>Просрочка 1–7 дней · Займы/);
    expect(home).toContain('Обзвонили');
    expect(home).toContain('type="checkbox"');
    expect(home).toContain('Создать кампанию');
    expect(home).toContain('Приостановить кампании');
    expect(home).toContain('Продолжить обзвон');
    expect(home).toContain('Остановить кампании');
  });
});
