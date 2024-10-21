import { h, render } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

function Viz() {
  // square size
  const width = 800;
  const height = 800;

  return html`<svg viewBox="0 0 ${width} ${height}"></svg>`;
}

render(html`<${Viz} />`, document.getElementById("solution-viz"));
