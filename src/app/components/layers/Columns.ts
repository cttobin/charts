import { Chart } from './../Chart';
import { Layer } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { OrdinalRangeScale, ContinuousRangeScale } from './../Scale';


interface ColumnParameters extends LayerParameters {
  fill: () => string;
  opacity: () => number;
  stroke: () => string;
}


export class ColumnLayer extends Layer {

    constructor (chart: Chart, userParameters: LayerParameters) {
        let theme = chart._theme;
        super('columns', chart, userParameters, {
            'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
            'opacity': new ContinuousRangeScale(1, [0.1, 1]),
            'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)
        });
    }

    draw () : void {

        let chart = this.chart;
        const mappings = chart._mappings;
        const parameterScales = this.parameterScales as ColumnParameters;
        const rows = chart._data.rows;
        const xName = mappings.x.name;
        const yName = mappings.y.name;

        // The chart's x-axis must be ordinal.
        let uniqueValues = chart._data.fields[mappings.x.name].getUniqueValues();
        let xScale = d3.scale.ordinal()
            .domain(uniqueValues)
            .rangeRoundBands([0, chart._plotAreaWidth], 0.1);

        // Assume the data has not been grouped and it should just be plotted as it was given originally.
        let group = false;

        // Parameters that will cause grouping.
        let groupingParameters = ['fill'];
        let columnData = [];

        // Check all grouping variables to see if any have been mapped.
        _.forEach(groupingParameters, (item: string) => {

            // See if the grouping variable has been mapped by the user.
            let mappingExists = _.includes(_.keys(this.userParameters), item);
            if (!group && mappingExists) {

                columnData = _(rows)
                    .groupBy(xName)
                    .map(function (group: any[]) {

                        return _.map(group, function (datum: any, index: number) {

                            let previousDatum = datum[index - 1];
                            let previousValue = _.isUndefined(previousDatum) ? 0 : previousDatum[yName];
                            return {
                                x: datum[xName],
                                y: datum[yName] + previousValue
                            };

                        });

                    })
                    .flatten()
                    .value();

                // Found a group variable.
                group = true;

            }

        });

        this.chart._plotArea
            .append('g')
            .attr('class', this.className)
            .selectAll('rect')
            .data(columnData)
            .enter()
            .append('rect')
            .attr({
                'x': (datum: any) => xScale(datum.x),
                'y': (datum: any) => this.chart._scales.y(datum.y),
                'width': xScale.rangeBand(),
                'height': (datum: any) => this.chart._scales.y(this.chart._plotAreaHeight) - this.chart._scales.y(datum.y)
            })
            .style({
                'fill': parameterScales.fill,
                'stroke': parameterScales.stroke,
                'opacity': parameterScales.opacity
            });

    }

}
