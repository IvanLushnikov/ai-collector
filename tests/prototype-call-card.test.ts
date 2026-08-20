import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');

describe('prototype call card', () => {
  it('shows several dialogs with agent and person turns and recording status without a download link', () => {
    expect(html).not.toContain('я представитель банка');
    expect(html).not.toContain('id="callCardRecording"');
    expect(html).toContain('id="callCardRecordingStatus"');
    expect(html).toContain('id="callCardDialogList"');
    expect(html).toContain('ИИ-агент');
    expect(html).toContain('Человек');
    expect(html).toContain('Расшифровки этого разговора нет');
    expect(html).toContain('Запись хранится');
    expect(html).toContain('Записи нет');
    expect(html).not.toContain('sandbox://recordings');
    expect(html).not.toContain('Скачать запись');
  });

  it('shows recording and transcript state separately from outcome', () => {
    expect(html).toContain('Ход звонка');
    expect(html).toContain('Статус попытки · исход · решение');
    expect(html).toContain('<b>Исход разговора:</b>');
    expect(html).toContain('<b>Решение:</b>');
    expect(html).toContain('<b>Причина:</b>');
    expect(html).not.toContain('<b>Результат разговора:</b>');
    expect(html).toContain('id="callCardRecordingStatus"');
    expect(html).toContain('id="callCardTranscriptEmpty"');
    expect(html).toContain('Техническая диагностика');
    expect(html).toContain('id="callCardDiagnostics"');
  });

  it('labels supported dial and evidence statuses', () => {
    expect(html).toContain("handoff_requested: 'Переведен оператору'");
    expect(html).toContain("cancelled: 'Отменен'");
    expect(html).toContain("item.transcriptStatus === 'pending'");
    expect(html).toContain("item.recordingStatus === 'pending'");
    expect(html).toContain("item.recordingStatus === 'failed'");
    expect(html).toContain('Расшифровка в обработке');
    expect(html).toContain('Запись ещё готовится');
    expect(html).toContain('Записи нет');
  });
});
