import _ from 'lodash';
import * as Y from 'yjs';
import { openDB } from 'idb';

const DB_NAME = 'synced-docs';
const LOCAL_UPDATE_STORE = 'local-updates';

const db = await openDB(DB_NAME, 2, {
  upgrade(db, oldVersion, newVersion) {
    console.log(`Running upgrade from ${oldVersion} to ${newVersion}`);
    db.createObjectStore(LOCAL_UPDATE_STORE);
  },
});

export class LocalDocument {
  readonly id: string;
  readonly doc: Y.Doc;
  private updates: Uint8Array[];

  constructor(id: string) {
    this.id = id;
    this.doc = new Y.Doc();
    this.updates = [];

    const flush = _.debounce(() => this.flush(), 1000);
    this.doc.on('update', (update: Uint8Array) => {
      this.updates.push(update);
      flush();
    });
  }

  public static async load(id: string): Promise<LocalDocument> {
    const updates: Uint8Array[] = await db.getAll(
      LOCAL_UPDATE_STORE,
      IDBKeyRange.bound([id, -Infinity], [id, Infinity])
    );
    const result = new LocalDocument(id);
    Y.applyUpdate(result.doc, Y.mergeUpdates(updates));
    return result;
  }

  public async flush(): Promise<void> {
    const batch = this.updates;
    this.updates = [];
    if (batch.length > 0) {
      const update = Y.mergeUpdates(batch);
      const key = [this.id, new Date().valueOf()];
      await db.add(LOCAL_UPDATE_STORE, update, key);
    }
  }

  public async finish(): Promise<void> {
    await this.flush();
    this.doc.destroy();
  }
}
