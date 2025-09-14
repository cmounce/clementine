import { createSignal, For, onMount } from 'solid-js';
import './Chooser.css';
import { useNavbar } from './App';
import { A } from '@solidjs/router';
import { defaultVault } from '../sync';
import { getDocsMap } from '../vault';
import DocInfoDialog, { type DocInfo } from './DocInfoDialog';

function Chooser() {
  const { setFileId } = useNavbar();
  onMount(() => setFileId(null));

  const docsMap = getDocsMap(defaultVault.doc);

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
    if (info.id === null) {
      throw new Error('Got null doc ID while updating doc info');
    }
    const doc = docsMap.get(info.id)!;

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
    </>
  );
}

export default Chooser;
