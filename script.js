import { h, render } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
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

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);

  // load data
  useEffect(() => {
    d3.csv("./solutions-data.csv").then((loadedData) => {
      setData(loadedData);
      // get unique categories
      const uniqueCategories = Array.from(
        new Set(loadedData.map((d) => d["Category"]))
      );
      setCategories(uniqueCategories);
      console.log(uniqueCategories);
    });
  }, []);

  // scale to position petals in a circle
  const circleScale = d3
    .scaleBand()
    .domain(data.map((d, index) => index))
    .range([0, 2 * Math.PI]);

  console.log(data);

  // translate group to innerRadius then rotate along circle
  const petals = data.map(
    (item, index) => html`
      <g
        class="petal"
        transform="rotate(${radiansToDegrees(circleScale(index)) -
        90}) translate(${innerRadius},0)"
        data-category="${item["Category"]}"
      >
        <rect x="0" y="-10" width="100" height="20" />
      </g>
    `
  );

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
        <g class="petals">${petals}</g>
      </g>
    </svg>
  `;
}

render(html`<${Viz} />`, document.getElementById("solution-viz"));
