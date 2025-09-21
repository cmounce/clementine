import _ from 'lodash';
import * as Y from 'yjs';
import { openDB, type DBSchema } from 'idb';
import { assert, generateId } from './util';
import { getDocsMap, getVaultMap, type DocMap } from './vault';

const DB_NAME = 'synced-docs';
export const LOCAL_DELTA_STORE = 'local-updates';
export const VAULT_STORE = 'vaults';

type LocalDeltaKey = [string, number];
type VaultRecord = { id: string };

interface DocsDatabase extends DBSchema {
  [LOCAL_DELTA_STORE]: {
    key: LocalDeltaKey;
    value: Uint8Array;
  };
  [VAULT_STORE]: {
    key: string;
    value: VaultRecord;
  };
}

export const docsDb = await openDB<DocsDatabase>(DB_NAME, 3, {
  upgrade(db, oldVersion, newVersion) {
    console.log(`Running upgrade from ${oldVersion} to ${newVersion}`);
    if (oldVersion < 2) {
      db.createObjectStore(LOCAL_DELTA_STORE);
    }
    if (oldVersion < 3) {
      db.createObjectStore(VAULT_STORE);
    }
  },
});

export class LocalDocument {
  readonly id: string;
  readonly doc: Y.Doc;
  private updates: Uint8Array[];
  private totalUpdates: number;

  private constructor(id: string, ydoc: Y.Doc) {
    this.id = id;
    this.doc = ydoc;
    this.updates = [];
    this.totalUpdates = 0;

    const flush = _.debounce(() => this.flush(), 1000);
    this.doc.on('update', (update: Uint8Array) => {
      this.updates.push(update);
      flush();
    });
  }

  get numUpdates(): number {
    return this.totalUpdates;
  }

  public static async load(id: string): Promise<LocalDocument> {
    // Build Y.Doc from records on disk
    const updates: Uint8Array[] = await docsDb.getAll(
      LOCAL_DELTA_STORE,
      IDBKeyRange.bound([id, -Infinity], [id, Infinity])
    );
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, Y.mergeUpdates(updates));

    // Build LocalDocument instance
    const result = new LocalDocument(id, ydoc);
    result.totalUpdates = updates.length;
    return result;
  }

  public async flush(): Promise<void> {
    const batch = this.updates;
    this.updates = [];
    if (batch.length > 0) {
      const update = Y.mergeUpdates(batch);
      const key: LocalDeltaKey = [this.id, new Date().valueOf()];
      await docsDb.add(LOCAL_DELTA_STORE, update, key);
      this.totalUpdates += 1;
    }
  }

  public async finish(): Promise<void> {
    await this.flush();
    this.doc.destroy();
  }
}

async function getOrCreateVaultDoc() {
  const records = await docsDb.getAll(VAULT_STORE);
  if (records.length > 1) {
    throw new Error(`Expected 1 vault record, got ${records.length}`);
  } else if (records.length === 0) {
    const key = generateId();
    const value = { id: key };
    await docsDb.add(VAULT_STORE, value, key);
    records.push(value);
  }

  const id = records[0].id as string;
  if (!id) {
    throw new Error("Vault record didn't have id");
  }
  const vault = await LocalDocument.load(id);
  const vaultMap = getVaultMap(vault.doc);
  if (!vaultMap.has('id')) {
    vaultMap.set('id', id);
  }
  if (!vaultMap.has('docs')) {
    vaultMap.set('docs', new Y.Map());
  }

  // Make sure each doc has tags
  const docsMap = vaultMap.get('docs');
  for (const docMap of docsMap.values()) {
    if (!docMap.has('tags')) {
      docMap.set('tags', new Y.Map());
    }
  }

  return vault;
}

export const defaultVault = await getOrCreateVaultDoc();
// console.log(defaultVault.doc.getMap().toJSON())

const docsMap = getDocsMap(defaultVault.doc);
if (docsMap.size === 0) {
  console.log('Running vault migration...');
  for (const oldKey of ['foo', 'bar', 'baz']) {
    const newId = generateId();
    const docInfo = new Y.Map([['title', oldKey]]) as DocMap;
    docsMap.set(newId, docInfo);

    const tx = docsDb.transaction(LOCAL_DELTA_STORE, 'readwrite');
    const recordKeys = (await tx.store.getAllKeys(
      IDBKeyRange.bound([oldKey, -Infinity], [oldKey, Infinity])
    )) as LocalDeltaKey[];
    console.log(
      `Found ${recordKeys.length} records for old document key ${oldKey}`
    );
    for (const oldRecordKey of recordKeys) {
      const record = await tx.store.get(oldRecordKey);
      assert(record, `Couldn't find old record ${oldRecordKey} to convert it`);
      const newRecordKey: LocalDeltaKey = [newId, oldRecordKey[1]];
      await tx.store.put(record, newRecordKey);
    }
    await tx.store.delete(
      IDBKeyRange.bound([oldKey, -Infinity], [oldKey, Infinity])
    );
    tx.commit();
  }
}

(window as any).Y = Y;
