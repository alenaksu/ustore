import { LitElement, html } from 'lit';
import { provideState } from '../lit';
import { createStore } from '../store';
import { customElement } from 'lit/decorators.js';

@customElement('my-app')
export class App extends LitElement {
  @provideState()
  store = createStore({
    time: Date.now(),
    count: 0,
  });

  firstUpdated() {
    setInterval(() => {
      this.store.state.time = Date.now();
    }, 1000);
  }

  render() {
    return html` <slot></slot> `;
  }
}
