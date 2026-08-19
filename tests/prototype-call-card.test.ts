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
});
