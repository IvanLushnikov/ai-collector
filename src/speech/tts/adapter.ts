export type TtsSynthesizeInput = {
  text: string;
  voiceId: string;
  voiceVersion: string;
};

export type TtsResult = {
  audio: Uint8Array;
  contentType: string;
  url: string;
  voiceId: string;
  voiceVersion: string;
};

export interface TtsAdapter {
  synthesize(input: TtsSynthesizeInput): Promise<TtsResult>;
}
