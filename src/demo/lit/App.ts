import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consumeStore } from '../../lit';
import { demoStore, TOTAL_CELLS } from '../store';

@customElement('lit-cell')
export class LitCell extends LitElement {
  @property({ type: Number })
  index!: number;

  @consumeStore(demoStore)
  state!: typeof demoStore.state;

  private renderCount = 0;
  private lastValue: number | undefined = undefined;
  private flash = false;

  createRenderRoot() {
    return this; // Render in Light DOM so global style.css applies seamlessly
  }

  render() {
    this.renderCount++;
    const cell = this.state.grid.cells[this.index];

    if (this.lastValue !== undefined && cell.value !== this.lastValue) {
      this.flash = true;
      setTimeout(() => {
        this.flash = false;
        this.requestUpdate();
      }, 400);
    }
    this.lastValue = cell.value;

    return html`
      <div
        class="cell-wrapper ${this.flash ? 'cell-flash' : ''}"
        style="background-color: hsla(${cell.hue}, 70%, 35%, 0.8)"
        @click="${this.handleClick}"
      >
        <span class="cell-render-badge">${this.renderCount}</span>
        <span class="cell-value">${cell.value}</span>
      </div>
    `;
  }

  private handleClick() {
    const target = demoStore.state.grid.cells[this.index];
    target.value++;
    target.hue = (target.hue + 25) % 360;
  }
}

@customElement('my-app')
export class App extends LitElement {
  @consumeStore(demoStore)
  state!: typeof demoStore.state;

  private appRenderCount = 0;

  createRenderRoot() {
    return this;
  }

  render() {
    this.appRenderCount++;
    const indices = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

    return html`
      <div class="panel panel-lit">
        <div class="panel-header">
          <div class="panel-title">
            <span>Lit Application</span>
          </div>
          <span class="panel-badge"> Panel Renders: ${this.appRenderCount} </span>
        </div>

        <div class="matrix-grid">
          ${indices.map((index) => html`<lit-cell .index="${index}"></lit-cell>`)}
        </div>

        <div class="widgets-row">
          <div class="widget-box">
            <span class="widget-label">Global Counter</span>
            <span class="widget-content">${this.state.count}</span>
            <button @click="${() => demoStore.state.count++}">+1 Count</button>
          </div>
          <div class="widget-box">
            <span class="widget-label">Time Sync</span>
            <span class="widget-content"> ${new Date(this.state.time).toLocaleTimeString()} </span>
          </div>
        </div>
      </div>
    `;
  }
}
