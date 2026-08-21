import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');

describe('prototype stop confirmation (OP-D-014)', () => {
  it('keeps prototype.html and public/prototype.html identical', () => {
    expect(publicHtml).toBe(html);
  });

  it('confirms graceful stop as completed without mixing force copy', () => {
    expect(html).toContain('Остановить кампанию?');
    expect(html).toContain('будет завершена');
    expect(html).toContain('Активные звонки этим действием не прерываются');
    expect(html).toContain('нужен новый запуск');
    expect(html).toContain("setCampaignState('completed'");
    expect(html).toContain("setCampaignState('stopping'");
    expect(html).toContain("label:'останавливается…'");
    expect(html).not.toContain("setCampaignState('stopped'");
    expect(html).toContain("label:'завершена'");
    expect(html).not.toContain('Немедленной принудительной остановки');
    expect(html).toContain("patchCampaignStatus('completed','graceful')");
    expect(html).not.toContain('Force Stop');
  });

  it('offers a separate force stop branch wired to stopMode force', () => {
    expect(html).toContain('Остановить немедленно?');
    expect(html).toContain('Остановить немедленно');
    expect(html).toContain("status:'completed_force'");
    expect(html).toContain("patchCampaignStatus('completed','force')");
    expect(html).toContain('buildForceStopWarningSuffix');
    expect(html).toContain('прервать активные звонки');
    expect(html).toContain('live-поставщиках (Exolve, Mango) прерывание активных звонков пока ограничено');
    expect(html).toContain('Активные звонки в демо-контуре будут прерваны');
  });

  it('stops via PATCH completed and does not invent a stopped enum', () => {
    expect(html).toContain("status: 'completed'");
    expect(html).toContain('stopMode: stopMode ||');
    expect(html).toContain('/status');
    expect(html).not.toContain("status: 'stopped'");
  });
});
