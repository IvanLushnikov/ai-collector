import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype evidence views', () => {
  it('does not replace unavailable call or audit evidence with demo data', () => {
    expect(html).not.toContain('Используем демо-события');
    expect(html).not.toContain('Используем демо-данные');
    expect(html).toContain("auditLogItems=[]");
    expect(html).toContain("callCards=[]");
  });

  it('fails closed when the campaign report is unavailable', () => {
    expect(html).not.toContain('Показаны локальные метрики прототипа');
    expect(html).toContain('Данные отчёта не показаны.');
    expect(html).toContain('currentCampaignReportSnapshot=null;');
    expect(html).toContain("element.textContent='—';");
  });

  it('does not keep a local queue or allow local review decisions', () => {
    expect(html).toContain('let reviewQueueItems=[];');
    expect(html).not.toContain("id:'RQ-1001'");
    expect(html).not.toContain('item.status=decision;');
  });

  it('does not ship unused demo calls or audit evidence to the cabinet', () => {
    expect(html).not.toContain('const localCallCards=[');
    expect(html).not.toContain('const localAuditLog=[');
    expect(html).not.toContain('localCallCardsWithSource');
  });
});
