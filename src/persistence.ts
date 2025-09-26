import * as Y from 'yjs';
import { docsDb, LOCAL_DELTA_STORE } from './sync';
import { assert } from './util';
import _ from 'lodash';
import { debugLog } from './components/Debug';

const COMPACTION_THRESHOLD = 50;

export async function openDoc(id: string): Promise<Y.Doc> {
  // Return existing doc if we still have it open
  const previousState = idToState.get(id);
  if (previousState) {
    previousState.refCount += 1;
    return previousState.savedDoc.ydoc;
  }

  const state: State = {
    refCount: 1,
    savedDoc: new SavedDoc(id),
  };
  idToState.set(id, state);
  docToId.set(state.savedDoc.ydoc, id);
  await state.savedDoc.connect();
  debugLog(`Opened doc ${id}`);

  return state.savedDoc.ydoc;
}

export function getDocStats(doc: Y.Doc) {
  const id = docToId.get(doc);
  assert(id, 'Document is not already open');
  const state = idToState.get(id)!;
  return state.savedDoc.getInfo();
}

export function closeDoc(doc: Y.Doc) {
  const id = docToId.get(doc);
  assert(id, 'Document is not already open');
  const state = idToState.get(id)!;

  state.refCount -= 1;
  if (state.refCount <= 0) {
    idToState.delete(id);
    docToId.delete(doc);
    state.savedDoc.flush().then(() => doc.destroy());
  }
  debugLog(`Closed doc ${id} (refcount ${state.refCount})`);
}

const docToId = new Map<Y.Doc, string>();
const idToState = new Map<string, State>();

type State = {
  refCount: number;
  savedDoc: SavedDoc;
};

class SavedDoc {
  readonly docId: string;
  readonly ydoc: Y.Doc;
  private deltaBuffer: Uint8Array[];
  private numRecords: number;
  private debouncedFlush: () => void;

  constructor(docId: string) {
    this.deltaBuffer = [];
    this.docId = docId;
    this.numRecords = 0;
    this.debouncedFlush = _.debounce(
      () => {
        this.flush();
      },
      1_000,
      { maxWait: 30_000 }
    );
    this.ydoc = new Y.Doc();
  }

  public getInfo(): { numRecords: number } {
    return { numRecords: this.numRecords };
  }

  public async connect(): Promise<Y.Doc> {
    const records = await docsDb.getAll(
      LOCAL_DELTA_STORE,
      IDBKeyRange.bound([this.docId, -Infinity], [this.docId, Infinity])
    );
    this.numRecords = records.length;
    Y.applyUpdate(this.ydoc, Y.mergeUpdates(records));
    this.ydoc.on('update', (blob) => this.addUpdate(blob));
    return this.ydoc;
  }

  public addUpdate(update: Uint8Array) {
    this.deltaBuffer.push(update);
    this.debouncedFlush();
  }

  public async flush(): Promise<void> {
    if (this.deltaBuffer.length === 0) {
      return;
    }

    // Write delta
    const delta = Y.mergeUpdates(this.deltaBuffer.splice(0));
    try {
      await docsDb.put(LOCAL_DELTA_STORE, delta, [
        this.docId,
        new Date().valueOf(),
      ]);
      this.numRecords += 1;
    } catch (err) {
      this.addUpdate(delta);
      console.log(`Error flushing document ${this.docId}: ${err}`);
      throw err;
    }

    // Compact if necessary
    try {
      await this.compact();
    } catch (err) {
      console.log(`Error compacting document ${this.docId}: ${err}`);
    }
  }

  public async compact() {
    if (this.numRecords < COMPACTION_THRESHOLD) {
      return;
    }
    debugLog(
      `Running compaction on doc ${this.docId}, ${this.numRecords} records...`
    );
    const tx = docsDb.transaction(LOCAL_DELTA_STORE, 'readwrite');

    // Make sure we're not missing anything by pulling in all changes.
    // This could happen if a document is being edited in two different tabs.
    const fullRange = IDBKeyRange.bound(
      [this.docId, -Infinity],
      [this.docId, Infinity]
    );
    const records = await tx.store.getAll(fullRange);
    Y.applyUpdate(this.ydoc, Y.mergeUpdates(records));

    // Replace with a compacted blob
    const compacted = Y.encodeStateAsUpdate(this.ydoc);
    await tx.store.delete(fullRange);
    await tx.store.put(compacted, [this.docId, new Date().valueOf()]);
    tx.commit();
    this.numRecords = 1;
  }
}
