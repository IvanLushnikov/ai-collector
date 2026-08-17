export type AsrWordTimestamp = {
  word: string;
  startMs: number;
  endMs: number;
};

export type AsrPartial = {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamps: AsrWordTimestamp[];
};

export type AsrResult = {
  text: string;
  confidence: number;
  timestamps: AsrWordTimestamp[];
  partials: AsrPartial[];
};

export type AsrTranscribeInput = {
  audio: Uint8Array;
  language?: string;
};

export interface AsrAdapter {
  transcribe(input: AsrTranscribeInput): Promise<AsrResult>;
}
