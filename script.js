import { h, render } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function Viz() {
  // square size
  const width = 1200;
  const height = 1200;

  const outerRadiusCategories = width / 2 - 20;
  const innerRadiusCategories = outerRadiusCategories - 27; // 27 is the width of the category arc
  const outerRadiusPetals = innerRadiusCategories - 32; // 32 is the distance between the category arc and petals
  const innerRadius = outerRadiusPetals - 290; // 290 is the width of a petal arc

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);

  // load data
  useEffect(() => {
    d3.csv("./solutions-data.csv").then((loadedData) => {
      // save data to state
      // TODO: add sorting for safety in case data changes in file?
      setData(loadedData);

      // get unique categories
      const uniqueCategories = Array.from(
        new Set(loadedData.map((d) => d["Category"]))
      );
      setCategories(uniqueCategories);
    });
  }, []);

  // scale to position petals in a circle
  const circleScale = d3
    .scaleBand()
    .domain(data.map((d, index) => index))
    .range([0, 2 * Math.PI])
    .padding(0.01);

  console.log(data);

  // translate group to innerRadius then rotate along circle
  const petalGroups = data.map((item, index) => {
    const petalArc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadiusPetals)
      .startAngle(circleScale(index))
      .endAngle(circleScale(index) + circleScale.bandwidth())
      .padAngle(0.01)
      .cornerRadius(18);

    return html`
      <g class="petal" data-category="${item["Category"]}">
        <path d="${petalArc()}" />
      </g>
    `;
  });

  const categoryGroups = categories.map((category) => {
    const categoryData = data.filter((d) => d["Category"] === category);
    const categoryArc = d3
      .arc()
      .innerRadius(innerRadiusCategories)
      .outerRadius(outerRadiusCategories)
      .startAngle(circleScale(data.indexOf(categoryData[0])))
      .endAngle(
        circleScale(data.indexOf(categoryData[categoryData.length - 1]))
      );
    return html`
      <g class="category" data-category="${category}">
        <path d="${categoryArc()}" />
      </g>
    `;
  });

  return html`
    <svg viewBox="0 0 ${width} ${height}">
      <g transform="translate(${width / 2}, ${height / 2})">
        <circle r="${innerRadius}" fill="none" stroke="#ccc" />
        <circle r="${outerRadiusPetals}" fill="none" stroke="#ccc" />
        <circle r="${outerRadiusPetals}" fill="none" stroke="#ccc" />
        <g text-anchor="middle">
          <text dy="-1rem">Childcare</text>
          <text dy="0rem">Solutions</text>
          <text dy="1.5rem">Hover on a solution to preview</text>
        </g>
        <g class="categories">${categoryGroups}</g>
        <g class="petals">${petalGroups}</g>
      </g>
    </svg>
  `;
}

render(html`<${Viz} />`, document.getElementById("solution-viz"));
