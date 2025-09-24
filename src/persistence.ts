import * as Y from 'yjs';
import { docsDb, LOCAL_DELTA_STORE } from './sync';
import { assert } from './util';
import _ from 'lodash';

const COMPACTION_THRESHOLD = 200;

export async function openDoc(id: string): Promise<Y.Doc> {
  // Return existing doc if we still have it open
  const previousState = idToState.get(id);
  if (previousState) {
    previousState.refCount += 1;
    return previousState.ydoc;
  }

  const state = await initialLoad(id);
  idToState.set(id, state);
  docToState.set(state.ydoc, state);

  return state.ydoc;
}

export function closeDoc(doc: Y.Doc) {
  const state = docToState.get(doc);
  assert(state, 'Document is not already open');

  state.refCount -= 1;
  if (state.refCount <= 0) {
    idToState.delete(state.id);
    docToState.delete(doc);
    doc.destroy();
  }
}

const idToState = new Map<string, State>();
const docToState = new Map<Y.Doc, State>();

type State = {
  // TODO: Move more of this into class
  id: string;
  deltaBuffer: Uint8Array[];
  numRecords: number;
  refCount: number;
  ydoc: Y.Doc;
};

async function initialLoad(id: string): Promise<State> {
  const ydoc = new Y.Doc();
  const records = await docsDb.getAll(
    LOCAL_DELTA_STORE,
    IDBKeyRange.bound([id, -Infinity], [id, Infinity])
  );
  Y.applyUpdate(ydoc, Y.mergeUpdates(records));
  return {
    id,
    deltaBuffer: [],
    numRecords: records.length,
    refCount: 1,
    ydoc,
  };
}

// @ts-ignore
class BufferedWriter {
  private deltaBuffer: Uint8Array[];
  private docId: string;
  private numRecords: number;
  private debouncedFlush: () => void;
  private ydoc: Y.Doc;

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
