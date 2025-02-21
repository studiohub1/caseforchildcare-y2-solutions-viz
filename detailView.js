/***
 * DETAIL VIEW (partly handled within Webflow itself)
 */

const categoryColorsWithNames = {
  "direct care solutions": "coral",
  "employee engagement & culture": "green",
  "financial support & benefits": "plum",
  "flexible work & leave policies": "violet",
  "learning & assessment": "tangerine",
  "policy, advocacy, & systemic change": "teal",
};

const categoryColors = {
  violet: "#d6b9ff", // background color
  violetdeep: "#6a3daa", // text color for outer elements
  violettransparent: "rgba(214, 185, 255, 0.25)", // transparent color
  violettext: "#202124", // black or white text color

  coral: "#e0594f",
  coraldeep: "#b63b32",
  coraltransparent: "rgba(224, 89, 79, 0.18)",
  coraltext: "#fff",

  plum: "#733250",
  plumdeep: "#5d1e3b",
  plumtransparent: "rgba(115, 50, 80, 0.14)",
  plumtext: "#fff",

  green: "#99d68f",
  greendeep: "#3d6537",
  greentransparent: "rgba(153, 214, 143, 0.2)",
  greentext: "#202124",

  tangerine: "#ff8a53",
  tangerinedeep: "#bc592a",
  tangerinetransparent: "rgba(255, 138, 83, 0.2)",
  tangerinetext: "#202124",

  teal: "#2b91ad",
  tealdeep: "#0b5d73",
  tealtransparent: "rgba(43, 145, 173, 0.16)",
  tealtext: "#fff",
};

// interaction with detail view coded in Webflow
export function handlePetalClick(item, ASSET_PATH) {
  // in detail view, show correct solution details (on click in the petal)
  showSolutionDetailGroup(item["Solution ID"]);

  // build up resource panel manually due to Webflow restrictions
  showDetailResources(item["Solution ID"], item["Category"], ASSET_PATH);

  // build up quote panel manually due to Webflow restrictions
  showDetailQuotes(item["Solution ID"], item["Category"], ASSET_PATH);

  // build up case study panel manually due to Webflow restrictions
  showDetailCases(item["Solution ID"], item["Category"], ASSET_PATH);

  // show the solution details modal
  const solutionsModal = document.getElementById("solution-details");
  solutionsModal.style.display = "flex";

  // in detail view, show correct nav item as selected (on click in the petal)
  const detailNavItems = document.querySelectorAll(
    ".solution-details__nav-item"
  );
  detailNavItems.forEach((navItem) => {
    navItem.classList.remove("selected");
  });
  const selectedNavItem = document.querySelector(
    `.solution-details__nav-item[solution-id="${item["Solution ID"]}"]`
  );
  if (selectedNavItem) {
    selectedNavItem.classList.add("selected");
  }

  // scroll to selected nav item
  if (
    document.querySelector(".solution-details__nav-item.selected") &&
    window.innerWidth > 991
  ) {
    const container = document.querySelector(".solution-details__nav");
    const selectedItem = container.querySelector(
      ".solution-details__nav-item.selected"
    );

    container.scroll({
      top:
        selectedItem.offsetTop -
        container.offsetTop -
        container.clientHeight / 2 +
        selectedItem.clientHeight / 2,
      behavior: "smooth",
    });
  }
}

// in detail view, show correct solution details
function showSolutionDetailGroup(solutionId) {
  const detailGroupItems = document.querySelectorAll(
    ".solution-details__group"
  );
  detailGroupItems.forEach((groupItem) => {
    groupItem.classList.remove("shown");
  });
  const selectedGroupItem = document.querySelector(
    `.solution-details__group[solution-id="${solutionId}"]`
  );
  if (selectedGroupItem) {
    selectedGroupItem.classList.add("shown");
  }
}

function showDetailResources(
  solutionId,
  categoryName = "direct care solutions",
  ASSET_PATH
) {
  d3.csv(`${ASSET_PATH}/data/resources-data.csv`).then((resourcesData) => {
    // find all resources for the solution, depending on the solution id
    const solutionResources = resourcesData.filter(
      (d) => d["Solution ID"] === solutionId
    );
    const colorName = categoryColorsWithNames[categoryName.toLowerCase()];
    const resourceContentHtml = solutionResources
      .map((resource) => {
        return `<a href="${resource["Resource link"]}" target="_blank" style="border-color:${categoryColors[colorName]}" class="solution-details__resources-item"><div class="solution-details__resources-item__title-row w-layout-hflex"><div class="h-s__medium">${resource["Resource title"]}</div><div class="solution-details__resources-caret w-embed"><svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 7L1 12.5" stroke="#202124" stroke-width="2"></path></svg></div></div><p>${resource["Resource description"]}</p></a>`;
      })
      .join("");
    const resourcesContainer = document.querySelector(
      `.solution-details__group[solution-id="${solutionId}"] .solution-details__resources-list`
    );
    resourcesContainer.innerHTML = resourceContentHtml;
  });
}

function showDetailQuotes(solutionId, categoryName, ASSET_PATH) {
  d3.csv(`${ASSET_PATH}/data/quotes-data.csv`).then((quotesData) => {
    // find all quotes for the solution, depending on the solution id
    const solutionQuotes = quotesData.filter(
      (d) => d["Solution ID"] === solutionId
    );
    const colorName = categoryColorsWithNames[categoryName.toLowerCase()];
    const transparentColor = categoryColors[`${colorName}transparent`];
    const outerTextColor = categoryColors[`${colorName}deep`];

    const quoteContentHtml = solutionQuotes
      .map((quote) => {
        return `<div
              style="background-color:${transparentColor};color:${outerTextColor}"
              class="w-layout-vflex solution-details__quotes-item"
            >
              <p class="h-s__medium-long">
                ${quote["Quote"]}
              </p>
              <div class="w-layout-vflex solution-details__quotes-author">
                <div class="h-s__medium">${quote["Author name"]}</div>
                <p class="p-small">
                  ${quote["Author title"]}
                </p>
              </div>
            </div>`;
      })
      .join("");
    const quotesContainer = document.querySelector(
      `.solution-details__group[solution-id="${solutionId}"] .solution-details__quotes-list`
    );
    quotesContainer.innerHTML = quoteContentHtml;
  });
}

function showDetailCases(solutionId, categoryName, ASSET_PATH) {
  d3.csv(`${ASSET_PATH}/data/casestudies-data.csv`).then((caseData) => {
    const solutionCases = caseData.filter(
      (d) => d["Solution ID"] === solutionId
    );
    const colorName = categoryColorsWithNames[categoryName.toLowerCase()];
    const transparentColor = categoryColors[`${colorName}transparent`];
    const backgroundColor = categoryColors[colorName];
    const textColor = categoryColors[`${colorName}text`];

    let casesContentHtml = solutionCases
      .map((caseStudy) => {
        return `<div
              style="border-color:${backgroundColor}"
              class="w-layout-vflex solution-details__cases-item"
            >
              <div
                style="background-color:${backgroundColor};color:${textColor}"
                class="w-layout-vflex solution-details__cases-header"
              >
                <h6>${caseStudy["Case study title"]}</h6>
              </div>
              <div class="w-layout-vflex solution-details__cases-content">
                <p>
                  ${caseStudy["Case study description"]}
                </p>
                <a
                  style="background-color:${transparentColor}"
                  href="${caseStudy["Case study link"]}"
                  target="_blank"
                  class="solution-details__cases-btn w-inline-block"
                  ><div class="p-small">Read more</div>
                  <div class="solution-details__resources-caret w-embed">
                    <svg
                      width="8"
                      height="12"
                      viewBox="0 0 8 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M1 1.5L6 7L1 12.5" stroke="#202124" stroke-width="2"></path>
                    </svg></div
                ></a>
              </div>
            </div>`;
      })
      .join("");

    // add headline for case studies
    if (solutionCases.length > 0) {
      casesContentHtml = `
          <h5 class="h-m__medium">Case studies</h5>
          <div class="w-layout-vflex solution-details__cases-list">
            ${casesContentHtml}
          </div>
        `;
    }
    const casesContainer = document.querySelector(
      `.solution-details__group[solution-id="${solutionId}"] .solution-details__cases-wrapper`
    );
    casesContainer.innerHTML = casesContentHtml;
  });
}

// avoid issue of Webflow nested CMS issue that limits nested collection list items to 5
export function fixDetailViewNavItems(loadedData, ASSET_PATH, LABELS_FILTER) {
  const detailNavGroups = document.querySelectorAll(
    ".solution-details__nav-group"
  );
  detailNavGroups.forEach((navGroup) => {
    // remove everything from the nav group
    navGroup.innerHTML = "";
    // get the category name
    const categoryName = navGroup.getAttribute("category");
    // get the solutions in the category
    const categorySolutions = loadedData.filter(
      (d) => d["Category"].toLowerCase() === categoryName.toLowerCase()
    );
    // add the solutions to the nav group
    categorySolutions.forEach((solution) => {
      const colorName = categoryColorsWithNames[categoryName.toLowerCase()];
      const borderColor = categoryColors[colorName];
      const textColor = categoryColors[`${colorName}deep`];

      navGroup.innerHTML += `
          <div class="solution-details__nav-item w-dyn-item" role="listitem" solution-id="${solution["Solution ID"]}" solution-category="${solution["Category"]}" style="border-color:${borderColor}">
            <div class="p-small" style="color:${textColor}; display: flex;justify-content:space-between;align-items: center;">
              <span>${solution["Solution abbreviation"]}</span>
            </div>
          </div>
        `;
    });
  });

  // in detail view, on click in the nav
  const detailNavItems = document.querySelectorAll(
    ".solution-details__nav-item"
  );
  detailNavItems.forEach((navItem) => {
    navItem.onclick = function () {
      // have the correct nav item selected
      detailNavItems.forEach((navItem) => {
        navItem.classList.remove("selected");
      });
      navItem.classList.add("selected");

      // change the detail content to the correct group
      showSolutionDetailGroup(navItem.getAttribute("solution-id"));

      // show the resources for the solution
      showDetailResources(
        navItem.getAttribute("solution-id"),
        navItem.getAttribute("solution-category"),
        ASSET_PATH
      );

      // show the quotes for the solution
      showDetailQuotes(
        navItem.getAttribute("solution-id"),
        navItem.getAttribute("solution-category"),
        ASSET_PATH
      );

      // show the case studies for the solution
      showDetailCases(
        navItem.getAttribute("solution-id"),
        navItem.getAttribute("solution-category"),
        ASSET_PATH
      );

      // on tablet and down, hide the nav and show the details
      if (window.innerWidth <= 991) {
        document.querySelector(".solution-details__nav").style.display = "none";
        document.querySelector(
          ".solution-details__group-wrapper"
        ).style.display = "block";
      }
    };
  });
}

function starIconSvg() {
  return `<svg width="16" height="16" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_6645_3547)">
      <path d="M10.309 8.75398L12.5 2.01089L14.691 8.75398C14.9226 9.46695 15.587 9.94967 16.3367 9.94967L23.4268 9.94967L17.6908 14.1171C17.0843 14.5578 16.8305 15.3388 17.0622 16.0518L19.2531 22.7949L13.5171 18.6274C12.9106 18.1868 12.0894 18.1868 11.4829 18.6274L5.74687 22.7949L7.93783 16.0518C8.16949 15.3388 7.91571 14.5578 7.30922 14.1171L1.5732 9.94967L8.66331 9.94967C9.41298 9.94967 10.0774 9.46695 10.309 8.75398Z" stroke="currentColor" stroke-width="1.86083"/>
    </g>
    <defs>
      <clipPath id="clip0_6645_3547">
        <rect width="25" height="25" fill="white"/>
      </clipPath>
    </defs>
  </svg>
`;
}

function triangleIconSvg() {
  return `<svg width="16" height="16" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="icon_triangle" clip-path="url(#clip0_6645_3545)">
    <path id="Polygon 13" d="M12.5 3.26615L23.0068 20.837L1.99317 20.837L12.5 3.26615Z" stroke="currentColor" stroke-width="2.32604"/>
    </g>
    <defs>
    <clipPath id="clip0_6645_3545">
    <rect width="25" height="25" fill="white"/>
    </clipPath>
    </defs>
  </svg>
  `;
}

function circleIconSvg() {
  return `<svg width="16" height="16" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12.5" cy="12.5" r="10.337" stroke="currentColor" stroke-width="2.32604"/>
  </svg>`;
}
