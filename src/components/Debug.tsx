import { createSignal, For } from 'solid-js';

const [getDebugLogs, setDebugLogs] = createSignal<string[]>([]);

export function debugLog(message: string, ...args: any[]) {
  console.log(message, ...args);
  const components = [message, ...args.map((x) => JSON.stringify(x))];
  const line = components.join(' ');

  const allLines = [...getDebugLogs(), line];
  if (allLines.length > 1000) {
    allLines.splice(0, allLines.length - 1000);
  }
  setDebugLogs(allLines);
}

export default function DebugView() {
  return <For each={getDebugLogs()}>{(logLine) => <div>{logLine}</div>}</For>;
}
