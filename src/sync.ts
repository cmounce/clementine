import * as Y from 'yjs';

const fakeStore = new Map<string, Uint8Array[]>();

export function syncDoc(id: string, doc: Y.Doc) {
  const updates = fakeStore.get(id) ?? [];
  fakeStore.set(id, updates);
  for (const update of updates) {
    Y.applyUpdate(doc, update);
  }

  doc.on('update', (update: Uint8Array) => {
    updates.push(update);
  });
}
