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
});
