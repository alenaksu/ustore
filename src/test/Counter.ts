import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consumeState } from '../lit';

@customElement('my-counter')
export class Counter extends LitElement {
  @consumeState()
  state!: {
    count: number;
  };

  render() {
    console.log('render');
    return html`
      <div>Clicked: ${this.state.count} times</div>
      <button @click="${() => this.state.count++}">Click Me</button>
    `;
  }
}
