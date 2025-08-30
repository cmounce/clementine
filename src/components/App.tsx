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

interface NavbarProps {
  fileId: Accessor<string | null>;
  setFileId: Setter<string | null>;
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

  return (
    <NavbarContext.Provider value={{ fileId, setFileId }}>
      <div class="app">
        <div class="navbar">
          <Show when={fileId() !== null}>
            <button onclick={() => navigate('/')}>Back</button>
          </Show>
          <div class="title">{fileId() ?? 'Choose a file'}</div>
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
    </HashRouter>
  );
}

export default App;
