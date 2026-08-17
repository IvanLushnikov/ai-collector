# Speech adapters (ASR / TTS)

Vendor-agnostic контракты. ПДн не уходят в иностранный cloud. Яндекс/GigaChat — за адаптером, не в домене.

## ASR

Файл: `src/speech/asr/adapter.ts`

- `transcribe({ audio, language? })` → `text`, `confidence`, `timestamps[]` (`word`, `startMs`, `endMs`), `partials[]` (`isFinal`).
- Fake: `src/speech/asr/fake.ts` — детерминированный русский текст, без сети.

## TTS

Файл: `src/speech/tts/adapter.ts`

- `synthesize({ text, voiceId, voiceVersion })` → `audio` (buffer), `contentType`, stub `url` (`memory://…`).
- Fake не пишет файлы на диск: `src/speech/tts/fake.ts`.

HTTP SpeechKit = `T-157` (blocked).
