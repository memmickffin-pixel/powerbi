# Hover Amplify Column (Power BI custom visual)

A lightweight clustered column chart that **amplifies** the hovered bar and subtly emphasizes its neighbors. Built with D3 and the Power BI Visuals API.

## Features
- Category + optional Series clustering (similar to the built-in clustered column chart)
- Smooth hover animation (scale on hovered bar, subtle scale on neighbors)
- Simple data labels

## Repository layout
```
hover-amplify-column/
  assets/icon.png
  capabilities.json
  package.json
  pbiviz.json
  README.md        ← (this file)
  src/visual.ts
  style/visual.less
.github/
  workflows/
    build-pbiviz.yml
```

## Prerequisites
- **Node.js LTS** (e.g., 20.x)
- **Power BI Visuals Tools** (CLI): `powerbi-visuals-tools` (provides the `pbiviz` command)

> If you don't want to install anything locally, use the provided **GitHub Actions** workflow; it will produce a `.pbiviz` artifact from CI.

## Local build & package
```bash
# 1) install the CLI (one-time)
npm install -g powerbi-visuals-tools

# 2) install project dependencies
cd hover-amplify-column
npm ci || npm install

# 3) package the visual (creates dist/<name>.pbiviz)
pbiviz package
```

## Import into Power BI Desktop
1. Open Power BI Desktop
2. **Insert → Get more visuals → Import a visual from a file**
3. Select the generated `.pbiviz` from `hover-amplify-column/dist/`

## GitHub Actions (CI build)
The workflow at `.github/workflows/build-pbiviz.yml` packages the visual on every push to `main` and on manual dispatch. The output `.pbiviz` is uploaded as a pipeline artifact.

### Tag-and-release (optional)
If you add the optional release job, pushing a tag like `v1.0.0` will create a GitHub Release and attach the `.pbiviz` automatically.

## Notes & limits
- Very large category/series counts may truncate axis ticks.
- Tooltips and cross-filtering selections are not implemented in this minimal version.

## License
MIT
