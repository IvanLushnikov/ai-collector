import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const landing = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

function countMatches(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0;
}

describe('public GitHub Pages landing', () => {
  it('keeps conversion CTA, cabinet links and inline demo form', () => {
    expect(landing).toContain('ИИ-коллектор');
    expect(landing).toContain('Назначить демо');
    expect(landing).toContain('login.html');
    expect(landing).toContain('register.html');
    expect(landing).toContain('id="demoForm"');
    expect(landing).toContain('id="demo-form"');
    expect(landing).toContain('Спасибо, мы свяжемся с вами в ближайшее время.');
    expect(landing).not.toMatch(/маги[яи]/i);
    expect(landing).not.toContain('demoModalOverlay');
    expect(landing).not.toContain('заявка не отправляется на сервер');
    expect(landing).toContain('class="demo-expect"');
    expect(landing).toMatch(/проверк/i);
    expect(landing).toMatch(/специалист/i);
    expect(landing).toMatch(/журнал/i);
  });

  it('submits demo leads through lead-relay when configured', () => {
    expect(landing).toContain('meta[name="lead-relay-url"]');
    expect(landing).toContain('fetch(relayUrl');
    expect(landing).toContain('organization');
    expect(landing).toContain('id="_hp_name"');
    expect(landing).toContain('id="demoAgree"');
  });

  it('uses hero with product copy and inline demo form instead of side panel', () => {
    const hero = landing.match(/<section class="hero">[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(hero).toContain('hero-grid');
    expect(hero).toContain('hero-form-card');
    expect(hero).toContain('id="demo-form"');
    expect(hero).toContain('hero-points');
    expect(hero).not.toContain('value-strip');
    expect(hero).not.toContain('side-panel');
    expect(hero).not.toContain('hero-actions');

    const h1 = hero.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
    expect(h1).toMatch(/ИИ-коллектор/i);
    expect(h1).toMatch(/управляемый пилот/i);
    expect(h1).not.toMatch(/только там, где/i);
    expect(h1).not.toMatch(/разрешено/i);
  });

  it('orders how-it-works with restriction checks before dialogue', () => {
    const how = landing.match(/id="how-it-works"[\s\S]*?<\/section>/)?.[0] ?? '';
    const checksAt = how.search(/Проверка ограничений перед действиями/i);
    const dialogueAt = how.search(/Ведём управляемый диалог/i);
    expect(checksAt).toBeGreaterThan(-1);
    expect(dialogueAt).toBeGreaterThan(-1);
    expect(checksAt).toBeLessThan(dialogueAt);
    expect(how).not.toMatch(/CSV|XLSX|исходящий контур/i);
  });

  it('shows market segments before secondary roles', () => {
    const roles = landing.match(/id="roles"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(roles).toContain('Сегмент');
    expect(roles).toMatch(/Банки/);
    expect(roles).toMatch(/МФО/);
    expect(roles).toMatch(/ПКО/);
    expect(roles).toContain('Назначить демо');
    const segmentAt = roles.indexOf('Сегмент');
    const roleAt = roles.indexOf('Роли в команде клиента');
    expect(segmentAt).toBeGreaterThan(-1);
    expect(roleAt).toBeGreaterThan(segmentAt);
  });

  it('does not pin a dock CTA over desktop content', () => {
    expect(landing).toMatch(/@media \(min-width:\s*761px\)[\s\S]{0,240}\.sticky-cta\s*\{\s*display:\s*none;/);
  });

  it('keeps demo-form checkbox compact and header CTA readable', () => {
    expect(landing).toContain('.demo-form input:not([type="checkbox"])');
    expect(landing).toContain('.check-row input[type="checkbox"]');
    expect(landing).toContain('.header-nav a.btn-primary');
  });

  it('sells automation first and keeps control secondary', () => {
    expect(landing).not.toContain('Маркетинговый прототип');
    expect(landing).not.toContain('без лишнего шума');
    expect(landing).not.toContain('Звонки только там, где это разрешено');
    expect(landing).toMatch(/автоматизац/i);
    expect(landing).toMatch(/Контроль — часть процесса/i);
    expect(landing).toMatch(/не полностью автономное взыскание/i);
    expect(countMatches(landing, /ограниченн(ый|ого|ом)\s+пилот/gi)).toBeLessThanOrEqual(2);

    const title = landing.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
    expect(title.length).toBeGreaterThan(12);
    expect(title.length).toBeLessThanOrEqual(72);
  });

  it('keeps sticky CTA labeled for demo and reserves mobile bottom space', () => {
    expect(landing).toContain('--sticky-height');
    expect(landing).toMatch(/padding-bottom:\s*var\(--sticky-height\)/);
    expect(landing).toMatch(/@media \(max-width:\s*760px\)[\s\S]{0,200}--sticky-height:\s*84px/);
    const sticky = landing.match(/class="sticky-cta"[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
    expect(sticky).toContain('href="#demo-form"');
    expect(sticky).toContain('Назначить демо');
    expect(sticky).not.toContain('Перейти к форме');
  });
});
