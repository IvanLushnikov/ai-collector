import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');
const home = html.match(/<section class="screen active" id="home">[\s\S]*?<\/section>/)?.[0] ?? '';

describe('prototype supervisor monitor (OP-D-013 P2)', () => {
  it('keeps prototype.html and public/prototype.html identical', () => {
    expect(publicHtml).toBe(html);
  });

  it('shows a compact P2 monitor table without KPI cards or wallboard patterns', () => {
    expect(home).toContain('id="supervisorMonitorP2"');
    expect(home).toContain('class="p2-mark">P2<');
    expect(home).toContain('>Прогресс<');
    expect(home).toContain('>Риск<');
    expect(home).toContain('>Очередь проверки<');
    expect(home).toContain('id="supervisorMonitorBody"');
    expect(home).toContain('OP-D-013 wireframe');
    expect(home).not.toMatch(/class="grid g4"/);
    expect(home).not.toContain('class="metric ');
    expect(html).toContain('.supervisor-monitor-p2');
    expect(html).toContain('.p2-mark');
  });

  it('defines render helpers for supervisor monitor rows', () => {
    expect(html).toContain('renderSupervisorMonitor');
    expect(html).toContain('supervisorMonitorRiskLabel');
    expect(html).toContain('reviewOpenCountsByCampaign');
    expect(html).toContain('supervisorMonitorOperationalStatuses');
    expect(html).toContain('no wallboard / gamification');
  });
});
