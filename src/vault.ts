import * as Y from 'yjs';

export type VaultMap = TypedMap<VaultMapSchema>;

type VaultMapSchema = {
  id: string;
  docs: Y.Map<DocMap>;
};

export type DocMap = TypedMap<DocMapSchema>;

type DocMapSchema = {
  title: string;
  tags: Y.Map<boolean>;
};

type TypedMap<T> = Omit<Y.Map<any>, 'get' | 'has'> & {
  get<K extends keyof T>(key: K): T[K];
  has<K extends keyof T>(key: K): boolean;
};

export function getVaultMap(ydoc: Y.Doc): VaultMap {
  return ydoc.getMap();
}

export function getDocsMap(ydoc: Y.Doc): Y.Map<DocMap> {
  return getVaultMap(ydoc).get('docs');
}
