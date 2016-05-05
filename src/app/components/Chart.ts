import { LayerParameters } from './LayerParameters';
import { ChartOptions, ChartCentre } from './ChartOptions';
import { Mapping, Mappings } from './Mapping';
import { Dictionary } from './definitions/Dictionary';

import { Layer } from './layers/Layer';
import { ColumnLayer } from './layers/Columns';
import { StackedColumnLayer } from './layers/StackedColumns';
import { LineLayer } from './layers/Lines';
import { PointLayer, PointParameters } from './layers/Points';
import { TextLayer } from './layers/TextLayer';
import { BarLayer } from './layers/Bar';

import { Theme } from './Theme';
import { Data } from './Data';

import { getBox } from './utilities/getBox';
import { translate } from './utilities/translate';


import { Extra, ExtraOffset, ExtraPosition, getExtraPositionName, ExtraArrays, ExtraBooleans } from './extras/Extra';
import { TextExtra } from './extras/TextExtra';
import { Axis } from './extras/Axis';
import { FacetLabels } from './extras/FacetLabels';

function setTransform(element: d3.Selection<SVGElement>, x: number, y: number): void {
    element.attr('transform', translate(x, y));
}

 
export type LinearScale = d3.scale.Linear<number, number>|d3.scale.Ordinal<number, number>|d3.scale.Pow<number, number>;
export type OrdinalScale = d3.scale.Ordinal<string, number>;
export type AnyScale = LinearScale|d3.scale.Ordinal<any, number>|d3.time.Scale<number, number>;



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
    format?: (x: number|string|Date) => string;
    title?: string;
    subtitle?: string;
    otherSide?: boolean;
    scale?: AnyScale;
}

interface AxisDefinition extends AxisOptions {
    mapping?: Mapping;
    // scale?: d3.scale.Linear<any, any>|d3.scale.Ordinal<any, any>;
    scale?: any;
    axis?: Axis;
}


export class Chart {

    private static DEFAULT_TICKS = 5;
    private static DEFAULT_TICK_FORMAT: ((x: number) => string) = (x: number) => x.toString();

    public data: Data;
    public mappings: {x?: Mapping|Mapping[], y?: Mapping|Mapping[]};

    public axes: { x: AxisDefinition, y: AxisDefinition };
    public userAxes: { x: AxisDefinition, y: AxisDefinition };

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

    private extras: ExtraArrays;


    constructor(data: any, chartOptions?: ChartOptions) {

        const defaultChartOptions: ChartOptions = {
            titlePadding: 8,
            axisTitlePadding: 8,
            axisPadding: 12,
            centreVertical: null,
            centreHorizontal: null
        };

        this.animation = {
            duration: 1500,
            easing: 'elastic',
            delay: 125
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

        this.userAxes = { x: {}, y: {} };

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



    /**
     * Horizontal axis settings.
     * @param x        The mapping for the axis i.e. what variable it relates to.
     * @param options  Axis settings like the side it's on.
     */
    public x(x: Mapping|Mapping[], options?: AxisOptions): Chart {
        this.userAxes.x = options;
        this.mappings.x = x;
        return this;
    }


    /**
     * Vertical axis settings.
     * @param y        The mapping for the axis i.e. what variable it relates to.
     * @param options  Axis settings like the side it's on.
     */
    public y(y: Mapping|Mapping[], options?: AxisOptions): Chart {
        this.userAxes.y = options;
        this.mappings.y = y;
        return this;
    }
    
    private createFacets() {
        
        const facetTop = new FacetLabels(ExtraPosition.Top, 'facet-labels', ['One', 'Two']);
        const facetRight = new FacetLabels(ExtraPosition.Right, 'facet-labels', ['One', 'Two']);
        this.extras.top.push(facetTop);
        this.extras.right.push(facetRight);
        
    }


    /**
     * Overwrite axis defaults.
     */
    private updateAxis(name: string, mapping: Mapping|Mapping[], options?: AxisOptions): void {

        if (_.isArray(mapping) && mapping.length > 1) {
            this.createFacets();
            mapping = mapping[0];
        }
        
        if (_.isUndefined(options)) {
            options = {};
        }

        const axis: AxisDefinition = this.axes[name];
        Chart.replaceDefaults(axis, options);
        axis.mapping = mapping;
        this.mappings[name] = mapping;

        // Set default axis title if none has been provided.
        const title = _.has(options, 'title') ? options.title : this.formatTitle(mapping.name);

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
            
            const xAxis = this.createAxis(axis, options.scale, mapping, position, name);

            // Display the axis before or after the axis title depending on which side the axis is 
            // going to be displayed.
            if (options.otherSide) {
                extras.push(xAxis);
            } else {
                extras.unshift(xAxis);
            }
            
            axis.axis = xAxis;

        } else {
            
            const yAxis = this.createAxis(axis, options.scale, mapping, position, name);

            // Display the axis before or after the axis title depending on which side the axis is 
            // going to be displayed.
            if (!options.otherSide) {
                extras.push(yAxis);
            } else {
                extras.unshift(yAxis);
            }
            
            axis.axis = yAxis;

        }

        // Append titles and subtitles to the set of extras that will be rendered.
        const positionName = getExtraPositionName(position);
        this.extras[positionName] = this.extras[positionName].concat(extras);

    }
    
    private createAxis(axis: AxisDefinition, scale: AnyScale, mapping: Mapping, position: ExtraPosition, name: string): Axis {
        
        const dataField = this.data.fields[mapping.name];
        const zero = _(this.layers).filter((layer: Layer) => layer.zeroY).some();
        const extent = d3.extent(this.data.rows, (datum: Dictionary<any>) => datum[mapping.name]);
        
        let psuedoOrdinal = false;
        if (name === 'x') {
            psuedoOrdinal = _(this.layers).filter((layer: Layer) => layer.ordinalXScale).some();    
        }
        
        // Force the axis to start at zero if any layer requires that.
        if (extent[0] > 0 && zero) {
            extent[0] = 0;
        }

        if (dataField.isOrdinal()) {
            
            // Find the unique values in the domain.
            const domain = _(this.data.rows)
                .map((row: any) => row[mapping.name].toString())
                .uniq()
                .value();

            axis.scale = d3
                .scale
                .ordinal()
                .domain(domain)
                .rangeRoundBands([0, 1], 0.1);
            
        } else if (dataField.isDate()) {
            
            if (scale) {
                
                axis.scale = (<d3.time.Scale<number, number>>scale)
                    .nice()
                    .domain(extent)
                    .range([1, 0]);
                
            } else {
                
                axis.scale = d3.time
                    .scale()
                    .domain(extent)
                    .range([1, 0]);
                
            }
            
        } else {
            
            if (scale) {
                
                axis.scale = (<LinearScale> scale)
                    .domain(extent)
                    .range([100, 0]);
                
            } else {
                
                axis.scale = d3.scale
                    .linear()
                    .domain(extent)
                    .nice(axis.ticks)
                    .range([0, 100]);
                    
            }
            
        }
        
        return new Axis(position, ['axis', name], axis.scale, axis.ticks, axis.format, psuedoOrdinal);
        
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
    public draw(selector: string): Promise<{}> {

        this.updateAxis('x', this.mappings.x, this.userAxes.x);
        this.updateAxis('y', this.mappings.y, this.userAxes.y);

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
        const containerElement = <HTMLElement>this.container.node();
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
        return this.drawLayers();

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
     * Horizontal bars chart.
     * @param parameters
     * @returns {Chart}
     */
    public bars(parameters?: LayerParameters): Chart {
        this.layers.push(new BarLayer(this, parameters));
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
     * Vertical bars chart.
     * @param parameters
     * @returns {Chart}
     */
    public stackedColumns(parameters?: LayerParameters): Chart {
        this.layers.push(new StackedColumnLayer(this, parameters));
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
                return extra instanceof Extra && _.includes(extra.classList, 'main-title');
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
     * Render all chart layers.
     * @private
     */
    private drawLayers(): Promise<{}> {

        let transitionsCompleted = 0;
        return new Promise((resolve: () => any, reject: () => any) => {
            _.forEach(this.layers, (layer: Layer, index: number) => {
                layer.drawLayer(() => {
                    transitionsCompleted++;
                    if (transitionsCompleted === this.layers.length) {
                        resolve();
                    }
                }, index);
            });
        });

    }

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
        const extras = _.flatten([this.extras.top, this.extras.bottom, this.extras.left, this.extras.right]);

        let innerHeight = this.height;
        let innerWidth = this.width;
        let totalLeftOffset = 0;
        let totalTopOffset = 0;
        let offsets = { top: [0], right: [0], bottom: [0], left: [0] };

        let totalText = { top: 0, right: 0, bottom: 0, left: 0 };
        
        // See if there are extras on each side. This can affect the positioning of some extras. For
        // example, axis labels may flow off the chart. By kindly informing an axis that there are 
        // no more elements beside it to flow into, it can adjust its width back so its labels do 
        // not overflow its own container.
        const otherExtras = _.mapValues(this.extras, function(value: Extra, name: string): boolean {
            return !_.isEmpty(value);
        });

        _.forEach(extras, (extra: Extra, index: number) => {

            const size = extra.draw(this.svg, <any> otherExtras);
            const notAxis = !(extra instanceof Axis);
            
            innerHeight -= size.height;
            innerWidth -= size.width;
            totalTopOffset += size.topOffset;
            totalLeftOffset += size.leftOffset;
            
            if (extra.atTop()) {
                totalTopOffset += size.height;
                offsets.top.push(this.getOffset(offsets.top, size.height));
            }

            if (extra.atLeft()) {
                totalLeftOffset += size.width;
                offsets.left.push(this.getOffset(offsets.left, size.width));
            }

            if (extra.atRight()) {
                offsets.right.push(this.getOffset(offsets.right, size.width));
            }

            if (extra.atBottom()) {
                offsets.bottom.push(this.getOffset(offsets.bottom, size.height));
            }

            if (notAxis) {
                const positionName = getExtraPositionName(extra.position);
                totalText[positionName] += size.width;
            }

        });

        if (this.chartOptions.centreHorizontal === 'full') {
            const rightWidth = this.width - totalLeftOffset - innerWidth;
            if (rightWidth < totalLeftOffset) {
                const difference = totalLeftOffset - rightWidth;
                innerWidth -= difference;
            } else {

            }
        }


        if (this.chartOptions.centreHorizontal === 'partial') {

            // The user wants to partially horizontally centre the chart. This means it will be centred
            // horizontally ignoring axes. Therefore the loop above has been ingenously calculating the 
            // width of each non-axis element. This can now be used to see how much bigger the left or 
            // right is than each other and an adjustment can be made.
            const difference = Math.abs(totalText.left - totalText.right);
            innerWidth -= difference;

            // If the right side is wider, the left extras must be pushed left more to meet the plot 
            // area. When the left side is wider the right side will take of it itself.
            if (totalText.left < totalText.right) {
                totalLeftOffset += difference;
                offsets.left = _.map(offsets.left, (offset: number) => offset + difference);
            }

        }

        if (this.chartOptions.centreVertical === 'full') {

            // Work out how much bigger the top or bottom is.
            const bottomHeight = this.height - totalTopOffset - innerHeight;
            if (bottomHeight < totalTopOffset) {
                const difference = totalTopOffset - bottomHeight
                innerHeight -= difference;
            } else {

            }
        }

        // Do the same as the partial horizontal centre heroics but for horizontal elements.
        if (this.chartOptions.centreVertical === 'partial') {
            const difference = Math.abs(totalText.bottom - totalText.top);
            innerHeight -= difference;
            if (totalText.top < totalText.bottom) {
                totalTopOffset += difference;
                offsets.top = _.map(offsets.top, (offset: number) => offset + difference);
            }
        }


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
        this.plotAreaHeight = innerHeight;

    }
    
    
    /**
     * Try to make a sensible title string from a variable name. For example, 'someField' will be 
     * converted to 'Some Field'. This is just a default for when the user doesn't override it.
     * 
     * @param name  The variable name to convert.
     * @returns     Converted title string.
     */
    private formatTitle(name: string) {
        const words = _.words(name);
        return _.map(words, _.capitalize).join(' ');
    }

}
