import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

const extractInlineScript = (source: string): string => {
  const start = source.indexOf('<script>');
  const end = source.lastIndexOf('</script>');
  return source.slice(start + '<script>'.length, end);
};

describe('prototype navigation', () => {
  it('exposes client cabinet menu without admin, sources, or duplicate campaign list', () => {
    expect(html).toMatch(/data-screen="home"[^>]*>[\s\S]*?Главная/);
    expect(html).not.toMatch(/data-screen="sources"/);
    expect(html).toMatch(/data-screen="telephony"[^>]*>[\s\S]*?Телефония/);
    expect(html).toMatch(/data-screen="analytics"[^>]*>[\s\S]*?Аналитика/);
    expect(html).toMatch(/data-screen="auditLog"[^>]*>[\s\S]*?Журнал действий/);
    expect(html).not.toMatch(/data-screen="campaigns"/);
    expect(html).not.toContain('id="sources"');
    expect(html).toContain('id="telephony"');
    expect(html).toContain('id="analytics"');
    expect(html).toContain('id="sidebarToggle"');
  });

  it('parses the inline cabinet script so sidebar screens can run', () => {
    const script = extractInlineScript(html);
    expect(script).toContain('async function showScreen');
    expect(() => new Function(script)).not.toThrow();
  });

  it('closes showCampaignTab before cabinet init so nav listeners stay at top level', () => {
    const script = extractInlineScript(html);
    expect(script).toMatch(/if \(id === 'calls'\) \{[\s\S]*?return;\s*\}\s*\}\s*renderCallsTable\(/);
  });
});
