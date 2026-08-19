import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const landing = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

function countMatches(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0;
}

describe('public GitHub Pages landing', () => {
  it('keeps conversion CTA, cabinet links and demo form', () => {
    expect(landing).toContain('ИИ-коллектор');
    expect(landing).toContain('Назначить демо');
    expect(landing).toContain('login.html');
    expect(landing).toContain('register.html');
    expect(landing).toContain('id="demoForm"');
    expect(landing).toContain('Спасибо, мы свяжемся с вами в ближайшее время.');
    expect(landing).not.toMatch(/маги[яи]/i);
  });

  it('keeps hero CTAs to one primary action and one secondary link', () => {
    const heroActions = landing.match(/<div class="hero-actions">[\s\S]*?<\/div>/);
    expect(heroActions?.[0]).toBeTruthy();
    expect(countMatches(heroActions![0], /class="btn btn-primary"/g)).toBe(1);
    expect(countMatches(heroActions![0], /class="btn btn-secondary"/g)).toBe(1);
    expect(heroActions![0]).toContain('#how-it-works');
    expect(heroActions![0]).not.toContain('login.html');
  });

  it('does not pin a dock CTA over desktop content', () => {
    expect(landing).toMatch(/@media \(min-width:\s*761px\)[\s\S]{0,240}\.sticky-cta\s*\{\s*display:\s*none;/);
  });

  it('uses short product copy instead of prototype jargon', () => {
    expect(landing).not.toContain('Маркетинговый прототип');
    expect(landing).not.toContain('без лишнего шума');
    expect(countMatches(landing, /ограниченн(ый|ого|ом)\s+пилот/gi)).toBeLessThanOrEqual(2);
    const title = landing.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
    expect(title.length).toBeGreaterThan(12);
    expect(title.length).toBeLessThanOrEqual(72);
  });
});
