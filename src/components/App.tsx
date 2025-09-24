import {
  createContext,
  createSignal,
  Show,
  useContext,
  type Accessor,
  type Setter,
} from 'solid-js';
import Chooser from './Chooser';
import Editor from './Editor';
import { HashRouter, Route, useNavigate } from '@solidjs/router';
import { defaultVault } from '../sync';
import { getDocsMap } from '../vault';
import DebugView from './Debug';

interface NavbarProps {
  fileId: Accessor<string | null>;
  setFileId: Setter<string | null>;
  numUpdates: Accessor<number | null>;
  setNumUpdates: Setter<number | null>;
}

const NavbarContext = createContext<NavbarProps>();

export function useNavbar(): NavbarProps {
  const result = useContext(NavbarContext);
  if (!result) {
    throw new Error('NavbarContext not set');
  }
  return result;
}

function Layout(props: any) {
  const navigate = useNavigate();
  const [fileId, setFileId] = createSignal<string | null>(null);
  const [numUpdates, setNumUpdates] = createSignal<number | null>(null);
  const docsMap = getDocsMap(defaultVault.doc);

  const title = () => {
    const id = fileId();
    if (id === null) {
      return null;
    } else {
      return docsMap.get(id)?.get('title') ?? '<invalid>';
    }
  };

  return (
    <NavbarContext.Provider
      value={{ fileId, setFileId, numUpdates, setNumUpdates }}
    >
      <div class="app">
        <div class="navbar">
          <Show when={fileId() !== null}>
            <button onclick={() => navigate('/')}>Back</button>
          </Show>
          <div class="title">{title() ?? 'Choose a file'}</div>
          <div class="info">{numUpdates() ?? ''}</div>
        </div>
        {props.children}
      </div>
    </NavbarContext.Provider>
  );
}

function App() {
  return (
    <HashRouter root={Layout}>
      <Route path="" component={Chooser} />
      <Route path="doc/:id" component={Editor} />
      <Route path="debug" component={DebugView} />
    </HashRouter>
  );
}

export default App;
