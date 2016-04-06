import { Chart } from './../Chart';
import { Layer, LayerNumberParameter, LayerStringParameter } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { OrdinalRangeScale, ContinuousRangeScale } from './../Scale';
import { isOrdinalScale } from './../utilities/isOrdinalScale';


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

  constructor (chart: Chart, userParameters: LayerParameters) {
    let theme = chart.theme;
    super('columns', true, false, chart, userParameters, {
      'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
      'opacity': new ContinuousRangeScale(1, [0.1, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)
    });
  }

  public remove(): void {}

  public draw() : void {

    let chart = this.chart;
    const mappings = chart.mappings;
    const parameterScales = <ColumnScales> this.parameterScales;
    const rows = chart.data.rows;
    const xName = mappings.x.name;
    const yName = mappings.y.name;

    // The chart's x-axis must be ordinal.
    let xScale = chart.scales.x;
    if (!isOrdinalScale(xScale)) {
      const uniqueValues = chart.data.fields[mappings.x.name].getUniqueValues();
      xScale.ordinal()
        .domain(uniqueValues)
        .rangeRoundBands([0, chart.plotAreaWidth], 0.1);
    }

    // const xScale = chart._scales.x;

    // Assume the data has not been grouped and it should just be plotted as it was given originally.
    let group = false;

    // Parameters that will cause grouping.
    const groupingParameters = ['fill'];
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

    this.chart.plotArea
      .append('g')
      .attr('class', this.className)
      .selectAll('rect')
      .data(columnData)
      .enter()
      .append('rect')
      .attr({
        'x': (datum: any) => xScale(datum.x),
        'y': (datum: any) => this.chart.scales.y(datum.y),
        'width': xScale.rangeBand(),
        'height': (datum: any) => this.chart.scales.y(this.chart.plotAreaHeight) - this.chart.scales.y(datum.y)
      })
      .style({
        'fill': parameterScales.fill,
        'stroke': parameterScales.stroke,
        'opacity': parameterScales.opacity
      });

  }

}
