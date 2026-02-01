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
import { useNavbar } from './App';
import { useParams } from '@solidjs/router';
import _ from 'lodash';
import { closeDoc, getDocStats, openDoc } from '../persistence';
import { assert } from '../util';

function Editor() {
  const { id: fileId } = useParams();
  assert(fileId, 'Editor component loaded without a file');

  const { setFileId, setNumUpdates } = useNavbar();
  onMount(() => {
    setFileId(fileId);
  });

  let editorDiv;
  let editorView: EditorView;
  const [syncedDoc] = createResource(async () => openDoc(fileId));

  createEffect(() => {
    const doc = syncedDoc();
    if (!doc) {
      return;
    }

    const getNumRecords = () => getDocStats(doc).numRecords;
    const refreshNumUpdates = _.debounce(() => {
      setNumUpdates(getNumRecords());
    }, 100);
    setNumUpdates(getNumRecords());
    doc.on('update', () => {
      setTimeout(refreshNumUpdates, 1500);
    });

    const state = EditorState.create({
      doc: doc.getText().toString(),
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
        yCollab(doc.getText(), null),
      ],
    });
    editorView = new EditorView({ state, parent: editorDiv });
  });

  onCleanup(() => {
    setNumUpdates(null);
    editorView?.destroy();
    const doc = syncedDoc();
    if (doc) {
      closeDoc(doc);
    }
  });

  return (
    <Show when={syncedDoc()}>
      <div ref={editorDiv} class="editor-component" />
    </Show>
  );
}

export default Editor;
