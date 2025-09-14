import { createEffect, createSignal } from 'solid-js';
import './DocInfoDialog.css';

type Props = {
  initialDoc: DocInfo | null;
  onClose?: (x: Result<DocInfo>) => any;
  open: boolean;
};

export type DocInfo = {
  id: string | null;
  title: string;
  tags: string[];
};

type Result<T> = { action: 'save'; data: T } | { action: 'cancel' };

export default function DocInfoDialog(props: Props) {
  let el!: HTMLDialogElement;
  const [getTitle, setTitle] = createSignal('');
  const [getTagsString, setTagsString] = createSignal('');
  createEffect(() => setTitle(props.initialDoc?.title ?? ''));
  createEffect(() => setTagsString(props.initialDoc?.tags.join(' ') ?? ''));

  // Used to prevent double calls to props.onClose().
  // This happens when the user clicks Save/Cancel (call #1) and the closing
  // of the dialog triggers the dialog's own onClose (call #2), a handler which
  // has to be in place to handle when the user hits Esc.
  let submitted = true;

  createEffect(() => {
    if (!el) {
      return;
    }
    if (props.open !== el.open) {
      if (props.open) {
        submitted = false;
        el.showModal();
      } else {
        submitted = true;
        el.close();
      }
    }
  });

  const handleSave = () => {
    if (!submitted) {
      props.onClose?.({
        action: 'save',
        data: {
          id: props.initialDoc?.id ?? null,
          title: getTitle(),
          tags: getTagsString()
            .split(' ')
            .filter((x) => x !== ''),
        },
      });
    }
    submitted = true;
  };

  const handleCancel = () => {
    if (!submitted) {
      props.onClose?.({ action: 'cancel' });
    }
    submitted = true;
  };

  return (
    <dialog ref={el} onClose={handleCancel} class="doc-info-modal">
      <p class="title">
        {props.initialDoc ? 'Edit document info' : 'Create new document'}
      </p>
      <div>
        <label>Title</label>
        <input
          type="text"
          value={getTitle()}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label>Tags</label>
        <input
          type="text"
          value={getTagsString()}
          onChange={(e) => setTagsString(e.target.value)}
        />
      </div>

      <div class="buttons">
        <button onClick={handleCancel}>Cancel</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </dialog>
  );
}
