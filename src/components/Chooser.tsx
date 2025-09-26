import { createSignal, For, onMount } from 'solid-js';
import './Chooser.css';
import { useNavbar } from './App';
import { A } from '@solidjs/router';
import { defaultVault } from '../sync';
import { getDocsMap, type DocMap } from '../vault';
import DocInfoDialog, { type DocInfo } from './DocInfoDialog';
import { generateId } from '../util';
import * as Y from 'yjs';

function Chooser() {
  const { setFileId } = useNavbar();
  onMount(() => setFileId(null));

  const docsMap = getDocsMap(defaultVault);

  const computeDocsList = () => {
    const result: DocInfo[] = [];
    for (const [id, entry] of docsMap.entries()) {
      const title = entry.get('title');
      const tags = Array.from(entry.get('tags').keys());
      tags.sort();
      result.push({ id, title, tags });
    }
    return result;
  };
  const [getDocsList, setDocsList] = createSignal<DocInfo[]>(computeDocsList());

  const [getDialogOpen, setDialogOpen] = createSignal(false);
  const [getDocInfo, setDocInfo] = createSignal<DocInfo | null>(null);

  const handleInfoUpdate = (info: DocInfo) => {
    let doc: DocMap;
    if (info.id === null) {
      // Create a new doc
      // TODO: Some of this should probably live in vault/doc shared code
      doc = new Y.Map();
      doc.set('title', '');
      doc.set('tags', new Y.Map());
      docsMap.set(generateId(), doc);
    } else {
      // Load an existing doc
      const d = docsMap.get(info.id);
      if (!d) {
        throw new Error(`Couldn't load doc for info update: ${info.id}`);
      }
      doc = d;
    }

    // Update title
    if (doc.get('title') !== info.title) {
      doc.set('title', info.title);
    }

    // Update tags
    const tagsMap = doc.get('tags');
    const newTags = new Set(info.tags);
    for (const key of tagsMap.keys()) {
      if (!newTags.has(key)) {
        tagsMap.delete(key);
      }
    }
    for (const key of newTags) {
      if (!tagsMap.has(key)) {
        tagsMap.set(key, true);
      }
    }

    setDocsList(computeDocsList());
  };

  return (
    <>
      <DocInfoDialog
        initialDoc={getDocInfo()}
        onClose={(x) => {
          setDialogOpen(false);
          if (x.action === 'save') {
            handleInfoUpdate(x.data);
          }
        }}
        open={getDialogOpen()}
      />
      <For each={getDocsList()}>
        {({ id, title, tags }) => (
          <A href={`doc/${id}`} class="file-link">
            <div class="file">
              <div class="title">{title}</div>
              <div class="tags">{tags.join(' ')}</div>
              <button
                onclick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDialogOpen(true);
                  setDocInfo({ id, title, tags });
                }}
              >
                Edit info
              </button>
            </div>
          </A>
        )}
      </For>
      <div class="create-new">
        <button
          onClick={() => {
            setDialogOpen(true);
            setDocInfo({ id: null, title: '', tags: [] });
          }}
        >
          Create new document&hellip;
        </button>
      </div>
    </>
  );
}

export default Chooser;
