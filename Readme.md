# Solutions Visualization

## Update data

- Download Google sheet as a CSV file
- Name the file `solutions-data.csv` and replace the existing data file in the folder `/assets/data`
- Make sure that the categories are written exactly as before (e.g. case sensitive), so the categories are matched correctly

## Updating categories (setting correct colors)

- Update the categories in the Google sheet and export as described above
- Go into `style.css` and change the hard-coded category names in data-category selectors
- If you want to adjust the CSS variables, change the CSS variable settings at the top of that stylesheet

- There is a hard coded category naming logic in the `detailView.js` file, so make sure to adjust the category name there as well
- Illustrations are named exactly as the category, so make sure your updated categories have a corresponding illustration svg file in the folder `/assets/illustrations`

## Exporting SVG

- Open into browser inspect tool on tab "Elements", go to SVG element
- Delete the whole group with the class "innerContent" (because the image element in that group is throwing an error when exported, misses a closing tag)
- then go to surrounding SVG element, right-click to "Edit as HTML", copy all content
- then open a new file in your preferred text editor and paste the content, save file as svg
- import in your design tool of choice

- result is non-colored version of viz as SVG, when imported in Figma text on path for categories gets omitted (due to Figma reasons)
