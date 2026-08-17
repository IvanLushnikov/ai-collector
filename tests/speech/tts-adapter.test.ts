import { describe, expect, it } from 'vitest';
import { FakeTtsAdapter } from '../../src/speech/tts/fake.js';

describe('FakeTtsAdapter', () => {
  it('returns an in-memory buffer and stub url without writing files', async () => {
    const tts = new FakeTtsAdapter();
    const result = await tts.synthesize({
      text: 'Здравствуйте',
      voiceId: 'ru-female-1',
      voiceVersion: 'v1'
    });

    expect(result.audio.byteLength).toBeGreaterThan(0);
    expect(result.contentType).toBe('audio/pcm');
    expect(result.url.startsWith('memory://')).toBe(true);
    expect(result.voiceId).toBe('ru-female-1');
    expect(result.voiceVersion).toBe('v1');
    expect(Object.keys(result).sort()).toEqual(['audio', 'contentType', 'url', 'voiceId', 'voiceVersion']);
  });
});
