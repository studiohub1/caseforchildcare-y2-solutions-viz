// © 2024 Data Culture
// Released under the ISC license.
// https://studio.datacult.com/

import { h, render } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

// set asset path based on environment
const ENV = "development"; // development or production
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
  const margin = 20;

  const widthCategoryArc = 27;
  const distanceCategoryArcPetals = 32;
  const lengthPetals = 290;

  const outerRadiusCategories = width / 2 - margin;
  const innerRadiusCategories = outerRadiusCategories - widthCategoryArc; // 27 is the width of the category arc
  const outerRadiusPetals = innerRadiusCategories - distanceCategoryArcPetals; // 32 is the distance between the category arc and petals
  const innerRadius = outerRadiusPetals - lengthPetals; // 290 is the width of a petal arc

  const circlePadding = 0.01;
  const spaceBetweenGroups = 0.035;
  const spaceBetweenPetalsWithinGroup = 0.01;
  const cornerRadiusPetals = 15; // before 18

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);

  // load data
  useEffect(() => {
    d3.csv(`${ASSET_PATH}/data/solutions-data.csv`).then((loadedData) => {
      // sort data by category
      loadedData.sort((a, b) => {
        if (a["Category"] < b["Category"]) {
          return -1;
        }
        if (a["Category"] > b["Category"]) {
          return 1;
        }
        return 0;
      });

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

  // inside arc
  const insideArc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(innerRadius + 24)
    .startAngle(0)
    .endAngle(2 * Math.PI);

  // spaced petal groups
  const petalGroups = categories.map((category, index) => {
    const categoryData = data.filter((d) => d["Category"] === category);

    const groupStartAngle =
      circleScale(data.indexOf(categoryData[0])) + circlePadding;
    const groupEndAngle =
      circleScale(data.indexOf(categoryData[categoryData.length - 1])) +
      circleScale.bandwidth() -
      circlePadding;

    const groupScale = d3
      .scaleBand()
      .domain(categoryData.map((_, index) => index))
      .range([
        groupStartAngle + spaceBetweenGroups,
        groupEndAngle - spaceBetweenGroups,
      ])
      .padding(spaceBetweenPetalsWithinGroup);

    const petals = categoryData.map((item, petalGroupItemIndex) => {
      const petalArc = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadiusPetals)
        .startAngle(groupScale(petalGroupItemIndex))
        .endAngle(groupScale(petalGroupItemIndex) + groupScale.bandwidth())
        .padAngle(spaceBetweenPetalsWithinGroup)
        .cornerRadius(cornerRadiusPetals);

      // create arc for hover state (no padding), invisible
      const petalArcHover = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadiusPetals)
        .startAngle(groupScale(petalGroupItemIndex))
        .endAngle(groupScale(petalGroupItemIndex) + groupScale.bandwidth())
        .padAngle(0)
        .cornerRadius(cornerRadiusPetals);

      let petalTextAngle =
        radiansToDegrees(
          groupScale(petalGroupItemIndex) + groupScale.bandwidth() / 2
        ) - 90;
      let petalIconAngleBack =
        -1 *
          radiansToDegrees(
            groupScale(petalGroupItemIndex) + groupScale.bandwidth() / 2
          ) -
        90 +
        180;
      let petalTextTranslateX =
        innerRadius + (outerRadiusPetals - innerRadius) / 2;
      let petalButtonTranslateX = innerRadius + 20;

      // flip text if it's on the lower half of the circle
      if (radiansToDegrees(groupScale(petalGroupItemIndex)) > 180) {
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
              href="${ASSET_PATH}/illustrations/detail-button.svg"
              alt="Arrow right"
              height="30px"
              width="30px"
              transform="translate(-15,-15)"
            />
          </g>
        </g>
      `;
    });

    return {
      category: category,
      categoryStartAngle: groupStartAngle,
      categoryEndAngle: groupEndAngle,
      categoryData: categoryData,
      groupScale: groupScale,
      petals: petals,
    };
  });

  // category arcs
  const categoryGroups = petalGroups.map((petalGroup, index) => {
    const startAngle = petalGroup.categoryStartAngle + spaceBetweenGroups;
    const endAngle = petalGroup.categoryEndAngle - spaceBetweenGroups;

    const categoryArc = d3
      .arc()
      .innerRadius(innerRadiusCategories)
      .outerRadius(outerRadiusCategories)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(10);

    // create arc for textPath (no return line and flipped if on lower half of circle)
    const textArc = getArcForTextPlacement(
      categoryArc(),
      startAngle,
      petalGroup.category
    );

    return html`
      <g
        class="category ${hoveredItem
          ? hoveredItem["Category"] === petalGroup.category
            ? ""
            : "category__not_hovered"
          : ""}"
        data-category="${petalGroup.category}"
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
            >${petalGroup.category}</textPath
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

  const inlineStyles = html`
    <style type="text/css">
      /***** color variables ********/
      :root {
        --color-brand-main-purple: #d6b9ff;
        --color-frontline-main-coral: #e0594f;
        --color-frontline-main-plum: #733250;
        --color-frontline-main-green: #99d68f;
        --color-frontline-main-tangerine: #ff8a53;
        --color-frontline-main-teal: #2b91ad;

        --text-color-dark: #202124;
        --text-color-light: #ffffff;
        font-family: "Poppins", sans-serif;
      }

      svg {
        font-family: "Poppins", sans-serif;
        font-weight: 400;
        font-style: normal;
      }

      /***** petals ******/
      .petal text {
        font-size: 14px;
        pointer-events: none;
      }
      .petal {
        cursor: pointer;
        transition: opacity 0.5s ease;
      }
      .petal.petal__not_hovered {
        opacity: 0.24;
      }

      .category {
        transition: opacity 0.5s ease;
        font-size: 16px;
      }
      .category.category__not_hovered {
        opacity: 0.24;
      }

      .detail-button-group image {
        pointer-events: none;
        opacity: 0;
      }

      .detail-button-group.hovered image {
        opacity: 1;
      }

      /******** inner content ********/
      .innerContent {
        width: 100%;
        height: 100%;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /* inner content --- default */
      .innerContent .innerContent__default {
        justify-content: center;
        row-gap: 24px;
        padding-top: 8px;
      }
      .innerContent .title {
        font-family: "VC Henrietta", sans-serif;
        font-size: 61px;
        line-height: 110%;
        margin: 48px 0 0 0;
      }
      .innerContent .subtitle {
        font-size: 16px;
        letter-spacing: 0.32px;
        line-height: 145%;
        text-wrap-style: balance;
        margin: 0;
        max-width: 80%;
      }
      .hover-image {
        width: 63px;
      }

      /* inner content --- hovered */
      .innerContent .innerContent__hovered {
        padding: 36px 0 0;
      }
      .category-image {
        width: 122px;
        height: 122px;
        z-index: 1;
      }
      .category-pill {
        background-color: gray; /* Fallback color */
        border-radius: 100px;
        width: fit-content;
        padding: 8px 24px;
        margin-top: -12px;
        margin-bottom: 64px;
        font-size: 16px;
        line-height: 145%;
        letter-spacing: 0.32px;
      }
      .solution-title {
        font-family: "VC Henrietta", sans-serif;
        font-size: 27px;
        line-height: 120%;
        margin: 0;
        padding: 0 8px 24px;
      }
      .solution-subtitle {
        font-size: 18px;
        line-height: 150%;
        letter-spacing: 0.42px;
        margin: 0;
        padding: 0 16px;
        max-width: 80%;
        text-wrap-style: balance;
      }

      /******** colors based on category data  ***********/
      .petal path,
      .category path {
        fill: gray;
      }

      [data-category="Direct Care Solutions"],
      [data-category="Direct Care Solutions"] path {
        fill: var(--color-frontline-main-coral);
        background-color: var(--color-frontline-main-coral);
      }
      [data-category="Direct Care Solutions"],
      [data-category="Direct Care Solutions"] text {
        fill: var(--text-color-light);
        color: var(--text-color-light);
      }

      [data-category="Employee Engagement & Culture"],
      [data-category="Employee Engagement & Culture"] path {
        fill: var(--color-frontline-main-green);
        background-color: var(--color-frontline-main-green);
      }
      [data-category="Employee Engagement & Culture"],
      [data-category="Employee Engagement & Culture"] text {
        fill: var(--text-color-dark);
        color: var(--text-color-dark);
      }

      [data-category="Financial Support & Benefits"],
      [data-category="Financial Support & Benefits"] path {
        fill: var(--color-frontline-main-plum);
        background-color: var(--color-frontline-main-plum);
      }
      [data-category="Financial Support & Benefits"],
      [data-category="Financial Support & Benefits"] text {
        fill: var(--text-color-light);
        color: var(--text-color-light);
      }

      [data-category="Flexible Work & Leave Policies"],
      [data-category="Flexible Work & Leave Policies"] path {
        fill: var(--color-brand-main-purple);
        background-color: var(--color-brand-main-purple);
      }
      [data-category="Flexible Work & Leave Policies"],
      [data-category="Flexible Work & Leave Policies"] text {
        fill: var(--text-color-dark);
        color: var(--text-color-dark);
      }

      [data-category="Learning & Assessment"],
      [data-category="Learning & Assessment"] path {
        fill: var(--color-frontline-main-tangerine);
        background-color: var(--color-frontline-main-tangerine);
      }
      [data-category="Learning & Assessment"],
      [data-category="Learning & Assessment"] text {
        fill: var(--text-color-dark);
        color: var(--text-color-dark);
      }

      [data-category="Policy, Advocacy, & Systemic Change"],
      [data-category="Policy, Advocacy, & Systemic Change"] path {
        fill: var(--color-frontline-main-teal);
        background-color: var(--color-frontline-main-teal);
      }
      [data-category="Policy, Advocacy, & Systemic Change"],
      [data-category="Policy, Advocacy, & Systemic Change"] text {
        fill: var(--text-color-light);
        color: var(--text-color-light);
      }
    </style>
  `;

  return html`
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- ${inlineStyles} -->
      <g transform="translate(${width / 2}, ${height / 2})">
        <g class="categories">${categoryGroups}</g>
        <g class="petalGroups">
          ${petalGroups.map((petalGroup) => {
            return html` <g class="petalGroup">${petalGroup.petals}</g> `;
          })}
        </g>
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
        <!-- <path d=${insideArc()} fill="#E8E8E8" stroke="#E8E8E8" /> -->
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
