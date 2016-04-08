import { Chart } from './../Chart';
import { Layer, LayerNumberParameter, LayerStringParameter } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { OrdinalRangeScale, ContinuousRangeScale } from './../Scale';
import { isOrdinalScale } from './../utilities/isOrdinalScale';
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
      'opacity': new ContinuousRangeScale(1, [0.1, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)
    });
  }

  public remove(): void {}

  public draw(container: d3.Selection<SVGElement>) : void {

    const chart = this.chart;
    const mappings = chart.mappings;
    const parameterScales = <ColumnScales> this.parameterScales;
    const rows = chart.data.rows;
    const x = chart.axes.x;
    const y = chart.axes.y;
    
    const extent = d3.extent(chart.data.rows, (datum: any) => datum.department);
    const innerScale = d3.scale.ordinal()
        .domain(extent)
        .rangeRoundBands([0, x.scale.rangeBand()], 0.05);
    
    const groups = _.toArray(_.groupBy(chart.data.rows, 'year'));
    const outer = container
        .selectAll('g')
        .data(groups)
        .enter()
        .append('g')
        .attr('transform', (datum: any) => translate(x.scale(datum[0][x.mapping.name]), 0));
        
    this.elements = outer.selectAll('rect')
        .data(function (d) {
            return d;
        })
        .enter()
        .append('rect')
        .attr({
            'class': this.datumClassName,
            'width': innerScale.rangeBand(),
            'x': (datum: any) => innerScale(datum.department)  
        })
        .style({
            'fill': parameterScales.fill,
            'stroke': parameterScales.stroke,
            'opacity': parameterScales.opacity
        });
        
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

    this.elements.attr({
        'height': (datum: any) => this.chart.plotAreaHeight - y.scale(datum[y.mapping.name]),
        'y': (datum: any) => y.scale(datum[y.mapping.name])
    });

    // // The chart's x-axis must be ordinal.
    // let xScale = x.scale;
    // if (!isOrdinalScale(xScale)) {
    //   const uniqueValues = chart.data.fields[mappings.x.name].getUniqueValues();
    //   xScale.ordinal()
    //     .domain(uniqueValues)
    //     .rangeRoundBands([0, chart.plotAreaWidth], 0.1);
    // }

    // // const xScale = chart._scales.x;

    // // Assume the data has not been grouped and it should just be plotted as it was given originally.
    // let group = false;

    // // Parameters that will cause grouping.
    // const groupingParameters = ['fill'];
    // let columnData = [];

    // // Check all grouping variables to see if any have been mapped.
    // _.forEach(groupingParameters, (item: string) => {

    //   // See if the grouping variable has been mapped by the user.
    //   let mappingExists = _.includes(_.keys(this.userParameters), item);
    //   if (!group && mappingExists) {

    //     columnData = _(rows)
    //       .groupBy(x.mapping.name)
    //       .map(function (group: any[]) {

    //         return _.map(group, function (datum: any, index: number) {

    //           let previousDatum = datum[index - 1];
    //           let previousValue = _.isUndefined(previousDatum) ? 0 : previousDatum[y.mapping.name];
    //           return {
    //             x: datum[x.mapping.name],
    //             y: datum[y.mapping.name] + previousValue
    //           };

    //         });

    //       })
    //       .flatten()
    //       .value();

    //     // Found a group variable.
    //     group = true;

    //   }

    // });

    // this.chart.plotArea
    //   .append('g')
    //   .attr('class', this.className)
    //   .selectAll('rect')
    //   .data(columnData)
    //   .enter()
    //   .append('rect')
    //   .attr({
    //     'x': (datum: any) => xScale(datum.x),
    //     'y': (datum: any) => y.scale(datum.y),
    //     'width': xScale.rangeBand(),
    //     'height': (datum: any) => y.scale(this.chart.plotAreaHeight) - y.scale(datum.y)
    //   })
    //   .style({
    //     'fill': parameterScales.fill,
    //     'stroke': parameterScales.stroke,
    //     'opacity': parameterScales.opacity
    //   });

  }

}
