import { EditorState } from '@codemirror/state';
import { keymap, EditorView } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { yCollab } from 'y-codemirror.next';
import { createEffect, createResource, onCleanup, Show } from 'solid-js';
import { LocalDocument } from '../sync';

interface EditorProps {
  file: string;
}

function Editor(props: EditorProps) {
  let editorDiv;
  let editorView: EditorView;
  const [syncedDoc] = createResource(async () =>
    LocalDocument.load(props.file)
  );

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
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
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
    <div>
      <p>You are editing {props.file}.</p>
      <Show when={syncedDoc()}>
        <div
          ref={editorDiv}
          class="editor-component"
          style={{ border: '1px solid black' }}
        />
      </Show>
    </div>
  );
}

export default Editor;
