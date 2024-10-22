// © 2024 Data Culture
// Released under the ISC license.
// https://studio.datacult.com/

import { h, render } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

// set asset path based on environment
const ENV = "production"; // development or production
let ASSET_PATH = "";
if (ENV === "development") {
  console.log("Solutions Viz - Development mode");
  ASSET_PATH = "./assets";
} else {
  console.log("Solutions Viz - Production mode");
  ASSET_PATH =
    "https://datacult.github.io/caseforchildcare-y2-solutions-viz/assets";
}

const html = htm.bind(h);

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

// create arc for textPath (no return line)
// source: https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/
function getArcForTextPlacement(arc, angle, category) {
  var firstArcSection = /(^.+?)L/;
  // The [1] gives back the expression between the () (thus not the L as well) which is exactly the arc statement
  var newArc = firstArcSection.exec(arc)[1];
  // Replace all the comma's so that IE can handle it -_-
  // The g after the / is a modifier that "find all matches rather than stopping after the first match"
  newArc.replace(/,/g, " ");

  if (radiansToDegrees(angle) > 90 && radiansToDegrees(angle) < 270) {
    // Everything between the capital M and first capital A
    var startLoc = /M(.*?)A/;
    // Everything between the capital A and 0 0 1
    var middleLoc = /A(.*?)0,0,1/;
    // Everything between the 0 0 1 and the end of the string (denoted by $)
    var endLoc = /0,0,1,(.*?)$/;
    // Flip the direction of the arc by switching the start and end point and using a 0 (instead of 1) sweep flag
    var newStart = endLoc.exec(newArc)[1];
    var newEnd = startLoc.exec(newArc)[1];
    var middleSec = middleLoc.exec(newArc)[1];

    //Build up the new arc notation, set the sweep-flag to 0
    newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
  }
  return newArc;
}

function Viz() {
  // square size
  const width = 1300;
  const height = 1300;

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
    d3.csv(`${ASSET_PATH}/data/solutions-data.csv`).then((loadedData) => {
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
    .domain(data.map((_, index) => index))
    .range([0, 2 * Math.PI])
    .padding(circlePadding);

  function handlePetalClick(item) {
    // open modal with item details, TODO: implement in Webflow
    console.log(item);
  }

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

    // create arc for hover state (no padding), invisible
    const petalArcHover = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadiusPetals)
      .startAngle(circleScale(index))
      .endAngle(circleScale(index) + circleScale.bandwidth())
      .padAngle(-1)
      .cornerRadius(18);

    let petalTextAngle =
      radiansToDegrees(circleScale(index) + circleScale.bandwidth() / 2) - 90;
    let petalIconAngleBack =
      -1 * radiansToDegrees(circleScale(index) + circleScale.bandwidth() / 2) -
      90 +
      180;
    let petalTextTranslateX =
      innerRadius + (outerRadiusPetals - innerRadius) / 2;
    let petalButtonTranslateX = innerRadius + 22;

    // flip text if it's on the lower half of the circle
    if (radiansToDegrees(circleScale(index)) > 180) {
      petalTextAngle += 180;
      petalTextTranslateX *= -1;
      petalButtonTranslateX *= -1;
      petalIconAngleBack += 180;
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
        onclick="${() => handlePetalClick(item)}"
      >
        <path d="${petalArc()}" stroke="none" />
        <path
          d="${petalArcHover()}"
          opacity="0"
          onmouseover="${() => setHoveredItem(item)}"
          onmouseout="${() => setHoveredItem(null)}"
          stroke="red"
        />
        <text
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${petalTextAngle}) translate(${petalTextTranslateX},0)"
        >
          ${item["Solution abbreviation"]}
        </text>
        <g
          class="detail-button-group ${hoveredItem
            ? hoveredItem === item
              ? "hovered"
              : ""
            : ""}"
          transform="rotate(${petalTextAngle}) translate(${petalButtonTranslateX},0) rotate(${petalIconAngleBack}) "
        >
          <image
            href="${ASSET_PATH}/illustrations/read-more-button.svg"
            alt="Arrow right"
            height="40px"
            width="40px"
            transform="translate(-18,-22)"
          />
        </g>
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

    // create arc for textPath (no return line and flipped if on lower half of circle)
    const textArc = getArcForTextPlacement(categoryArc(), startAngle, category);

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
          <path d="${textArc}" id="category-path-${index}" fill="transparent" />
        </defs>
        <text
          dominant-baseline="hanging"
          dy="${radiansToDegrees(startAngle) > 90 &&
          radiansToDegrees(startAngle) < 270
            ? -21
            : 6}"
        >
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
    <div
      class="innerContent innerContent__default"
      xmlns="http://www.w3.org/1999/xhtml"
    >
      <p class="title">Childcare Solutions</p>
      <p class="subtitle">
        Hover on a solution to preview, click in to see details and resources.
      </p>
      <img
        src="${ASSET_PATH}/illustrations/hover-click.svg"
        alt="Illustration of hover and click for the petals of the viz"
        class="hover-image"
      />
    </div>
  `;

  function innerContentHovered() {
    return html`
      <div
        class="innerContent innerContent__hovered"
        xmlns="http://www.w3.org/1999/xhtml"
      >
        <img
          src="${ASSET_PATH}/illustrations/${hoveredItem["Category"]}.svg"
          alt="${hoveredItem["Category"]}"
          class="category-image"
        />
        <div class="category-pill" data-category="${hoveredItem["Category"]}">
          ${hoveredItem["Category"]}
        </div>
        <p class="solution-title">${hoveredItem["Solution abbreviation"]}</p>
        <p class="solution-subtitle">${hoveredItem["Solution"]}</p>
      </div>
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
        <g class="innerContent">
          <g transform="translate(-${innerRadius - 20},-${innerRadius - 20})">
            <foreignObject
              x="0"
              y="0"
              width="${innerRadius * 2 - 40}"
              height="${innerRadius * 2 - 40}"
            >
              ${innerContent}
            </foreignObject>
          </g>
        </g>
      </g>
    </svg>
  `;
}

const vizContainerElement = document.getElementById("solution-viz");
if (vizContainerElement) {
  render(html`<${Viz} />`, vizContainerElement);
} else {
  console.error(
    "Could not find container element for solution viz with id 'solution-viz'"
  );
}
