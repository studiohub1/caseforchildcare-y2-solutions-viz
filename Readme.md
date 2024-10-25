# Solutions Visualization

## Update data

- Download Google sheet as a CSV file
- Name the file `solutions-data.csv` and replace the existing data file in the folder `/assets/data`
- Make sure that the categories are written exactly as before (e.g. case sensitive), so the categories are matched correctly

## Updating categories (setting correct colors)

- Update the categories in the Google sheet and export as described above
- Go into `style.css` and change the hard-coded category names in data-category selectors
- If you want to adjust the CSS variables, change the CSS variable settings at the top of that stylesheet

- There is no hard coded category naming logic in the `script.js` file
- Illustrations are named exactly as the category, so make sure your updated categories have a corresponding illustration svg file in the folder `/assets/illustrations`
