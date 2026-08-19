import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

describe('prototype auth session', () => {
  it('loads /auth/me and redirects unauthenticated users to login', () => {
    expect(script).toContain('/auth/me');
    expect(script).toContain('/login.html');
    expect(script).toContain('currentAuth');
    expect(script).toContain('apiHeaders');
  });

  it('does not hardcode owner role on campaign create and import', () => {
    expect(script).not.toContain("'X-User-Role':'owner'");
    expect(script).not.toContain("'X-User-Role': 'owner'");
    expect(script).toContain("currentAuth.role");
  });

  it('has a logout action', () => {
    expect(html).toContain('id="logoutButton"');
    expect(script).toContain('/auth/logout');
  });
});
