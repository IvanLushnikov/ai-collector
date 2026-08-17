import { describe, expect, it } from 'vitest';
import { FakeAsrAdapter } from '../../src/speech/asr/fake.js';

describe('FakeAsrAdapter', () => {
  it('returns deterministic text, confidence, partials and timestamps without network', async () => {
    const asr = new FakeAsrAdapter();
    const result = await asr.transcribe({ audio: new Uint8Array([1, 2, 3]), language: 'ru-RU' });

    expect(result.text).toBe('добрый день это тестовая реплика');
    expect(result.confidence).toBe(0.91);
    expect(result.partials.length).toBeGreaterThan(1);
    expect(result.partials.at(-1)).toMatchObject({
      text: result.text,
      isFinal: true,
      confidence: 0.91
    });
    expect(result.timestamps[0]).toEqual({ word: 'добрый', startMs: 0, endMs: 200 });
  });
});
