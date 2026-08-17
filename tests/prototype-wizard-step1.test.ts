import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype wizard step 1', () => {
  it('does not advance from an empty or error campaign step', () => {
    expect(html).toContain("['empty','loading','error'].includes(wizardStepStates.campaign.status)");
    expect(html).toContain('q(\'#wizardNext\').disabled=blocked');
  });
});
