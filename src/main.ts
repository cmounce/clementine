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

  const handle = () => {
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
  };

  el.addEventListener('input', (_ev) => {
    handle();
  });

  text.doc!.on('update', () => {
    el.value = text.toString();
  });
}

function pipe(src: Y.Doc, dest: Y.Doc) {
  let prevStateVector = Y.encodeStateVector(src);

  const flush = _.debounce(
    () => {
      const update = Y.encodeStateAsUpdate(src, prevStateVector);
      prevStateVector = Y.encodeStateVector(src);
      setTimeout(() => Y.applyUpdate(dest, update), _.random(2500, 5000));
    },
    1000,
    {
      maxWait: 2000,
    }
  );
  src.on('update', flush);
}

const doc1 = new Y.Doc();
bind(doc1.getText(), ta1);
const doc2 = new Y.Doc();
bind(doc2.getText(), ta2);

pipe(doc1, doc2);
pipe(doc2, doc1);

doc1.getText().insert(0, 'foo bar baz');

(window as any).Y = Y;
