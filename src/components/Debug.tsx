import { createSignal, For } from 'solid-js';

const [getDebugLogs, setDebugLogs] = createSignal<string[]>([]);

export function debugLog(message: string, ...args: any[]) {
  const components = [message, ...args.map((x) => JSON.stringify(x))];
  const line = components.join(' ');
  setDebugLogs([...getDebugLogs(), line]);
}

export default function DebugView() {
  return <For each={getDebugLogs()}>{(logLine) => <p>{logLine}</p>}</For>;
}
