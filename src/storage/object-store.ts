export type ObjectStorePutInput = {
  tenantId: string;
  kind: 'recording' | 'transcript';
  bytes: Uint8Array;
  contentType: string;
  keyHint?: string;
};

export type ObjectStoreObject = {
  url: string;
  contentType: string;
  bytes: Uint8Array;
};

export interface ObjectStore {
  put: (input: ObjectStorePutInput) => Promise<{ url: string }>;
  get: (url: string) => Promise<ObjectStoreObject | null>;
}
