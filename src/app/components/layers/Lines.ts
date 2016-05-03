import { Chart } from './../Chart';
import { Layer, LayerNumberParameter, LayerStringParameter } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { StaticRangeScale, ContinuousRangeScale, OrdinalRangeScale } from './../Scale';
import { isOrdinalScale } from './../utilities/isOrdinalScale';
import { Dictionary } from './../definitions/Dictionary';


// TODO: Interpolate is a fixed parameter.
export interface LineParameters {
    thickness: () => LayerNumberParameter;
    interpolate: () => LayerStringParameter;
    dash: () => LayerStringParameter;
    opacity: () => LayerNumberParameter;
    stroke: () => LayerStringParameter;
}


interface LineScales {
    thickness: () => number;
    interpolate: () => string;
    dash: () => string;
    opacity: () => number;
    stroke: () => string;
}


export class LineLayer extends Layer {

    private elements: any;

    constructor(chart: Chart, userParameters: LayerParameters) {

        const theme = chart.theme;

        super('lines', false, false, false, false, chart, userParameters, {

            // Line thickness.
            'thickness': new ContinuousRangeScale(2, [1, 10]),

            // Line shape.
            'interpolate': new StaticRangeScale('cardinal', ['linear', 'linear-closed', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'cardinal-closed', 'monotone']),

            // Dotted line or whatever.
            'dash': new OrdinalRangeScale('0', ['0', '4, 4', '2, 2'], ['0', '4, 4']),
            'opacity': new ContinuousRangeScale(1, [0.1, 1]),
            'stroke': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient)

        });

    }

    _onFirstDatum(method: (datum: any) => any): (datum: any) => any {
        return function (data: any[]): any {
            return method(data[0]);
        };
    }

    public remove(): void {
        this.elements.remove();
    }

    public draw(container: d3.Selection<SVGElement>, index: number): d3.Transition<SVGElement> {

        let chart = this.chart;
        const parameterScales = <LineScales> this.parameterScales;
        const interpolation = parameterScales.interpolate;

        const x = chart.axes.x;
        const y = chart.axes.y;
        let xScale = x.scale;

        const lineFunction = d3.svg.line()
            .x((datum: any) => xScale(datum[x.mapping.name]))
            .y((datum: any) => y.scale(datum[y.mapping.name]))
            .interpolate('linear');

        // Assume the data has not been grouped and it should just
        // be plotted as it was given originally.
        let group = false;

        // Parameters that will cause grouping.
        const groupingParameters = ['stroke'];

        // The eventual chart data.
        let lineData;

        // Check all grouping variables to see if any have been mapped.
        _.forEach(groupingParameters, (item: string) => {

            // See if the grouping variable has been mapped by the user.
            const mappingExists = _.includes(_.keys(this.userParameters), item);
            if (!group && mappingExists) {

                lineData = _(chart.data.rows)
                    .groupBy(this.userParameters[item].name)
                    .toArray()
                    .value();

                // Found a group variable.
                group = true;

            }

        });

        // Since no grouping variable has been found, the data must be converted into a 
        // multidimensional array to suit d3.
        if (!group) {
            lineData = [chart.data.rows];
        }

        this.elements = chart.plotArea
            .append('g')
            .attr('class', this.className)
            .selectAll(this.datumClassName)
            .data(_.map(lineData, (row: any) => _.sortBy(row, x.mapping.name)))
            .enter()
            .append('path')
            .style({
                'stroke-dasharray': this._onFirstDatum(parameterScales.dash),
                'opacity': this._onFirstDatum(parameterScales.opacity)
            })
            .attr({
                'stroke-width': this._onFirstDatum(parameterScales.thickness),
                'stroke': this._onFirstDatum(parameterScales.stroke)
            });

        if (chart.isAnimated()) {

            // Animation settings.
            const animation = chart.animation;

            // Before the animation begins, the line must have a starting position at the bottom of 
            // the chart.
            const initialLineFunction = d3.svg.line()
                .x((datum: any) => x.scale(datum[chart.mappings.x.name]))
                .y(y.scale.range()[0])
                .interpolate(interpolation);

            this.elements = this.elements
                .attr('d', initialLineFunction)
                .transition()
                .duration(animation.duration)
                .ease(animation.easing)
                .delay(animation.delay * index);
        }

        this.elements.attr('d', lineFunction);
        return this.elements;

    }

}
