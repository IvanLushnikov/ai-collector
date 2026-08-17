import { TtsAdapter, TtsResult, TtsSynthesizeInput } from './adapter.js';

export class FakeTtsAdapter implements TtsAdapter {
  async synthesize(input: TtsSynthesizeInput): Promise<TtsResult> {
    const audio = new TextEncoder().encode(`fake-tts:${input.voiceId}:${input.voiceVersion}:${input.text}`);

    return {
      audio,
      contentType: 'audio/pcm',
      url: `memory://tts/${input.voiceId}/${input.voiceVersion}`,
      voiceId: input.voiceId,
      voiceVersion: input.voiceVersion
    };
  }
}
