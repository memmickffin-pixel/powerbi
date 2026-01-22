
/* eslint-disable */
import "core-js/stable"; // polyfills (pbiviz includes)
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IColorPalette = powerbi.extensibility.IColorPalette;
import ISelectionIdBuilder = powerbi.extensibility.ISelectionIdBuilder;
import { select, Selection } from "d3-selection";
import { scaleBand, scaleLinear } from "d3-scale";
import { max } from "d3-array";
import { axisLeft, axisBottom } from "d3-axis";
import "d3-transition";

type Primitive = string | number | Date | null | undefined;

interface SeriesDataPoint {
  category: Primitive;
  series: string;
  value: number;
}

export class Visual implements IVisual {
  private target: HTMLElement;
  private svg: any;
  private root: any;
  private chart: any;
  private x0: any; // categories
  private x1: any; // series within category
  private y: any;
  private colorPalette: IColorPalette;

  private settings = {
    hoverScale: 1.15,
    neighborScale: 1.05,
    durationMs: 180,
    dataLabel: {
      show: true,
      color: "#ffffff",
      fontSize: 10
    }
  };

  constructor(options: VisualConstructorOptions) {
    this.target = options.element;
    this.colorPalette = options.host.colorPalette;

    this.svg = select(this.target)
      .append("svg")
      .classed("hac-svg", true);

    this.root = this.svg.append("g").classed("hac-root", true);
    this.chart = this.root.append("g").classed("hac-chart", true);

    // axes groups
    this.root.append("g").classed("y-axis", true);
    this.root.append("g").classed("x-axis", true);
  }

  public update(options: VisualUpdateOptions): void {
    const width = options.viewport.width;
    const height = options.viewport.height;

    this.svg.attr("width", width).attr("height", height);

    const margin = { top: 16, right: 12, bottom: 28, left: 36 };
    const innerW = Math.max(0, width - margin.left - margin.right);
    const innerH = Math.max(0, height - margin.top - margin.bottom);

    this.root.attr("transform", `translate(${margin.left},${margin.top})`);

    const dv: DataView | undefined = options.dataViews && options.dataViews[0];
    if (!dv || !dv.categorical) {
      this.chart.selectAll("*").remove();
      this.root.select('.x-axis').selectAll('*').remove();
      this.root.select('.y-axis').selectAll('*').remove();
      return;
    }

    const categorical = dv.categorical;
    const categoryCol: DataViewCategoryColumn | undefined = categorical.categories && categorical.categories[0];
    const categories: Primitive[] = categoryCol ? (categoryCol.values as any) : [];

    // Build series list & flattened datapoints
    const seriesNames: string[] = [];
    const dataPoints: SeriesDataPoint[] = [];

    if (categorical.values && (categorical.values as any).grouped) {
      // Handle grouped values (multi-series)
      const groups = (categorical.values as any).grouped();
      groups.forEach((g: any) => {
        const sName: string = g.name == null ? (g.values[0]?.source?.displayName || "Value") : String(g.name);
        if (!seriesNames.includes(sName)) seriesNames.push(sName);
        g.values.forEach((v: any, i: number) => {
          const valArr = v.values || [];
          for (let ci = 0; ci < categories.length; ci++) {
            const val = Number(valArr[ci] ?? 0);
            dataPoints.push({ category: categories[ci], series: sName, value: isFinite(val) ? val : 0 });
          }
        });
      });
    } else if (categorical.values && categorical.values.length > 0) {
      // Each measure is its own series
      categorical.values.forEach((v: any) => {
        const sName: string = v.source?.displayName || "Value";
        if (!seriesNames.includes(sName)) seriesNames.push(sName);
        const valArr = v.values || [];
        for (let ci = 0; ci < categories.length; ci++) {
          const val = Number(valArr[ci] ?? 0);
          dataPoints.push({ category: categories[ci], series: sName, value: isFinite(val) ? val : 0 });
        }
      });
    } else {
      // No values
      this.chart.selectAll("*").remove();
      this.root.select('.x-axis').selectAll('*').remove();
      this.root.select('.y-axis').selectAll('*').remove();
      return;
    }

    // Scales
    const maxY = Math.max(0, max(dataPoints, d => d.value) || 0);
    this.x0 = scaleBand<Primitive>().domain(categories as any).range([0, innerW]).paddingInner(0.2).paddingOuter(0.05);
    this.x1 = scaleBand<string>().domain(seriesNames).range([0, this.x0.bandwidth()]).padding(0.1);
    this.y = scaleLinear().domain([0, maxY * 1.05 || 1]).nice().range([innerH, 0]);

    // Axes
    const xAxis = axisBottom(this.x0 as any).tickSizeOuter(0);
    const yAxis = axisLeft(this.y).ticks(4).tickSizeOuter(0);

    this.root.select('.x-axis').attr('transform', `translate(0,${innerH})`).call(xAxis as any);
    this.root.select('.y-axis').call(yAxis as any);

    // JOIN – one group per category
    const catGroups = this.chart
      .selectAll<SVGGElement, Primitive>("g.cat")
      .data(categories as any, (d: any) => String(d));

    const catEnter = catGroups.enter().append("g").attr("class", "cat");
    const catAll = catEnter.merge(catGroups as any)
      .attr("transform", (d: any) => `translate(${this.x0(d)},0)`);

    catGroups.exit().remove();

    // For each category, JOIN series rects
    const self = this;
    const bars = catAll.selectAll<SVGGElement, SeriesDataPoint>("g.bar")
      .data((cat: Primitive) => dataPoints.filter(p => p.category === cat));

    const barsEnter = bars.enter()
      .append("g").attr("class", "bar")
      .style("transform-box", "fill-box")
      .style("transform-origin", "center bottom")
      .style("transition", `transform ${this.settings.durationMs}ms ease, opacity ${this.settings.durationMs}ms ease`);

    barsEnter.append("rect");
    barsEnter.append("text");

    const barsAll = barsEnter.merge(bars as any)
      .attr("data-series", (d: any) => d.series);

    bars.exit().remove();

    barsAll.select('rect')
      .attr("x", (d: any) => this.x1(d.series) || 0)
      .attr("width", this.x1.bandwidth())
      .attr("y", (d: any) => this.y(Math.max(0, d.value)))
      .attr("height", (d: any) => Math.max(0, innerH - this.y(Math.max(0, d.value))))
      .attr("fill", (d: any) => this.colorPalette.getColor(d.series).value)
      .style("shape-rendering", "crispEdges");

    // Data labels
    barsAll.select('text')
      .style("pointer-events", "none")
      .attr("x", (d: any) => (this.x1(d.series) || 0) + this.x1.bandwidth()/2)
      .attr("y", (d: any) => this.y(Math.max(0, d.value)) - 4)
      .attr("text-anchor", "middle")
      .style("font-size", `${this.settings.dataLabel.fontSize}px`)
      .style("fill", this.settings.dataLabel.color)
      .text((d: any) => {
        if (!this.settings.dataLabel.show) return "";
        const v = d.value;
        return typeof v === 'number' ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v) : String(v);
      });

    // Hover interactions with neighbor emphasis
    barsAll.on("mouseenter", function(event: any, hovered: SeriesDataPoint) {
      const barGroups = self.chart.selectAll<SVGGElement, SeriesDataPoint>('g.bar');
      barGroups.each(function(d: SeriesDataPoint, i: number, nodes: any[]) {
        const g = select(nodes[i]);
        // Find if same category and neighbor series index
        const seriesIdx = seriesNames.indexOf(d.series);
        const hoveredIdx = seriesNames.indexOf(hovered.series);
        const sameCat = d.category === hovered.category;
        let scale = 1.0;
        if (sameCat && seriesIdx === hoveredIdx) {
          scale = self.settings.hoverScale;
        } else if (sameCat && Math.abs(seriesIdx - hoveredIdx) === 1) {
          scale = self.settings.neighborScale;
        } else {
          scale = 1.0;
        }
        g.style('transform', `scale(${scale}, ${scale})`)
         .style('opacity', sameCat ? 1 : 0.85);
      });
    })
    .on("mouseleave", function() {
      const barGroups = self.chart.selectAll('g.bar');
      barGroups.style('transform', 'scale(1,1)').style('opacity', 1);
    });
  }
}
