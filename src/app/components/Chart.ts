import { LayerParameters } from './LayerParameters';
import { ChartOptions } from './ChartOptions';
import { Mapping, Mappings } from './Mapping';

import { Layer } from './layers/Layer';
import { ColumnLayer } from './layers/Columns';
import { LineLayer } from './layers/Lines';
import { PointLayer } from './layers/Points';
import { TextLayer } from './layers/TextLayer';

import { Theme } from './Theme';
import { Data } from './Data';
import { LiveChart } from './LiveChart';

import { getBox } from './getBox';


/**
 * Generate SVG translation string.
 * @param x
 * @param y
 * @returns {string}
 */
function translate(x:number, y:number):string {
  return `translate(${x}, ${y})`;
}

function setTransform(element: d3.Selection<any>, x:number, y:number):void {
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


export class Chart {

  public _data: Data;
  public _mappings: Mappings;
  public _scales: any;
  public _plotArea: any;
  public _plotAreaHeight: number;
  public _plotAreaWidth: number;
  public _theme: Theme;

  private _ticksFormat: any;
  private _ticks: ChartTicks;
  private _chartOptions: any;
  private _titles: ChartTitles;

  private _layers: Array<Layer>;
  private _svg: any;
  private _container: any;
  private _titleElement: any;
  private _xTitleElement: any;
  private _yTitleElement: any;


  private _height: number;
  private _width: number;

  private _plotUpperOffset: number;
  private _plotLeftOffset: number;



  constructor(data: any, mappings: Mappings, chartOptions: ChartOptions) {

    let defaultChartOptions = {
      titlePadding: 8,
      axisTitlePadding: 8
    };

    this._theme = new Theme(['#2980b9', '#27ae60', '#e74c3c', '#9b59b6', '#1cccaa', '#f39c12'], ['#f1c40f', '#f39c12']);

    // Default axis text formatting.
    this._ticksFormat = {x: _.constant, y: _.constant};

    // Number of ticks on each axis.
    this._ticks = {x: 5, y: 5};

    // Overwrite default chart options with user options.
    this._chartOptions = _.assign(defaultChartOptions, chartOptions);

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

    this._data = new Data(data);
    this._mappings = mappings;

    // Array to hold all layers in the plot.
    this._layers = [];
    this._scales = {};
    return this;

  }

  /**
   * Add custom layer.
   */
  layer() {
    return this;
  }


  /**
   * Scatter plot.
   */
  points(parameters?: LayerParameters) {
    this._layers.push(new PointLayer(this, parameters));
    return this;
  }


  /**
   * Text.
   */
  text(parameters?: LayerParameters) {
    this._layers.push(new TextLayer(this, parameters));
    return this;
  }


  /**
   * Lines chart.
   */
  lines(parameters?: LayerParameters) {
    this._layers.push(new LineLayer(this, parameters));
    return this;
  }


  /**
   * Vertical bars chart.
   * @param parameters
   * @returns {Chart}
   */
  columns(parameters?: LayerParameters) {
    this._layers.push(new ColumnLayer(this, parameters));
    return this;
  }


  /**
   * Set main plot title.
   */
  title(titleText: string) {
    this._titles.main = titleText;
    return this;
  }

  titles(_titles: ChartTitles) {
    Chart._replaceDefaults(this._titles, _titles);
    return this;
  }

  ticks(numberOfTicks: ChartTicks) {
    Chart._replaceDefaults(this._ticks, numberOfTicks);
    return this;
  }

  ticksFormat(formats) {
    Chart._replaceDefaults(this._ticksFormat, formats);
    return this;
  }

  static _replaceDefaults(defaults, replacements) {
    if (_.isPlainObject(defaults) && _.isPlainObject(replacements)) {
      _.assign(defaults, replacements);
    }
  }

  _drawTitle() {

    if (this._titles.main) {

      let padding = this._chartOptions.titlePadding * 2;

      this._titleElement = this._svg
        .append('text')
        .attr({
          'class': 'title',
          'alignment-baseline': 'central'
        })
        .text(this._titles.main);

      let titleBox = getBox(this._titleElement);
      this._plotAreaHeight -= (titleBox.height + padding);
      this._plotUpperOffset = (titleBox.height + padding);

    }

  }

  _drawAxesTitles() {

    // The total axis title padding is doubled since it will surround the text.
    let padding = this._chartOptions.axisTitlePadding * 2;

    this._xTitleElement = this._svg
      .append('text')
      .attr({
        'class': 'axis-title',
        'alignment-baseline': 'central'
      })
      .text(this._titles.x);

    // Vertically shrink available plot area.
    let xTitleBox = getBox(this._xTitleElement);
    this._plotAreaHeight -= (xTitleBox.height + padding);

    this._yTitleElement = this._svg
      .append('text')
      .attr({
        'class': 'axis-title',
        'transform': 'rotate(270)',
        'alignment-baseline': 'central'
      })
      .text(this._titles.y);

    let yTitleBox = getBox(this._yTitleElement);

    // After rotation, the height is the width.
    this._plotAreaWidth -= (yTitleBox.height + padding);
    this._plotLeftOffset += (yTitleBox.height + padding);

  }

  /**
   * Position main and axes titles.
   */
  _positionTitles() {

    // Position to horizontal centre in the middle of the plot area.
    let centred = this._plotLeftOffset + (this._plotAreaWidth / 2);

    let titleBox = getBox(this._titleElement);
    setTransform(this._titleElement, centred, this._chartOptions.titlePadding + (titleBox.height / 2));

    let xTitleBox = getBox(this._xTitleElement);
    setTransform(this._xTitleElement, centred, this._height - (xTitleBox.height / 2) - this._chartOptions.axisTitlePadding);

    let yTitleBox = getBox(this._yTitleElement);
    this._yTitleElement.attr('transform', translate(this._chartOptions.axisTitlePadding + (yTitleBox.height / 2), this._height / 2) + ' rotate(270)');

  }

  _drawPlotArea() {

    // The plot area
    this._plotArea = this._svg
      .append('g')
      .attr({
        'transform': translate(this._plotLeftOffset, this._plotUpperOffset),
        'class': 'plot-area'
      });

  }


  /**
   * Render all chart layers.
   * @private
   */
  _drawLayers():void {

    _.forEach(this._layers, function (layer:Layer) {
      layer.draw();
    });

  }

  _drawAxes() {

    this._scales.y = d3
      .scale
      .linear()
      .domain(d3.extent(this._data.rows, datum => datum[this._mappings.y.name]))
      .range([this._plotAreaHeight, 0]);

    let yAxis = d3.svg.axis()
      .scale(this._scales.y)
      .orient('left')
      .ticks(this._ticks.y)
      .tickFormat(this._ticksFormat.y);

    let yAxisElement = this._svg
      .append('g')
      .attr('class', 'y axis')
      .call(yAxis);

    // Remove y-axis from available plot width.
    this._plotAreaWidth -= getBox(yAxisElement).width;

    // Create x scale.
    this._scales.x = d3
      .scale
      .linear()
      .domain(d3.extent(this._data.rows, datum => datum[this._mappings.x.name]))
      .range([0, this._plotAreaWidth]);

    let xAxis = d3.svg.axis()
      .scale(this._scales.x)
      .orient('bottom')
      .ticks(this._ticks.x)
      .tickFormat(this._ticksFormat.x);

    // Add x-axis to chart.
    let xAxisElement = this._svg
      .append('g')
      .attr('class', 'x axis')
      .call(xAxis);

    // Subtract x-axis height and overflow width from allowable area.
    let xAxisBox = getBox(xAxisElement);
    this._plotAreaHeight -= xAxisBox.height;
    this._plotAreaWidth -= this._chartOptions.axisTitlePadding + ((xAxisBox.width - this._plotAreaWidth) / 2);

    // Move the y-axis now that the height of the x-axis is known.
    this._scales.y.range([this._plotAreaHeight, 0]);
    yAxis.scale(this._scales.y);
    yAxisElement.call(yAxis);
    this._plotLeftOffset += getBox(yAxisElement).width;
    yAxisElement.attr('transform', translate(this._plotLeftOffset, this._plotUpperOffset));

    // Move x-axis after figuring out how much its labels overflow the canvas.
    this._scales.x.range([0, this._plotAreaWidth]);
    xAxis.scale(this._scales.x);
    xAxisElement.call(xAxis);
    xAxisElement.attr('transform', translate(this._plotLeftOffset, this._plotAreaHeight + this._plotUpperOffset));

  }

  draw(selector: string):LiveChart {

    // Use d3.select() on selector string.
    if (_.isString(selector)) {
      this._container = d3.select(selector);
    }

    // Ensure selector was valid.
    if (_.isUndefined(this._container)) {
      throw new Error('Selector returned undefined.');
    }

    // Add SVG for plot.
    this._svg = this._container.append('svg').attr('class', 'plot');

    // Make sure there are layers to plot.
    if (!this._layers.length) {
      throw new Error('No layers in plot.');
    }

    // Get container dimensions.
    var containerBox = this._container[0][0].getBoundingClientRect();
    this._height = containerBox.height;
    this._width = containerBox.width;
    this._plotAreaHeight = containerBox.height;
    this._plotAreaWidth = containerBox.width;
    this._plotUpperOffset = 0;
    this._plotLeftOffset = 0;

    this._drawTitle();
    this._drawAxesTitles();
    this._drawAxes();
    this._drawPlotArea();
    this._positionTitles();
    this._drawLayers();

    return new LiveChart(this);

  }

}
