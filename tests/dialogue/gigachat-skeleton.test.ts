import { describe, expect, it } from 'vitest';
import { GigaChatAdapter, GigaChatNotConfiguredError } from '../../src/dialogue/llm/gigachat.js';

describe('GigaChat skeleton', () => {
  it('returns a controlled not configured error without network calls or foreign SDKs', async () => {
    const adapter = new GigaChatAdapter({});
    await expect(adapter.completeTurn({
      stateId: 'identity',
      identityVerified: false,
      userText: 'алло',
      allowedTools: ['end_call']
    })).rejects.toBeInstanceOf(GigaChatNotConfiguredError);
  });

  it('still does not call HTTP when an apiKey is present', async () => {
    const adapter = new GigaChatAdapter({ apiKey: 'secret' });
    await expect(adapter.completeTurn({
      stateId: 'identity',
      identityVerified: false,
      userText: 'алло',
      allowedTools: ['end_call']
    })).rejects.toBeInstanceOf(GigaChatNotConfiguredError);
  });
});
