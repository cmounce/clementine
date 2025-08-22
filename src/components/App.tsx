import { createSignal, Show } from 'solid-js';
import Chooser from './Chooser';
import Editor from './Editor';

function App() {
  const [currentFile, setCurrentFile] = createSignal<string | null>(null);

  return (
    <Show
      when={currentFile()}
      fallback={<Chooser file={currentFile} setFile={setCurrentFile} />}
    >
      <button onclick={() => setCurrentFile(null)}>Back</button>
      <Editor file={currentFile()!} />
    </Show>
  );
}

export default App;
