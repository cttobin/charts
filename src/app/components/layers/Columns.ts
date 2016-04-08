import { Chart } from './../Chart';
import { Layer, LayerNumberParameter, LayerStringParameter } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { OrdinalRangeScale, ContinuousRangeScale } from './../Scale';
import { translate } from './../utilities/translate';


export interface ColumnParameters {
  fill?: LayerStringParameter;
  opacity?: LayerNumberParameter;
  stroke?: LayerStringParameter;
  color?: LayerStringParameter;
  texture?: any;
}


interface ColumnScales {
  fill: () => string;
  opacity: () => number;
  stroke: () => string;
}


export class ColumnLayer extends Layer {

    private elements: any;

  constructor (chart: Chart, userParameters: LayerParameters) {
    let theme = chart.theme;
    super('columns', false, true, true, false, chart, userParameters, {
      'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
      'opacity': new ContinuousRangeScale(1, [0.5, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)
    });
  }

  public remove(): void {}

  public draw(container: d3.Selection<SVGElement>): void {

    const chart = this.chart;
    const parameterScales = <ColumnScales> this.parameterScales;
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

    // The outer groups are the things that will contain each group. For example, if the chart is
    // plotting X versus Y coloured by Z, where Z can one be one of two values "z1" or "z2", then
    // the chart's x-axis will be arranged like [z1, z2], [z1, z2], [z1, z2]. To get the data in
    // that format, it needs to be grouped by X (an outer group being one [z1, z2]).
    const outerGroups = _.toArray(_.groupBy(rows, x.mapping.name));
    const outer = container
        .selectAll('g')
        .data(outerGroups)
        .enter()
        .append('g')
        .attr('transform', (datum: any) => translate(x.scale(datum[0][x.mapping.name]), 0));

    // Make another axis based on the groups. In the example above, this will be based on "Z", the
    // colour of the bars. This is needed so that within each X group, the Z values can be 
    // positioned.
    const innerExtent = _.uniq(_.map(rows, (datum: any) => datum[innerGroup]));
    const innerScale = d3.scale.ordinal()
        .domain(innerExtent)
        .rangeRoundBands([0, x.scale.rangeBand()], groupings.length ? 0.05 : 0);

    // Within each outer container, render the groups. Before this, the X axis will be displayed
    // like [ ] [ ] [ ] and this bit will make it like [z1, z2], [z1, z2].
    this.elements = outer.selectAll('rect')
        .data(_.identity)
        .enter()
        .append('rect')
        .attr({
            'class': this.datumClassName,
            'width': innerScale.rangeBand(),
            'x': (datum: any) => innerScale(datum[innerGroup])
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
          'y': y.scale(0)
        })
        .transition()
        .duration(animation.duration)
        .ease(animation.easing)
        .delay(animation.delay);
    }

    // Post-animation positions.
    this.elements.attr({
        'height': (datum: any) => this.chart.plotAreaHeight - y.scale(datum[y.mapping.name]),
        'y': (datum: any) => y.scale(datum[y.mapping.name])
    });

  }

}
