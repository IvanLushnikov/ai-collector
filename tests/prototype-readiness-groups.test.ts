import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype readiness groups', () => {
  it('splits blocking and warning reasons and does not start limits as applied', () => {
    expect(html).toContain('id="campaignLaunchLimitsStatus">Нужна проверка');
    expect(html).toMatch(/id="readinessLimitsStatus"[^>]*>Нужна проверка/);
    expect(html).toContain('Блокирует запуск');
    expect(html).toContain('id="campaignLaunchBlockingReasons"');
    expect(html).toContain('id="campaignLaunchWarningReasons"');
    expect(html).toContain('Системный минимум 08:00–22:00');
  });
});
