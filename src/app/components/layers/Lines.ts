import { Chart } from './../Chart';
import { Layer } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { StaticRangeScale, ContinuousRangeScale, OrdinalRangeScale } from './../Scale';


interface LineParameters extends LayerParameters {
  thickness: () => number;
  interpolate: () => string;
  dash: () => string;
  opacity: () => number;
  stroke: () => string;
}


export class LineLayer extends Layer {

  constructor(chart: Chart, userParameters: LayerParameters) {

    const theme = chart._theme;

    super('lines', chart, userParameters, {

      // Line thickness.
      'thickness': new ContinuousRangeScale(2, [1, 10]),

      // Line shape.
      'interpolate': new StaticRangeScale('linear', ['linear', 'linear-closed', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'cardinal-closed', 'monotone']),

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

  draw(): void {

    let chart = this.chart;
    const parameterScales = super._generateScales(chart._data) as LineParameters;
    const interpolation = 'cardinal';

    const lineFunction = d3.svg.line()
      .x((datum: any) => chart._scales.x(datum[chart._mappings.x.name]))
      .y((datum: any) => chart._scales.y(datum[chart._mappings.y.name]))
      .interpolate(interpolation);

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

        lineData = _(chart._data.rows)
          .groupBy(this.userParameters[item].name)
          .toArray()
          .value();

        // Found a group variable.
        group = true;

      }

    });

    // Since no grouping variable has been found, the data must
    // be converted into a multidimensional array to suit d3.
    if (!group) {
      lineData = [chart._data.rows];
    }

    let lines = chart._plotArea
      .append('g')
      .attr('class', this.className)
      .selectAll('.datum-lines')
      .data(lineData)
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
      const animation = chart._animation;

      // Before the animation begins, the line must have a starting position at the bottom of the chart.
      const initialLineFunction = d3.svg.line()
        .x((datum: any) => chart._scales.x(datum[chart._mappings.x.name]))
        .y(() => chart._scales.y(0))
        .interpolate(interpolation);

      lines = lines
        .attr('d', initialLineFunction)
        .transition()
        .duration(animation.duration)
        .ease(animation.easing)
        .delay(animation.delay);
    }

    lines.attr('d', lineFunction);

  }

}
