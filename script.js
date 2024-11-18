// © 2024 Data Culture
// Released under the ISC license.
// https://studio.datacult.com/

import { h, render } from "https://esm.sh/preact";
import { useState, useEffect, useRef } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { handlePetalClick, fixDetailViewNavItems } from "./detailView.js";

// set asset path based on environment
const ENV = "production"; // development or production
let ASSET_PATH = "";
if (ENV === "development") {
  ASSET_PATH = "./assets";
} else {
  ASSET_PATH =
    "https://datacult.github.io/caseforchildcare-y2-solutions-viz/assets";
}

const html = htm.bind(h);

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

// create arc for textPath (no return line)
// source: https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/
function getArcForTextPlacement(angle, arcDefault, arcReversed) {
  let arc = arcDefault;
  if (radiansToDegrees(angle) > 90 && radiansToDegrees(angle) < 270) {
    arc = arcReversed;
  }

  var firstArcSection = /(^.+?)L/;
  // The [1] gives back the expression between the () (thus not the L as well) which is exactly the arc statement
  var newArc = firstArcSection.exec(arc)[1];
  // Replace all the comma's so that IE can handle it -_-
  // The g after the / is a modifier that "find all matches rather than stopping after the first match"
  newArc.replace(/,/g, " ");
  return newArc;
}

function Viz() {
  // state
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isInView, setIsInView] = useState(false);
  const vizRef = useRef(null);

  // square size
  const squareSize = 1300;
  const margin = 20;

  const widthCategoryArc = 27;
  const distanceCategoryArcPetals = 32;
  const lengthPetals = 290;

  const outerRadiusCategories = squareSize / 2 - margin;
  const innerRadiusCategories = outerRadiusCategories - widthCategoryArc; // 27 is the width of the category arc
  const outerRadiusPetals = innerRadiusCategories - distanceCategoryArcPetals; // 32 is the distance between the category arc and petals
  const innerRadius = outerRadiusPetals - lengthPetals; // 290 is the width of a petal arc

  const circlePadding = 0.01;
  const spaceBetweenGroups = 0.035;
  const spaceBetweenPetalsWithinGroup = 0.01;
  const cornerRadiusPetals = 15; // before 18

  const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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

      fixDetailViewNavItems(loadedData, ASSET_PATH, LABELS);
    });
  }, []);

  // Intersection Observer to check if Viz is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.5 }
    );

    if (vizRef.current) {
      observer.observe(vizRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // scale to position petals in a circle
  const circleScale = d3
    .scaleBand()
    .domain(data.map((_, index) => index))
    .range([0, 2 * Math.PI])
    .padding(circlePadding);

  // solution label ("filter") content
  const LABELS = {
    "How can I innovate?": "star",
    "How can I most support frontline workers?": "circle",
    "How do I get started?": "triangle",
  };

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
      let petalFilterIconTranslateX = outerRadiusPetals - 30;

      // flip text if it's on the lower half of the circle
      if (radiansToDegrees(groupScale(petalGroupItemIndex)) > 180) {
        petalTextAngle += 180;
        petalTextTranslateX *= -1;
        petalButtonTranslateX *= -1;
        petalFilterIconTranslateX *= -1;
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
          solution-id="${item["Solution ID"]}"
          onclick="${() => handlePetalClick(item, ASSET_PATH)}"
          fill="grey"
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
            y="5"
            transform="rotate(${petalTextAngle}) translate(${petalTextTranslateX},0)"
            fill="black"
            class="petal-text"
          >
            ${item["Solution abbreviation"]}
          </text>
          ${item["Filter category"] !== ""
            ? html` <g
                transform="rotate(${petalTextAngle}) translate(${petalFilterIconTranslateX},0) rotate(${petalIconAngleBack})"
                class="filter-icon"
              >
                <image
                  href="${ASSET_PATH}/illustrations/icon_${LABELS[
                    item["Filter category"]
                  ]}_white.png"
                  alt="Category for solution"
                  height="20px"
                  width="20px"
                  transform="translate(-10,-10)"
                />
              </g>`
            : null}
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

    const categoryArcShape = d3
      .arc()
      .innerRadius(innerRadiusCategories)
      .outerRadius(outerRadiusCategories)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(10);

    // make text arc slightly wider than category arc to avoid text clipping in case of only few petals per category,
    // exact value not relevant as category text is centered on path
    const categoryTextSideOverlap = 0.5;
    const categoryArcTextDefault = d3
      .arc()
      .innerRadius(innerRadiusCategories)
      .outerRadius(outerRadiusCategories)
      .startAngle(startAngle - categoryTextSideOverlap)
      .endAngle(endAngle + categoryTextSideOverlap)
      .cornerRadius(10);

    const categoryArcTextReversed = d3
      .arc()
      .innerRadius(innerRadiusCategories)
      .outerRadius(outerRadiusCategories)
      .startAngle(endAngle + categoryTextSideOverlap)
      .endAngle(startAngle - categoryTextSideOverlap)
      .cornerRadius(10);

    // create arc for textPath (no return line and using reversed arc on lower half of circle)
    const textArc = getArcForTextPlacement(
      startAngle,
      categoryArcTextDefault(),
      categoryArcTextReversed()
    );

    let dy =
      radiansToDegrees(startAngle) > 90 && radiansToDegrees(startAngle) < 270
        ? -21
        : 6;
    if (IS_SAFARI) {
      dy =
        radiansToDegrees(startAngle) > 90 && radiansToDegrees(startAngle) < 270
          ? -8
          : 20;
    }

    return html`
      <g
        class="category ${hoveredItem
          ? hoveredItem["Category"] === petalGroup.category
            ? ""
            : "category__not_hovered"
          : ""}"
        data-category="${petalGroup.category}"
      >
        <path d="${categoryArcShape()}" fill="grey" />

        <defs>
          <path d="${textArc}" id="category-path-${index}" fill="transparent" />
        </defs>
        <text class="cat-text" dominant-baseline="hanging" dy="${dy}">
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
      <div class="legend">
        <p class="legend__item">
          <img
            src="${ASSET_PATH}/illustrations/icon_triangle_black.png"
            alt="triangle icon"
          />
          <span>How do I get started?</span>
        </p>
        <p class="legend__item">
          <img
            src="${ASSET_PATH}/illustrations/icon_star_black.png"
            alt="star icon"
          />
          <span>How can I innovate?</span>
        </p>
        <p class="legend__item">
          <img
            src="${ASSET_PATH}/illustrations/icon_circle_black.png"
            alt="circle icon"
          />
          <span>How can I most support frontline workers?</span>
        </p>
      </div>
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
    <div ref=${vizRef}>
      <svg
        viewBox="0 0 ${squareSize} ${squareSize}"
        xmlns="http://www.w3.org/2000/svg"
        transform="scale(${isInView ? 1 : 0.5})"
        transform-origin="center top"
        class="${isInView ? "in-view" : "not-in-view"} ${IS_SAFARI
          ? "is-safari"
          : ""}"
      >
        <g transform="translate(${squareSize / 2}, ${squareSize / 2})">
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
        </g>
      </svg>
    </div>
  `;
}

function Page() {
  const lorem =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac";

  return html`
    <div class="page">
      <h1>Page</h1>
      ${Array(28).fill(html`<p>${lorem}</p>`)} ${html`<${Viz} />`}
      ${Array(28).fill(html`<p>${lorem}</p>`)}
    </div>
  `;
}

const vizContainerElement = document.getElementById("solution-viz");
if (vizContainerElement) {
  render(html`<${Page} />`, vizContainerElement);
} else {
  console.error(
    "Could not find container element for solution viz with id 'solution-viz'"
  );
}
