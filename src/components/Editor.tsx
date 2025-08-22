interface EditorProps {
  file: string;
}

function Editor(props: EditorProps) {
  return <p>You are editing {props.file}.</p>;
}

export default Editor;
