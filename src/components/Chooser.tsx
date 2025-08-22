import { For, type Accessor, type Setter } from 'solid-js';
import './Chooser.css';

interface ChooserProps {
  file: Accessor<string | null>;
  setFile: Setter<string | null>;
}

function Chooser(props: ChooserProps) {
  const files = ['foo', 'bar', 'baz'];

  return (
    <>
      <For each={files}>
        {(availableFile) => (
          <button class="file" onclick={() => props.setFile(availableFile)}>
            {availableFile}
            {availableFile === props.file() ? '(*)' : ''}
          </button>
        )}
      </For>
    </>
  );
}

export default Chooser;
