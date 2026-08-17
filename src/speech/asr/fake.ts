import { AsrAdapter, AsrResult, AsrTranscribeInput } from './adapter.js';

export class FakeAsrAdapter implements AsrAdapter {
  constructor(private readonly transcript = 'добрый день это тестовая реплика') {}

  async transcribe(_input: AsrTranscribeInput): Promise<AsrResult> {
    const words = this.transcript.split(' ');
    const timestamps = words.map((word, index) => ({
      word,
      startMs: index * 200,
      endMs: (index + 1) * 200
    }));

    const partials = words.map((_, index) => ({
      text: words.slice(0, index + 1).join(' '),
      isFinal: index === words.length - 1,
      confidence: 0.91,
      timestamps: timestamps.slice(0, index + 1)
    }));

    return {
      text: this.transcript,
      confidence: 0.91,
      timestamps,
      partials
    };
  }
}
