import { LayerParameters } from './LayerParameters';
import { ChartOptions } from './ChartOptions';
import { Mappings } from './Mapping';

import { Layer } from './layers/Layer';
import { ColumnLayer } from './layers/Columns';
import { LineLayer } from './layers/Lines';
import { PointLayer, PointParameters } from './layers/Points';
import { TextLayer } from './layers/TextLayer';

import { Theme } from './Theme';
import { Data } from './Data';

import { getBox } from './getBox';


/**
 * Generate SVG translation string.
 * @param x
 * @param y
 * @returns {string}
 */
function translate(x: number, y: number): string {
  return `translate(${x}, ${y})`;
}

function setTransform(element: d3.Selection<any>, x: number, y: number): void {
  element.attr('transform', translate(x, y));
}


interface ChartTitles {
  x?: string;
  y?: string;
  main?: string;
}

interface ChartTicks {
  x: number;
  y: number;
}

interface ChartTicksFormat {
  x?: (x: number) => string;
  y?: (y: number) => string;
}

interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
}

export class Chart {

  public data: Data;
  public mappings: Mappings;
  public scales: {x: any, y: any};
  public plotArea: d3.Selection<SVGElement>;
  public plotAreaHeight: number;
  public plotAreaWidth: number;
  public theme: Theme;
  public animation: AnimationOptions;
  public layers: Array<Layer>;

  private _ticksFormat: ChartTicksFormat;
  private _ticks: ChartTicks;
  private chartOptions: ChartOptions;
  private _titles: ChartTitles;

  private svg: d3.Selection<SVGElement>;
  private container: d3.Selection<any>;
  private titleElement: d3.Selection<SVGElement>;
  private xTitleElement: d3.Selection<SVGElement>;
  private yTitleElement: d3.Selection<SVGElement>;

  private height: number;
  private width: number;

  private plotUpperOffset: number;
  private plotLeftOffset: number;

  private xAxis: d3.svg.Axis;
  private yAxis: d3.svg.Axis;


  constructor(data: any, mappings: Mappings, chartOptions?: ChartOptions) {

    const defaultChartOptions = {
      titlePadding: 8,
      axisTitlePadding: 8,
      axisPadding: 12
    };

    this.animation = {
      duration: 1500,
      easing: 'elastic',
      delay: 0
    };

    this.theme = new Theme(['#2980b9', '#27ae60', '#e74c3c', '#9b59b6', '#1cccaa', '#f39c12'], ['#f1c40f', '#f39c12']);

    // Default axis text formatting.
    this._ticksFormat = {x: (x: number) => x.toString(), y: (y: number) => y.toString()};

    // Number of ticks on each axis.
    this._ticks = {x: 5, y: 5};

    // Overwrite default chart options with user options.
    this.chartOptions = _.assign(defaultChartOptions, chartOptions);

    // Chart main and axes titles.
    this._titles = {
      x: _.capitalize(mappings.x.name),
      y: _.capitalize(mappings.y.name)
    };

   /* // Check that the mapping fields are contained within 'data'.
    let mappingValid = _(mappings)
    	.map('name')
    	.every((field: string) => _.has(data.fields, field));

    if (!mappingValid) {
    	throw new Error('Fields given in "mapping" are not present in every "data" element.');
    }*/

    this.data = new Data(data);
    this.mappings = mappings;

    // Array to hold all layers in the plot.
    this.layers = [];
    this.scales = {x: null, y: null};
    return this;

  }


  public static replaceDefaults(defaults: any, replacements: any) {
    if (_.isPlainObject(defaults) && _.isPlainObject(replacements)) {
      _.assign(defaults, replacements);
    }
  }


  /**
   * Does the chart have animation enabled? This will affect how layers are rendered.
   * @returns {boolean}
   */
  public isAnimated(): boolean {
    return !_.isNull(this.animation);
  }

  public draw(selector: any): Chart {

    // Make sure there are layers to plot.
    if (!this.layers.length) {
      throw new Error('No layers in plot.');
    }

    // Use d3.select() on selector string.
    this.container = d3.select(selector);
    if (this.container.empty()) {
      throw new Error('No elements found with the given selector.');
    }

    if (_.size(this.container[0]) > 1) {
      throw new Error('Selector has selected more than one element.');
    }

    // Add SVG for plot.
    this.svg = this.container.append('svg').attr('class', 'plot');
    if (this.svg.empty()) {
      throw new Error('Could not append an SVG to the selected element.');
    }

    // Get container dimensions.
    const containerElement = <HTMLElement> this.container.node();
    const containerBox = containerElement.getBoundingClientRect();
    this.height = containerBox.height;
    this.width = containerBox.width;
    this.plotAreaHeight = containerBox.height;
    this.plotAreaWidth = containerBox.width;
    this.plotUpperOffset = 0;
    this.plotLeftOffset = 0;

    this.drawTitle();
    this.drawAxesTitles();
    this.drawAxes();
    this.drawPlotArea();
    this.positionTitles();
    this.drawLayers();

    return this;

  }

  public removeData(): void {
    _.forEach(this.layers, (layer: Layer) => layer.remove());
  }

  public animate(options: AnimationOptions): Chart {
    if (_.isNull(options)) {
      this.animation = null;
    } else {
      this.animation = _.assign(this.animation, options);
    }
    return this;
  }


  /**
   * Scatter plot.
   * @param   {PointParameters} parameters
   * @returns {Chart}
   */
  public points(parameters?: PointParameters): Chart {
    this.layers.push(new PointLayer(this, parameters));
    return this;
  }


  /**
   * Text.
   */
  public text(parameters?: LayerParameters): Chart {
    this.layers.push(new TextLayer(this, parameters));
    return this;
  }


  /**
   * Lines chart.
   */
  public lines(parameters?: LayerParameters): Chart {
    this.layers.push(new LineLayer(this, parameters));
    return this;
  }


  /**
   * Vertical bars chart.
   * @param parameters
   * @returns {Chart}
   */
  public columns(parameters?: LayerParameters): Chart {
    this.layers.push(new ColumnLayer(this, parameters));
    return this;
  }


  /**
   * Set main plot title.
   */
  public title(titleText: string): Chart {
    this._titles.main = titleText;
    return this;
  }


  /**
   * Set the main, axes and other titles.
   * @param _titles
   * @returns {Chart}
   */
  public titles(_titles: ChartTitles): Chart {
    Chart.replaceDefaults(this._titles, _titles);
    return this;
  }

  public ticks(numberOfTicks: ChartTicks): Chart {
    Chart.replaceDefaults(this._ticks, numberOfTicks);
    return this;
  }

  public ticksFormat(formats: ChartTicksFormat): Chart {
    Chart.replaceDefaults(this._ticksFormat, formats);
    return this;
  }

  private drawTitle(): void {

    if (this._titles.main) {

      const padding = this.chartOptions.titlePadding * 2;

      this.titleElement = this.svg
        .append('text')
        .attr({
          'class': 'title',
          'alignment-baseline': 'central'
        })
        .text(this._titles.main);

      const titleBox = getBox(this.titleElement);
      this.plotAreaHeight -= (titleBox.height + padding);
      this.plotUpperOffset = (titleBox.height + padding);

    }

  }

  private drawAxesTitles(): void {

    // The total axis title padding is doubled since it will surround the text.
    const padding = this.chartOptions.axisTitlePadding * 2;

    this.xTitleElement = this.svg
      .append('text')
      .attr({
        'class': 'axis-title',
        'alignment-baseline': 'central'
      })
      .text(this._titles.x);

    // Vertically shrink available plot area.
    const xTitleBox = getBox(this.xTitleElement);
    this.plotAreaHeight -= (xTitleBox.height + padding);

    this.yTitleElement = this.svg
      .append('text')
      .attr({
        'class': 'axis-title',
        'transform': 'rotate(270)',
        'alignment-baseline': 'central'
      })
      .text(this._titles.y);

    const yTitleBox = getBox(this.yTitleElement);

    // After rotation, the height is the width.
    this.plotAreaWidth -= (yTitleBox.height + padding);
    this.plotLeftOffset += (yTitleBox.height + padding);

  }

  /**
   * Position main and axes titles.
   */
  private positionTitles(): void {

    // Position to horizontal centre in the middle of the plot area.
    const centred = this.plotLeftOffset + (this.plotAreaWidth / 2);

    const titleBox = getBox(this.titleElement);
    setTransform(this.titleElement, centred, this.chartOptions.titlePadding + (titleBox.height / 2));

    const xTitleBox = getBox(this.xTitleElement);
    setTransform(this.xTitleElement, centred, this.height - (xTitleBox.height / 2) - this.chartOptions.axisTitlePadding);

    const yTitleBox = getBox(this.yTitleElement);
    this.yTitleElement.attr('transform', translate(this.chartOptions.axisTitlePadding + (yTitleBox.height / 2), this.height / 2) + ' rotate(270)');

  }

  private drawPlotArea(): void {

    // The plot area
    this.plotArea = this.svg
      .append('g')
      .attr({
        'transform': translate(this.plotLeftOffset, this.plotUpperOffset),
        'class': 'plot-area'
      });

  }


  /**
   * Render all chart layers.
   * @private
   */
  private drawLayers(): void {

    _.forEach(this.layers, function (layer: Layer) {
      layer.draw();
    });

  }

  private drawAxes(): void {

    this.scales.y = d3
      .scale
      .linear()
      .domain(d3.extent(this.data.rows, (datum: {[index: string]: any}) => datum[this.mappings.y.name]))
      .range([this.plotAreaHeight, 0]);

    this.yAxis = d3.svg.axis()
      .scale(this.scales.y)
      .orient('left')
      .ticks(this._ticks.y)
      .tickFormat(this._ticksFormat.y);

    const yAxisElement = this.svg
      .append('g')
      .attr('class', 'y axis')
      .call(this.yAxis);

    // Remove y-axis from available plot width.
    this.plotAreaWidth -= getBox(yAxisElement).width;

    if (_.some(_.map(this.layers, 'ordinalXScale'))) {

      const domain = _(this.data.rows)
        .map((row: any) => {
          return row[this.mappings.x.name].toString();
        })
        .uniq()
        .value();

      this.scales.x = d3
        .scale
        .ordinal()
        .domain(domain)
        .rangeRoundBands([0, this.plotAreaWidth], 0.1);

    } else {

      this.scales.x = d3
        .scale
        .linear()
        .domain(d3.extent(this.data.rows, (datum: {[index: string]: any}) => datum[this.mappings.x.name]))
        .range([0, this.plotAreaWidth]);

    }

    this.xAxis = d3.svg.axis()
      .scale(this.scales.x)
      .orient('bottom')
      .ticks(this._ticks.x)
      .tickFormat(this._ticksFormat.x);

    // Add x-axis to chart.
    const xAxisElement = this.svg
      .append('g')
      .attr('class', 'x axis')
      .call(this.xAxis);

    // Subtract x-axis height and overflow width from allowable area.
    const xAxisBox = getBox(xAxisElement);
    this.plotAreaHeight -= xAxisBox.height;
    this.plotAreaWidth -= this.chartOptions.axisTitlePadding + ((xAxisBox.width - this.plotAreaWidth) / 2);

    // Move the y-axis now that the height of the x-axis is known.
    this.scales.y.range([this.plotAreaHeight, 0]);
    this.yAxis.scale(this.scales.y);
    this.plotLeftOffset += getBox(yAxisElement).width;

    // Move x-axis after figuring out how much its labels overflow the canvas.
    this.scales.x.range([0, this.plotAreaWidth], 0.1);
    this.xAxis.scale(this.scales.x);

    this.drawGridLines();

    yAxisElement.call(this.yAxis);
    yAxisElement.attr('transform', translate(this.plotLeftOffset, this.plotUpperOffset));

    xAxisElement.call(this.xAxis);
    xAxisElement.attr('transform', translate(this.plotLeftOffset, this.plotAreaHeight + this.plotUpperOffset));

  }


  private drawGridLines(): void {

    const xAxisGrid = d3.svg.axis()
      .ticks(this.xAxis.ticks())
      .scale(this.xAxis.scale())
      .tickSize(this.plotAreaHeight, 0)
      .tickFormat('')
      .orient('top');

    this.svg.append('g')
      .classed('x', true)
      .classed('grid', true)
      .attr('transform', translate(this.plotLeftOffset, this.plotAreaHeight + this.plotUpperOffset))
      .call(xAxisGrid);

    const yAxisGrid = d3.svg.axis()
      .scale(this.yAxis.scale())
      .ticks(this.yAxis.ticks())
      .tickSize(this.plotAreaWidth, 0)
      .tickFormat('')
      .orient('right');

    this.svg.append('g')
      .classed('y', true)
      .classed('grid', true)
      .attr('transform', translate(this.plotLeftOffset, this.plotUpperOffset))
      .call(yAxisGrid);

  }


}
