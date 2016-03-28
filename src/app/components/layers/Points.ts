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

  private elements: any;

  constructor(chart: Chart, userParameters: LayerParameters) {

    const theme = chart._theme;

    super('points', chart, userParameters, {

      'size': new ContinuousRangeScale(4, [2, 6]),
      'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
      'opacity': new ContinuousRangeScale(1, [0.1, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)

    });

  }

  public remove(): void {
    //_.forEach(this.points, (point) => point.remove());
    //this.elements.remove()
    //this.elements.attr('r', 0);
  }

  public draw(): void {

    let parameterScales: PointParameters = this.parameterScales as PointParameters;
    let chart = this.chart;
    const mappings = chart._mappings;

    this.elements = chart._plotArea
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
      .on('mouseover', (datum: any) => {

        this.tooltip = chart._plotArea
          .append('circle')
          .attr({
            'r': parameterScales.size() + 3,
            'cx': chart._scales.x(datum[mappings.x.name]),
            'cy': chart._scales.y(datum[mappings.y.name]),
            'class': this.tooltipClass
          });

      })
      .on('mouseout', () => {
        this.tooltip.remove();
      })
      .attr({
        'r': parameterScales.size,
        'cx': (datum: any) => chart._scales.x(datum[mappings.x.name])
      });

    if (chart.isAnimated()) {
      const animation = chart._animation;
      this.elements = this.elements.attr('cy', () => chart._scales.y(0))
        .transition()
        .duration(animation.duration)
        .ease(animation.easing)
        .delay(animation.delay);
    }

    this.elements.attr('cy', (datum: any) => chart._scales.y(datum[mappings.y.name]));

  }

}
