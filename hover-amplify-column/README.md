
# Hover Amplify Column (custom Power BI visual)

A clustered column chart that adds a smooth **grow** animation on hover. The hovered bar enlarges, and its immediate neighbors get a subtle emphasis. Built with D3 and the Power BI visuals API.

## Features
- Category + (optional) Series clustering (like the core clustered column chart)
- Smooth hover animation that scales the hovered bar and lightly scales its neighbors
- Simple data labels

## Build & Import
1. Install Node LTS and the Power BI visuals tools:
   ```bash
   npm install -g powerbi-visuals-tools@latest
   ```
2. In this project folder, install dependencies and package the visual:
   ```bash
   npm install
   pbiviz package
   ```
3. Import the generated `.pbiviz` from the `dist/` folder into Power BI Desktop:
   **Insert > Get more visuals > Import a visual from a file**.

## Data Roles
- **Category** (required): categorical axis
- **Series** (optional): creates clustered columns within each category
- **Y** (required): values

## Animation knobs (Formatting pane)
- Hover scale (default 1.15)
- Neighbor scale (default 1.05)
- Duration (ms) (default 180)

> Note: The hover animation uses SVG transforms (scale) anchored to the bottom of each bar for a purely visual emphasis without changing the underlying data.

## Known limits
- Very large category/series counts may truncate axis ticks.
- Tooltips and cross-filtering selections are not implemented in this minimal version.

MIT License.
