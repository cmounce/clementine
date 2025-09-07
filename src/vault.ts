import type { LocalDocument } from './sync';
import * as Y from 'yjs';

export class Vault {
  doc: LocalDocument;

  constructor(doc: LocalDocument) {
    this.doc = doc;
  }

  getDocInfo(id: string): DocInfo | null {
    const docsEntry = this.getDocsMap().get(id);
    if (!docsEntry) {
      return null;
    }
    return {
      title: docsEntry.get('title'),
      tags: new Set(),
    };
  }

  getDocsMap(): Y.Map<Y.Map<any>> {
    const vaultMap = this.doc.doc.getMap();
    return vaultMap.get('docs') as Y.Map<any>;
  }
}

export interface DocInfo {
  title: string;
  tags: Set<string>;
}
