import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const landing = readFileSync(new URL('../landing.html', import.meta.url), 'utf8');
const registerPage = readFileSync(new URL('../register.html', import.meta.url), 'utf8');
const loginPage = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
const privacy = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
const terms = readFileSync(new URL('../terms.html', import.meta.url), 'utf8');
const gateway = readFileSync(new URL('../scripts/dev-gateway.mjs', import.meta.url), 'utf8');

describe('landing and legal pages', () => {
  it('shows a registration CTA and links to legal pages', () => {
    expect(landing).toContain('ИИ-коллектор');
    expect(landing).toContain('register.html');
    expect(landing).toContain('Создать аккаунт');
    expect(landing).toContain('privacy.html');
    expect(landing).toContain('terms.html');
    expect(landing).not.toMatch(/маги[яи]/i);
  });
});

describe('auth forms', () => {
  it('validates registration fields next to inputs and posts to /auth/register', () => {
    expect(registerPage).toContain('Название организации');
    expect(registerPage).toContain('id="organizationNameError"');
    expect(registerPage).toContain('id="emailError"');
    expect(registerPage).toContain('id="passwordError"');
    expect(registerPage).toContain('/auth/register');
    expect(registerPage).toContain('prototype.html');
    expect(registerPage).toContain('credentials');
  });

  it('validates login fields and posts to /auth/login', () => {
    expect(loginPage).toContain('id="emailError"');
    expect(loginPage).toContain('id="passwordError"');
    expect(loginPage).toContain('/auth/login');
    expect(loginPage).toContain('prototype.html');
  });
});

describe('dev-gateway public entry', () => {
  it('redirects / to landing.html and proxies /auth', () => {
    expect(gateway).toContain("Location: '/landing.html'");
    expect(gateway).toMatch(/['"]\/auth['"]/);
  });
});

describe('legal pages exist', () => {
  it('has privacy and terms in Russian without promising extra legal coverage', () => {
    expect(privacy).toContain('Политика конфиденциальности');
    expect(terms).toContain('Условия использования');
  });
});
