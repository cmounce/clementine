import * as Y from 'yjs';
import { EditorState } from '@codemirror/state';
import { keymap, EditorView } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { yCollab } from 'y-codemirror.next';
import { onCleanup, onMount } from 'solid-js';
import { syncDoc } from '../sync';

interface EditorProps {
  file: string;
}

function Editor(props: EditorProps) {
  let doc: Y.Doc;
  let editorDiv;
  let editorView: EditorView;

  onMount(() => {
    doc = new Y.Doc();
    syncDoc(props.file, doc);
    const state = EditorState.create({
      doc: doc.getText().toString(),
      extensions: [
        EditorView.lineWrapping,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        yCollab(doc.getText(), null),
      ],
    });
    editorView = new EditorView({ state, parent: editorDiv });
  });

  onCleanup(() => {
    editorView?.destroy();
    doc?.destroy();
  });

  return (
    <div>
      <p>You are editing {props.file}.</p>
      <div
        ref={editorDiv}
        class="editor-component"
        style={{ border: '1px solid black' }}
      />
    </div>
  );
}

export default Editor;
