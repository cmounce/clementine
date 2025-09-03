import _ from 'lodash';
import * as Y from 'yjs';
import { openDB } from 'idb';
import { generateId } from './util';

const DB_NAME = 'synced-docs';
const LOCAL_UPDATE_STORE = 'local-updates';
const VAULT_STORE = 'vaults';

const db = await openDB(DB_NAME, 3, {
  upgrade(db, oldVersion, newVersion) {
    console.log(`Running upgrade from ${oldVersion} to ${newVersion}`);
    if (oldVersion < 2) {
      db.createObjectStore(LOCAL_UPDATE_STORE);
    }
    if (oldVersion < 3) {
      db.createObjectStore(VAULT_STORE);
    }
  },
});

async function getOrCreateVault() {
  const records = await db.getAll(VAULT_STORE);
  if (records.length > 1) {
    throw new Error(`Expected 1 vault record, got ${records.length}`);
  } else if (records.length === 0) {
    const key = generateId();
    const value = { id: key };
    await db.add(VAULT_STORE, value, key);
    records.push(value);
  }
  return records[0];
}

await getOrCreateVault();

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
