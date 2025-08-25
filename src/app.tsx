import { render } from 'solid-js/web';
import App from './components/App';
import './app.css';

const app = document.getElementById('app')!;

render(() => <App />, app);
