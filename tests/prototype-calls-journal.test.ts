import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const calls = html.match(/data-camp-view="calls"[\s\S]*?<\/section>/)?.[0] ?? html;

describe('prototype calls journal', () => {
  it('expands debtor rows inline with a single conversation result column', () => {
    expect(calls).toContain('Должник');
    expect(calls).toContain('Результат разговора');
    expect(calls).not.toContain('Статус попытки');
    expect(calls).not.toMatch(/<th[^>]*>Исход<\/th>/);
    expect(html).toContain('debtor-link');
    expect(html).toContain('data-call-action="toggle"');
    expect(html).toContain('call-expand-row');
    expect(html).toContain('value="handoff">Перевод оператору');
    expect(html).not.toContain('value="transferred"');
    expect(calls).not.toContain('>Карточка<');
    expect(html).toContain('Звонков пока нет');
  });

  it('maps list compliance statuses and keeps not checked decisions neutral', () => {
    expect(html).toContain('const complianceStatusDecisionMap = {');
    expect(html).toContain("allowed: 'allow'");
    expect(html).toContain("blocked: 'block'");
    expect(html).toContain("not_checked: 'unknown'");
    expect(html).toContain('complianceStatusDecisionMap[item.complianceStatus]');
    expect(html).toContain("if (decision === 'allow') return 'state-ready';");
    expect(html).toContain("if (decision === 'block') return 'state-blocked';");
    expect(html).toContain("return 'state-empty';");
    expect(html).toContain('formatDialStatusLabel(item.dialStatus || item.status)');
    expect(html).toContain('formatConversationStatusLabel(item.conversationStatus)');
    expect(html).toContain('formatEvidenceStatusLabel(item)');
  });
});
