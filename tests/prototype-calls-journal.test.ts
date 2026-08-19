import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const calls = html.match(/data-camp-view="calls"[\s\S]*?<\/section>/)?.[0] ?? html;

describe('prototype calls journal', () => {
  it('keeps attempt status separate from conversation result and evidence state', () => {
    expect(calls).toContain('Время');
    expect(calls).toContain('Должник');
    expect(calls).toContain('Статус попытки');
    expect(calls).toContain('Результат разговора');
    expect(calls).toContain('Решение');
    expect(calls).toContain('Запись / расшифровка');
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
  });
});
