import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

const extractInlineScript = (source: string): string => {
  const start = source.indexOf('<script>');
  const end = source.lastIndexOf('</script>');
  return source.slice(start + '<script>'.length, end);
};

describe('prototype wizard create', () => {
  it('creates campaign via POST /campaigns with the authenticated cookie session', () => {
    const script = extractInlineScript(html);

    expect(script).toContain("q('#wizardCreate').addEventListener('click'");
    expect(script).toContain('apiFetch(`${reportApiBaseUrl}/campaigns`');
    expect(script).toMatch(/method\s*:\s*['"]POST['"]/);

    expect(script).not.toContain("'X-Tenant-Id'");
    expect(script).not.toContain("'X-User-Role'");
  });
});
