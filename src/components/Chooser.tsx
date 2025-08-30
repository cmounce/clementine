import { For, onMount } from 'solid-js';
import './Chooser.css';
import { useNavbar } from './App';
import { useNavigate } from '@solidjs/router';

function Chooser() {
  const navigate = useNavigate();
  const { setFileId } = useNavbar();
  onMount(() => setFileId(null));

  const files = ['foo', 'bar', 'baz'];

  return (
    <>
      <For each={files}>
        {(availableFile) => (
          <button class="file" onclick={() => navigate(`doc/${availableFile}`)}>
            {availableFile}
            {/* {availableFile === props.file() ? '(*)' : ''} */}
          </button>
        )}
      </For>
    </>
  );
}

export default Chooser;
