import { LayerParameters } from './LayerParameters';
import { ChartOptions } from './ChartOptions';
import { Mapping, Mappings } from './Mapping';

import { Layer } from './layers/Layer';
import { ColumnLayer } from './layers/Columns';
import { LineLayer } from './layers/Lines';
import { PointLayer, PointParameters } from './layers/Points';
import { TextLayer } from './layers/TextLayer';

import { Theme } from './Theme';
import { Data } from './Data';

import { getBox } from './utilities/getBox';
import { translate } from './utilities/translate';


import { Extra, ExtraOffset, ExtraPosition, getExtraPositionName } from './extras/Extra';
import { TextExtra } from './extras/TextExtra';
import { Axis } from './extras/Axis';

function setTransform(element: d3.Selection<SVGElement>, x: number, y: number): void {
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

// Options the user can set for an axis.
interface AxisOptions {
    ticks?: number;
    format?: (x: number) => string;
    title?: string;
    subtitle?: string;
    otherSide?: boolean;
}

interface AxisDefinition extends AxisOptions {
    mapping?: Mapping;
    // scale?: d3.scale.Linear<any, any>|d3.scale.Ordinal<any, any>;
    scale?: any;
}


export class Chart {

    private static DEFAULT_TICKS = 5;
    private static DEFAULT_TICK_FORMAT: ((x: number) => string) = (x: number) => x.toString();

    public data: Data;
    public mappings: Mappings;

    public axes: {x: AxisDefinition, y: AxisDefinition};
    public plotArea: d3.Selection<SVGElement>;
    public plotAreaHeight: number;
    public plotAreaWidth: number;
    public theme: Theme;
    public animation: AnimationOptions;
    public layers: Array<Layer>;

    private chartOptions: ChartOptions;

    private svg: d3.Selection<SVGElement>;
    private container: d3.Selection<any>;
    private titleElement: d3.Selection<SVGElement>;
    private xTitleElement: d3.Selection<SVGElement>;
    private yTitleElement: d3.Selection<SVGElement>;

    private height: number;
    private width: number;

    private plotUpperOffset: number;
    private plotLeftOffset: number;

    private extras: {
        top: Extra[];
        bottom: Extra[];
        left: Extra[];
        right: Extra[];
    };


  constructor(data: any, chartOptions?: ChartOptions) {

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

    // Axes defaults until the user changes them.
    this.axes = {
        x: {
            ticks: Chart.DEFAULT_TICKS,
            format: Chart.DEFAULT_TICK_FORMAT
        },
        y: {
            ticks: Chart.DEFAULT_TICKS,
            format: Chart.DEFAULT_TICK_FORMAT
        }
    };

    // Overwrite default chart options with user options.
    this.chartOptions = _.assign(defaultChartOptions, chartOptions);

    this.extras = {
      top: [],
      right: [],
      bottom: [],
      left: []
    };

    this.mappings = {};

    this.data = new Data(data);

    // Array to hold all layers in the plot.
    this.layers = [];

    return this;

  }


  public static replaceDefaults(defaults: any, replacements: any) {
    if (_.isPlainObject(defaults) && _.isPlainObject(replacements)) {
      _.assign(defaults, replacements);
    }
  }


  public x(x: Mapping, options?: AxisOptions): Chart {
    this.updateAxis('x', x, options);
    return this;
  }

  public y(y: Mapping, options?: AxisOptions): Chart {
    this.updateAxis('y', y, options);
    return this;
  }

  private updateAxis(name: string, mapping: Mapping, options?: AxisOptions): void {

    const axis: AxisDefinition = this.axes[name];
    Chart.replaceDefaults(axis, options);
    axis.mapping = mapping;
    this.mappings[name] = mapping;

    // Set default title if none has been provided.
    const title = _.has(options, 'title') ? options.title : _.capitalize(mapping.name);

    // Work out what side to render the axis and axis title(s).
    let position: ExtraPosition;
    if (name === 'x') {
        position = options.otherSide ? ExtraPosition.Top : ExtraPosition.Bottom;
    } else {
        position = options.otherSide ? ExtraPosition.Right : ExtraPosition.Left;
    }

    const extras = [];
    extras.push(new TextExtra(position, ['title', 'axis-title'], title));

    // Render an axis subtitle if given.
    if (_.has(options, 'subtitle')) {
        extras.push(new TextExtra(position, ['subtitle', 'axis-title'], options.subtitle));
    }

    if (name === 'x') {

        const domain = _(this.data.rows)
            .map((row: any) => row[mapping.name].toString())
            .uniq()
            .value();

        axis.scale = d3
            .scale
            .ordinal()
            .domain(domain)
            .rangeRoundBands([0, 1], 0.1);

        const xAxis = new Axis(position, ['axis', 'x'], axis.scale, axis.ticks, axis.format);
        
        // Display the axis before or after the axis title depending on which side the axis is going
        // to be displayed.
        if (options.otherSide) {
            extras.push(xAxis);
        } else {
            extras.unshift(xAxis);
        }

    } else {

        axis.scale = d3
            .scale
            .linear()
            .domain(d3.extent(this.data.rows, (datum: {[index: string]: any}) => datum[mapping.name]))
            .range([1, 0]);

        const yAxis = new Axis(position, ['axis', 'y'], axis.scale, axis.ticks, axis.format);
        
        // Display the axis before or after the axis title depending on which side the axis is going
        // to be displayed.
        if (!options.otherSide) {
            extras.push(yAxis);
        } else {
            extras.unshift(yAxis);
        }

    }

    // Append titles and subtitles to the set of extras that will be rendered.
    const positionName = getExtraPositionName(position);
    this.extras[positionName] = this.extras[positionName].concat(extras);

  }


  /**
   * Does the chart have animation enabled? This will affect how layers are rendered.
   * @returns {boolean}
   */
  public isAnimated(): boolean {
    return !_.isNull(this.animation);
  }



  /**
   * Render the chart at the given selector.
   * @param  {string} selector
   * @returns Chart
   */
  public draw(selector: string): Chart {

    if (_.isUndefined(this.mappings.x)) {
        throw new Error('"x" is not defined.')
    }

    if (_.isUndefined(this.mappings.y)) {
        throw new Error('"y" is not defined.')
    }

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

    // this.drawTitle();
    // this.drawAxesTitles();
    // this.drawAxes();
    // this.drawPlotArea();
    // this.positionTitles();

    this.drawExtras();
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

    const extra = new TextExtra(ExtraPosition.Top, ['title', 'main-title'], titleText);

    // The title should always appear on top.
    this.extras.top.unshift(extra);
    return this;

  }

  /**
   * Set main plot subtitle.
   */
  public subtitle(titleText: string): Chart {
    const extra = new TextExtra(ExtraPosition.Top, ['subtitle', 'main-title'], titleText);
    
    // Make sure the subtitle appears just after the main title. Otherwise it might appear after an
    // upper axis or something.
    if (_.isEmpty(this.extras.top)) {
        
        // No extras have been added yet so just throw the subtitle in there on its own.
        this.extras.top.push(extra);    
        
    } else {
        
        // There are other extras, see if one if a main title.
        const titleIndex = _.findIndex(this.extras.top, (extra: Extra) => {
           return extra instanceof Extra && _.includes(extra.className, 'main-title');
        });
        
        if (titleIndex !== -1) {
            
            // Throw the subtitle under the main title.
            this.extras.top.splice(titleIndex + 1, 0, extra);
                
        } else {
            
            // Shove the subtitle on top of the other extras because they aren't main titles.
            this.extras.top.unshift(extra);
            
        }
        
    }
    
    return this;
    
  }


  /**
   * Set the main, axes and other titles.
   * @param _titles
   * @returns {Chart}
   */
//   public titles(_titles: ChartTitles): Chart {
//     Chart.replaceDefaults(this._titles, _titles);
//     return this;
//   }

//   public ticks(numberOfTicks: ChartTicks): Chart {
//     Chart.replaceDefaults(this._ticks, numberOfTicks);
//     return this;
//   }

//   public ticksFormat(formats: ChartTicksFormat): Chart {
//     Chart.replaceDefaults(this._ticksFormat, formats);
//     return this;
//   }


  /**
   * Render all chart layers.
   * @private
   */
  private drawLayers(): void {

    _.forEach(this.layers, function (layer: Layer) {
      layer.draw();
    });

  }

//   private drawAxes(): void {

//     this.scales.y = d3
//       .scale
//       .linear()
//       .domain(d3.extent(this.data.rows, (datum: {[index: string]: any}) => datum[this.mappings.y.name]))
//       .range([this.plotAreaHeight, 0]);

//     this.yAxis = d3.svg.axis()
//       .scale(this.scales.y)
//       .orient('left')
//       .ticks(this._ticks.y)
//       .tickFormat(this._ticksFormat.y);

//     const yAxisElement = this.svg
//       .append('g')
//       .attr('class', 'y axis')
//       .call(this.yAxis);

//     // Remove y-axis from available plot width.
//     this.plotAreaWidth -= getBox(yAxisElement).width;

//     if (_.some(_.map(this.layers, 'ordinalXScale'))) {

//       const domain = _(this.data.rows)
//         .map((row: any) => {
//           return row[this.mappings.x.name].toString();
//         })
//         .uniq()
//         .value();

//       this.scales.x = d3
//         .scale
//         .ordinal()
//         .domain(domain)
//         .rangeRoundBands([0, this.plotAreaWidth], 0.1);

//     } else {

//       this.scales.x = d3
//         .scale
//         .linear()
//         .domain(d3.extent(this.data.rows, (datum: {[index: string]: any}) => datum[this.mappings.x.name]))
//         .range([0, this.plotAreaWidth]);

//     }

//     this.xAxis = d3.svg.axis()
//       .scale(this.scales.x)
//       .orient('bottom')
//       .ticks(this._ticks.x)
//       .tickFormat(this._ticksFormat.x);

//     // Add x-axis to chart.
//     const xAxisElement = this.svg
//       .append('g')
//       .attr('class', 'x axis')
//       .call(this.xAxis);

//     // Subtract x-axis height and overflow width from allowable area.
//     const xAxisBox = getBox(xAxisElement);
//     this.plotAreaHeight -= xAxisBox.height;
//     this.plotAreaWidth -= this.chartOptions.axisTitlePadding + ((xAxisBox.width - this.plotAreaWidth) / 2);

//     // Move the y-axis now that the height of the x-axis is known.
//     this.scales.y.range([this.plotAreaHeight, 0]);
//     this.yAxis.scale(this.scales.y);
//     this.plotLeftOffset += getBox(yAxisElement).width;

//     // Move x-axis after figuring out how much its labels overflow the canvas.
//     this.scales.x.range([0, this.plotAreaWidth], 0.1);
//     this.xAxis.scale(this.scales.x);

//     this.drawGridLines();

//     yAxisElement.call(this.yAxis);
//     yAxisElement.attr('transform', translate(this.plotLeftOffset, this.plotUpperOffset));

//     xAxisElement.call(this.xAxis);
//     xAxisElement.attr('transform', translate(this.plotLeftOffset, this.plotAreaHeight + this.plotUpperOffset));

//   }


//   private drawGridLines(): void {

//     const xAxisGrid = d3.svg.axis()
//       .ticks(this.xAxis.ticks())
//       .scale(this.xAxis.scale())
//       .tickSize(this.plotAreaHeight, 0)
//       .tickFormat('')
//       .orient('top');

//     this.svg.append('g')
//       .classed('x', true)
//       .classed('grid', true)
//       .attr('transform', translate(this.plotLeftOffset, this.plotAreaHeight + this.plotUpperOffset))
//       .call(xAxisGrid);

//     const yAxisGrid = d3.svg.axis()
//       .scale(this.yAxis.scale())
//       .ticks(this.yAxis.ticks())
//       .tickSize(this.plotAreaWidth, 0)
//       .tickFormat('')
//       .orient('right');

//     this.svg.append('g')
//       .classed('y', true)
//       .classed('grid', true)
//       .attr('transform', translate(this.plotLeftOffset, this.plotUpperOffset))
//       .call(yAxisGrid);

//   }

  private getOffset(offsets: number[], size: number): number {
      return size + (_.last(offsets) || 0);
  }

  private drawExtras(): void {

    // Flatten all extras into one array.
    const extras = _([this.extras.top, this.extras.bottom, this.extras.left, this.extras.right]).flatten().value();

    let innerHeight = this.height;
    let innerWidth = this.width;
    let totalLeftOffset = 0;
    let totalTopOffset = 0;
    let offsets = {top: [0], right: [0], bottom: [0], left: [0]};

    console.log(extras);

    _.forEach(extras, (extra: Extra) => {

        extra.draw(this.svg);

        const size = extra.getSize();

        if (extra.atTop() || extra.atBottom()) {
            innerHeight -= size;
        } else {
            innerWidth -= size;
        }

        if (extra.atTop()) {
            totalTopOffset += size;
            offsets.top.push(this.getOffset(offsets.top, size));
        }

        if (extra.atLeft()) {
            totalLeftOffset += size;
            offsets.left.push(this.getOffset(offsets.left, size));
        }

        if (extra.atRight()) {
            offsets.right.push(this.getOffset(offsets.right, size));
        }

        if (extra.atBottom()) {
            offsets.bottom.push(this.getOffset(offsets.bottom, size));
        }

    });

    _.forEach(extras, (extra: Extra) => {

        const offset: ExtraOffset = {
            top: totalTopOffset,
            right: 0,
            left: totalLeftOffset,
            bottom: 0
        };

        if (extra.atTop()) {
            offset.top = offsets.top.shift();
        }

        if (extra.atLeft()) {
            offset.left = offsets.left.shift();
        }

        if (extra.atBottom()) {
            offset.bottom = offsets.bottom.shift();
        }

        if (extra.atRight()) {
            offset.right = offsets.right.shift();
        }

        extra.move(offset, innerWidth, innerHeight);

    });


    this.svg.append('rect')
        .attr({
           'width': innerWidth,
           'height': innerHeight,
           'x': totalLeftOffset,
           'y': totalTopOffset
        })
        .classed('plot-area', true);

    this.plotArea = this.svg
      .append('g')
      .attr({
        'transform': translate(totalLeftOffset, totalTopOffset),
        'class': 'plot-area'
      });

    this.plotAreaWidth = innerWidth;

  }

}
