import { For, onMount } from 'solid-js';
import './Chooser.css';
import { useNavbar } from './App';
import { useNavigate } from '@solidjs/router';
import { defaultVault } from '../sync';
import { getDocsMap } from '../vault';

function Chooser() {
  const navigate = useNavigate();
  const { setFileId } = useNavbar();
  onMount(() => setFileId(null));

  const docsMap = getDocsMap(defaultVault.doc);
  const titles: Record<string, string> = {};
  for (const [id, docInfo] of docsMap.entries()) {
    titles[id] = docInfo.get('title');
  }

  return (
    <>
      <For each={Object.entries(titles)}>
        {([id, title]: [string, string]) => (
          <button class="file" onclick={() => navigate(`doc/${id}`)}>
            {title}
            {/* {availableFile === props.file() ? '(*)' : ''} */}
          </button>
        )}
      </For>
    </>
  );
}

export default Chooser;
