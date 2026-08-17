import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype call card', () => {
  it('does not claim a bank representative or offer a sandbox download link', () => {
    expect(html).not.toContain('я представитель банка');
    expect(html).not.toContain('id="callCardRecording"');
    expect(html).toContain('id="callCardRecordingStatus"');
    expect(html).toContain('Технические события');
    expect(html).toContain('<details>');
  });
});
