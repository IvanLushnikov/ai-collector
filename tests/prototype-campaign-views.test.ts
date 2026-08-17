import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const prototypeHtml = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

const campaignWorkspaceMatch = prototypeHtml.match(
  /<section class="campaign-shell" id="campaignWorkspace"[\s\S]*?<\/section>/
);

const countDivBalance = (chunk: string): number => {
  const opens = chunk.match(/<div\b/g)?.length ?? 0;
  const closes = chunk.match(/<\/div>/g)?.length ?? 0;
  return opens - closes;
};

describe('prototype campaign workspace', () => {
  it('keeps every campaign view as a balanced sibling section', () => {
    expect(campaignWorkspaceMatch).not.toBeNull();
    const workspace = campaignWorkspaceMatch?.[0] ?? '';
    const starts = [...workspace.matchAll(/<div class="campaign-view[^"]*" data-camp-view="([^"]+)"/g)];
    const views = starts.map((match, index) => {
      const name = match[1];
      const from = match.index ?? 0;
      const to = index + 1 < starts.length ? (starts[index + 1].index ?? workspace.length) : workspace.length;
      return { name, balance: countDivBalance(workspace.slice(from, to)) };
    });

    expect(views.map((item) => item.name)).toEqual([
      'overview',
      'base',
      'scenario',
      'phone',
      'launch',
      'calls',
      'review',
      'report',
      'settings'
    ]);
    expect(views.filter((item) => item.balance !== 0)).toEqual([]);
  });

  it('exposes a tab for every operator-facing campaign section', () => {
    const tabs = [...prototypeHtml.matchAll(/<button[^>]*data-camp-tab="([^"]+)"[^>]*>([^<]+)<\/button>/g)]
      .map((match) => match[1]);
    expect(tabs).toEqual([
      'overview',
      'base',
      'scenario',
      'phone',
      'launch',
      'calls',
      'review',
      'report',
      'settings'
    ]);
  });

  it('shows speech and model cards without vendor jargon in titles', () => {
    expect(prototypeHtml).toContain('id="speech"');
    expect(prototypeHtml).toContain('Распознавание речи');
    expect(prototypeHtml).toContain('Модель диалога');
    expect(prototypeHtml).toContain('Речь и модель не готовы. Подключите ключи в разделе интеграций.');
    const speechSection = prototypeHtml.match(/<section class="screen" id="speech">[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(speechSection).not.toMatch(/\bBYOK\b/);
    expect(speechSection).not.toMatch(/\bASR\b/);
    expect(speechSection).not.toMatch(/\bTTS\b/);
    expect(speechSection).not.toMatch(/\bLLM\b/);
  });
});
