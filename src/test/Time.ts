import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consumeState } from '../lit';

@customElement('my-time')
export class Time extends LitElement {
  @consumeState()
  state!: {
    time: number;
  };

  render() {
    console.log('render');
    return html`
      <h1>${new Date(this.state.time).toLocaleTimeString()}</h1>
    `;
  }
}
