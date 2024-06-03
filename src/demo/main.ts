import './style.css';

import './lit/App';
import './lit/Time';
import './lit/Counter';

import { createRoot } from 'react-dom/client';
import { App } from './react/App';
import { createElement } from 'react';

createRoot(document.getElementById('react-demo')!).render(createElement(App));
