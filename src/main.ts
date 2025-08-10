import _ from 'lodash';
import './style.css';
import * as Y from 'yjs';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <h1>Story Editor</h1>
  <p>Your TypeScript + Vite app is ready!</p>
  <textarea id="ta1" rows=10 cols=80></textarea>
  <br>
  <br>
  <textarea id="ta2" rows=10 cols=80></textarea>
`;

const ta1 = document.getElementById('ta1') as HTMLTextAreaElement;
const ta2 = document.getElementById('ta2') as HTMLTextAreaElement;

function bind(text: Y.Text, el: HTMLTextAreaElement) {
  el.value = text.toString();

  const handle = _.debounce(() => {
    let prev = text.toString();
    let curr = el.value;
    let i = 0;
    for (i = 0; prev[i] && prev[i] == curr[i]; i++) {}
    const offset = i;
    prev = prev.slice(offset);
    curr = curr.slice(offset);
    for (
      i = 0;
      prev[prev.length - 1 - i] &&
      prev[prev.length - 1 - i] === curr[curr.length - 1 - i];
      i++
    ) {}
    prev = prev.slice(0, prev.length - i);
    curr = curr.slice(0, curr.length - i);

    text.doc!.transact(() => {
      text.delete(offset, prev.length);
      text.insert(offset, curr);
    });
  }, 500);

  el.addEventListener('input', (_ev) => {
    handle();
  });
}

const doc1 = new Y.Doc();
bind(doc1.getText(), ta1);
const doc2 = new Y.Doc();
bind(doc2.getText(), ta2);

doc1.on('update', async (update) => {
  await new Promise((res, _rej) =>
    setTimeout(res, 3000 * Math.random() + 2000)
  );
  Y.applyUpdate(doc2, update);
  ta2.value = doc2.getText().toString();
});
doc2.on('update', async (update) => {
  await new Promise((res, _rej) =>
    setTimeout(res, 3000 * Math.random() + 2000)
  );
  Y.applyUpdate(doc1, update);
  ta1.value = doc1.getText().toString();
});

doc1.getText().insert(0, 'foo bar baz');
ta1.value = doc1.getText().toString();

(window as any).Y = Y;
