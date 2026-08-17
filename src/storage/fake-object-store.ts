import type { ObjectStore, ObjectStoreObject, ObjectStorePutInput } from './object-store.js';

const encodeKey = (tenantId: string, kind: string, hint: string): string =>
  `sandbox://${kind}/${tenantId}/${hint}`;

export const createFakeObjectStore = (): ObjectStore => {
  const objects = new Map<string, ObjectStoreObject>();
  let sequence = 0;

  return {
    async put(input: ObjectStorePutInput) {
      sequence += 1;
      const hint = input.keyHint ?? String(sequence);
      const url = encodeKey(input.tenantId, input.kind, hint);
      objects.set(url, {
        url,
        contentType: input.contentType,
        bytes: Uint8Array.from(input.bytes)
      });
      return { url };
    },
    async get(url: string) {
      return objects.get(url) ?? null;
    }
  };
};
