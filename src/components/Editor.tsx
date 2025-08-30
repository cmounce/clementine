import { EditorState } from '@codemirror/state';
import { keymap, EditorView, scrollPastEnd } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { yCollab } from 'y-codemirror.next';
import {
  createEffect,
  createResource,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { LocalDocument } from '../sync';
import { useNavbar } from './App';
import { useParams } from '@solidjs/router';

function Editor() {
  const { id: fileId } = useParams();
  const { setFileId } = useNavbar();
  onMount(() => {
    setFileId(fileId);
  });

  let editorDiv;
  let editorView: EditorView;
  const [syncedDoc] = createResource(async () => LocalDocument.load(fileId));

  createEffect(() => {
    const doc = syncedDoc();
    if (!doc) {
      return;
    }
    const ydoc = doc.doc;

    const state = EditorState.create({
      doc: ydoc.getText().toString(),
      extensions: [
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          autocapitalize: 'sentences',
          autocorrect: 'on',
        }),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        scrollPastEnd(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        yCollab(ydoc.getText(), null),
      ],
    });
    editorView = new EditorView({ state, parent: editorDiv });
  });

  onCleanup(() => {
    editorView?.destroy();
    syncedDoc()?.finish();
  });

  return (
    <Show when={syncedDoc()}>
      <div ref={editorDiv} class="editor-component" />
    </Show>
  );
}

export default Editor;
