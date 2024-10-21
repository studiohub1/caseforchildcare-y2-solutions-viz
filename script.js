import { h, render } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

// create arc for textPath (no return line)
// source: https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/
function getArcForTextPlacement(arc) {
  var firstArcSection = /(^.+?)L/;
  //The [1] gives back the expression between the () (thus not the L as well)
  //which is exactly the arc statement
  var newArc = firstArcSection.exec(arc)[1];
  //Replace all the comma's so that IE can handle it -_-
  //The g after the / is a modifier that "find all matches rather than
  //stopping after the first match"
  return newArc.replace(/,/g, " ");
}

function Viz() {
  // square size
  const width = 1200;
  const height = 1200;

  const outerRadiusCategories = width / 2 - 20;
  const innerRadiusCategories = outerRadiusCategories - 27; // 27 is the width of the category arc
  const outerRadiusPetals = innerRadiusCategories - 32; // 32 is the distance between the category arc and petals
  const innerRadius = outerRadiusPetals - 290; // 290 is the width of a petal arc

  const circlePadding = 0.01;

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);

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
    .padding(circlePadding);

  console.log(data);

  // translate group to innerRadius then rotate along circle
  const petalGroups = data.map((item, index) => {
    const petalArc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadiusPetals)
      .startAngle(circleScale(index))
      .endAngle(circleScale(index) + circleScale.bandwidth())
      .padAngle(circlePadding)
      .cornerRadius(18);

    let petalTextAngle =
      radiansToDegrees(circleScale(index) + circleScale.bandwidth() / 2) - 90;
    let petalTextTranslateX =
      innerRadius + (outerRadiusPetals - innerRadius) / 2;

    // flip text if it's on the lower half of the circle
    if (radiansToDegrees(circleScale(index)) > 180) {
      petalTextAngle += 180;
      petalTextTranslateX *= -1;
    }

    return html`
      <g
        class="petal ${hoveredItem
          ? hoveredItem === item
            ? ""
            : "petal__not_hovered"
          : ""}"
        data-category="${item["Category"]}"
        data-solution="${item["Solution abbreviation"]}"
        onmouseover="${() => setHoveredItem(item)}"
        onmouseout="${() => setHoveredItem(null)}"
      >
        <path d="${petalArc()}" />
        <text
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${petalTextAngle}) translate(${petalTextTranslateX},0)"
        >
          ${item["Solution abbreviation"]}
        </text>
      </g>
    `;
  });

  const categoryGroups = categories.map((category, index) => {
    const categoryData = data.filter((d) => d["Category"] === category);

    const startAngle =
      circleScale(data.indexOf(categoryData[0])) + circlePadding;
    const endAngle =
      circleScale(data.indexOf(categoryData[categoryData.length - 1])) +
      circleScale.bandwidth() -
      circlePadding;

    const categoryArc = d3
      .arc()
      .innerRadius(innerRadiusCategories)
      .outerRadius(outerRadiusCategories)
      .startAngle(startAngle)
      .endAngle(endAngle);

    const textArc = getArcForTextPlacement(categoryArc());

    // TODO: flip text if it's on the lower half of the circle --> https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/

    return html`
      <g
        class="category ${hoveredItem
          ? hoveredItem["Category"] === category
            ? ""
            : "category__not_hovered"
          : ""}"
        data-category="${category}"
      >
        <path d="${categoryArc()}" />

        <defs>
          <path d="${textArc}" id="category-path-${index}" />
        </defs>
        <text dominant-baseline="hanging" dy="4">
          <textPath
            href="#category-path-${index}"
            startOffset="50%"
            text-anchor="middle"
            >${category}</textPath
          >
        </text>
      </g>
    `;
  });

  const innerContentDefault = html`
    <g transform="translate(-${innerRadius - 20},-${innerRadius - 20})">
      <foreignObject
        x="0"
        y="0"
        width="${innerRadius * 2 - 40}"
        height="${innerRadius * 2 - 40}"
      >
        <div
          class="innerContent innerContent__default"
          xmlns="http://www.w3.org/1999/xhtml"
        >
          <p class="title">Childcare Solutions</p>
          <p class="subtitle">
            Hover on a solution to preview, click in to see details and
            resources.
          </p>
          <img
            src="./illustrations/hover-click.svg"
            alt="Illustration of hover and click for the petals of the viz"
            class="hover-image"
          />
        </div>
      </foreignObject>
    </g>
  `;

  function innerContentHovered() {
    return html`
      <g transform="translate(-${innerRadius - 20},-${innerRadius - 20})">
        <foreignObject
          x="0"
          y="0"
          width="${innerRadius * 2 - 40}"
          height="${innerRadius * 2 - 40}"
        >
          <div
            class="innerContent innerContent__hovered"
            xmlns="http://www.w3.org/1999/xhtml"
          >
            <img
              src="./illustrations/${hoveredItem["Category"]}.svg"
              alt="${hoveredItem["Category"]}"
              class="category-image"
            />
            <div
              class="category-pill"
              data-category="${hoveredItem["Category"]}"
            >
              ${hoveredItem["Category"]}
            </div>
            <p class="solution-title">
              ${hoveredItem["Solution abbreviation"]}
            </p>
            <p class="solution-subtitle">${hoveredItem["Solution"]}</p>
          </div>
        </foreignObject>
      </g>
    `;
  }

  const innerContent = hoveredItem
    ? innerContentHovered()
    : innerContentDefault;

  return html`
    <svg viewBox="0 0 ${width} ${height}">
      <g transform="translate(${width / 2}, ${height / 2})">
        <g class="categories">${categoryGroups}</g>
        <g class="petals">${petalGroups}</g>
        <g class="innerContent">${innerContent}</g>
      </g>
    </svg>
  `;
}

render(html`<${Viz} />`, document.getElementById("solution-viz"));
