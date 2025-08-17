import { mount } from 'svelte';
import App from './components/App.svelte';

const app = document.getElementById('app')!;

mount(App, { target: app });
