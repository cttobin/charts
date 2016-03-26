import { Chart } from './../Chart';
import { Layer } from './Layer';
import { LayerParameters } from './../LayerParameters';
import { ContinuousRangeScale } from './../Scale';
import { OrdinalRangeScale } from './../Scale';


export interface PointParameters extends LayerParameters {
  size: () => number;
  fill: () => string;
  opacity: () => number;
  stroke: () => string;
}


export class PointLayer extends Layer {

  constructor(chart: Chart, userParameters: LayerParameters) {

    const theme = chart._theme;

    super('points', chart, userParameters, {

      'size': new ContinuousRangeScale(4, [2, 6]),
      'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
      'opacity': new ContinuousRangeScale(1, [0.1, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)

    });

  }

  draw(): void {

    let parameterScales: PointParameters = this.parameterScales as PointParameters;
    let chart = this.chart;
    const mappings = chart._mappings;

    let points = chart._plotArea
      .append('g')
      .attr('class', this.className)
      .selectAll('.datum-points')
      .data(chart._data.rows)
      .enter()
      .append('circle')
      .style({
        'fill': parameterScales.fill,
        'stroke': parameterScales.stroke,
        'opacity': parameterScales.opacity
      })
      .attr({
        'r': parameterScales.size,
        'cx': (datum: any) => chart._scales.x(datum[mappings.x.name])
      });

    if (chart.isAnimated()) {
      const animation = chart._animation;
      points = points.attr('cy', () => chart._scales.y(0))
        .transition()
        .duration(animation.duration)
        .ease(animation.easing)
        .delay(animation.delay);
    }

    points.attr('cy', (datum: any) => chart._scales.y(datum[mappings.y.name]));

  }

}
