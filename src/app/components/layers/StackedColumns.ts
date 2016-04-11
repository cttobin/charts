import { Chart } from './../Chart';
import { Layer, LayerNumberParameter, LayerStringParameter } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { OrdinalRangeScale, ContinuousRangeScale } from './../Scale';
import { translate } from './../utilities/translate';


export interface StackedColumnParameters {
    fill?: LayerStringParameter;
    opacity?: LayerNumberParameter;
    stroke?: LayerStringParameter;
    color?: LayerStringParameter;
    texture?: any;
}


interface StackedColumnScales {
    fill: () => string;
    opacity: () => number;
    stroke: () => string;
}


export class StackedColumnLayer extends Layer {

    private elements: any;

    constructor(chart: Chart, userParameters: LayerParameters) {
        let theme = chart.theme;
        super('columns', false, true, true, false, chart, userParameters, {
            'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
            'opacity': new ContinuousRangeScale(1, [0.2, 1]),
            'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)
        });
    }

    public remove(): void { }

    public draw(container: d3.Selection<SVGElement>): void {

        const chart = this.chart;
        const parameterScales = <StackedColumnScales>this.parameterScales;
        const rows = chart.data.rows;
        const x = chart.axes.x;
        const y = chart.axes.y;

        // See if there are scales that will cause the chart to be grouped.
        const groupingScales = ['fill', 'stroke', 'opacity'];
        const groupings = _.intersection(_.keys(this.userParameters), groupingScales);

        const dummyGroupName = 'dummy';

        // The inner group will be the variable that will be used to group the bars. If there is no such
        // grouping required, the inner grouping variable will just be undefined.
        let innerGroup;
        if (groupings.length === 1) {
            innerGroup = this.userParameters[groupings[0]].name;
        } else if (groupings.length >= 2) {

            // The charts need to be grouped by multiple fields. This is unlikely to have much practical
            // use but this is the best charting library every created so it's better to handle it.
            _.forEach(rows, (row: any) => {

                // Extract the values for each group.
                const group = _.map(groupings, (grouping: string) => {
                    const name = this.userParameters[grouping].name;
                    return row[name];
                });

                // Join the grouping values together to create a new dummy variable to group on. For
                // example, if there are two variables to group on, A and B with values (a1, a2) and
                // (b1, b2), a new field will be created on every row with the combined values with
                // values "a1-b1", "a1-b2" etc.
                row[dummyGroupName] = group.join('-');
            });

            innerGroup = dummyGroupName;

        }
        
        // Make sure the bars are always stacked in the same order.
        const sortedRows = _.sortBy(rows, (datum: any) => datum[innerGroup]);
        
        // Calculate the height and y-coordinate for each bar.
        _(sortedRows).groupBy(x.mapping.name)
            .forOwn(function (group: any[], groupName: string) { 
                
                let innerGroupValues = [];
                let previous = 0;
                _.forEach(group, function (row: any) {
                    const value = row[y.mapping.name] + previous;
                    row.y = value;
                    previous = value;
                    innerGroupValues.push(row[innerGroup]);
                });
                
                if (innerGroupValues.length != _.uniq(innerGroupValues).length) {
                    throw new Error(`Invalid grouping parameter supplied. For example, where ` + 
                        `"${x.mapping.name}" = ${groupName}, there are duplicate "${innerGroup}"` +
                        ` values.`);
                }
                
            });
            
        y.scale.domain([y.scale.domain()[0], d3.max(rows, (datum: any) => datum.y)]);

        this.elements = chart.plotArea.selectAll('rect')
            .data(sortedRows)
            .enter()
            .append('rect')
            .attr({
                'class': (datum: any) => `${datum.year}-` + datum[innerGroup],
                'width': x.scale.rangeBand(),
                'x': (datum: any) => x.scale(datum[x.mapping.name])
            })
            .style({
                'fill': parameterScales.fill,
                'stroke': parameterScales.stroke,
                'opacity': parameterScales.opacity
            });

        // Apply pre-animation positions and the animations settings if necessary.
        if (chart.isAnimated()) {
            const animation = chart.animation;
            this.elements = this.elements.attr({
                'height': 0,
                'y': y.scale.range()[0]
            })
                .transition()
                .duration(animation.duration)
                .ease(animation.easing)
                .delay(animation.delay);
        }

        // Post-animation positions.
        this.elements.attr({
            'height': (datum: any) => chart.plotAreaHeight - y.scale(datum[y.mapping.name]),
            'y': (datum: any) => y.scale(datum.y)
        });

    }

}
