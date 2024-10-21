import { h, render } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function Viz() {
  // square size
  const width = 800;
  const height = 800;

  const innerRadius = 250;
  const outerRadius = 350;

  const items = [
    { index: 1, group: "A" },
    { index: 2, group: "A" },
    { index: 3, group: "A" },
    { index: 4, group: "B" },
    { index: 5, group: "B" },
    { index: 6, group: "B" },
    { index: 7, group: "C" },
    { index: 8, group: "C" },
    { index: 9, group: "C" },
  ];

  const circleScale = d3
    .scaleBand()
    .domain(items.map((d) => d.index))
    .range([0, 2 * Math.PI]);

  d3.csv("./solutions-data.csv").then((data) => {
    console.log(data);
  });

  return html`
    <svg viewBox="0 0 ${width} ${height}">
      <g transform="translate(${width / 2}, ${height / 2})">
        <circle r="${innerRadius}" fill="none" stroke="black" />
        <circle r="${outerRadius}" fill="none" stroke="black" />
        <g text-anchor="middle">
          <text dy="-1rem">Childcare</text>
          <text dy="0rem">Solutions</text>
          <text dy="1.5rem">
            Hover on a solution to preview, click to read more and see resource
          </text>
        </g>

        <g class="petals">
          <!-- translate group to innerRadius then rotate along circle -->
          ${items.map(
            (item) => html`
              <g
                class="petal"
                transform="rotate(${radiansToDegrees(circleScale(item.index)) -
                90}) translate(${innerRadius},0)"
              >
                <rect x="-10" y="-10" width="20" height="20" fill="red" />
              </g>
            `
          )}
        </g>
      </g>
    </svg>
  `;
}

render(html`<${Viz} />`, document.getElementById("solution-viz"));
