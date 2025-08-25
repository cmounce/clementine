import { createSignal, Show } from 'solid-js';
import Chooser from './Chooser';
import Editor from './Editor';

function App() {
  const [currentFile, setCurrentFile] = createSignal<string | null>(null);

  return (
    <div class="app">
      <div class="navbar">
        <Show when={currentFile() !== null}>
          <button onclick={() => setCurrentFile(null)}>Back</button>
        </Show>
        <div class="title">{currentFile() ?? 'Choose a file'}</div>
      </div>
      <Show
        when={currentFile()}
        fallback={<Chooser file={currentFile} setFile={setCurrentFile} />}
      >
        <Editor file={currentFile()!} />
      </Show>
    </div>
  );
}

export default App;
