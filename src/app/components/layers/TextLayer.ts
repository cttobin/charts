import { Layer, LayerNumberParameter, LayerStringParameter } from './Layer';
import { LayerParameters } from '../LayerParameters';
import { Chart } from '../Chart';
import { ContinuousRangeScale, OrdinalRangeScale } from '../Scale';
import { Mapping } from './../Mapping'; 


export interface TextParameters {
  size?: LayerNumberParameter;
  fill?: LayerStringParameter;
  opacity?: LayerNumberParameter;
  stroke?: LayerStringParameter;
  weight?: LayerStringParameter;
  label?: Mapping;
}


interface TextScales {
  size: () => number;
  fill: () => string;
  opacity: () => number;
  stroke: () => string;
  weight: () => string;
  label: () => string;
}


export class TextLayer extends Layer {

  constructor(chart: Chart, userParameters: LayerParameters) {

    const theme = chart.theme;

    super('text', false, false, false, false, chart, userParameters, {

      'size': new ContinuousRangeScale(20, [2, 6]),
      'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
      'opacity': new ContinuousRangeScale(1, [0.4, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient),
      'label': new OrdinalRangeScale(null, null, null),
      'weight': new ContinuousRangeScale(400, [100, 900]),

    });

  }

  public remove(): void {}

  public draw(container: d3.Selection<SVGElement>): d3.Transition<SVGElement> {

    const parameterScales = <TextScales>this.parameterScales;
    const x = this.chart.axes.x;
    const y = this.chart.axes.y;

    let elements = this.chart.plotArea
      .append('g')
      .attr('class', this.className)
      .selectAll('.datum-points')
      .data(this.chart.data.rows)
      .enter()
      .append('text')
      .attr({
        'x': (datum: any) => x.scale(datum[x.mapping.name])
      })
      .style({
        'fill': parameterScales.fill,
        'stroke': parameterScales.stroke,
        'opacity': parameterScales.opacity,
        'font-size': parameterScales.size,
        'font-weight': parameterScales.weight
      })
      .transition()
      .text(parameterScales.label);
      
      
      if (this.chart.isAnimated()) {
        const animation = this.chart.animation;
        elements = elements.attr('y', y.scale.range()[0])
          .transition()
          .duration(animation.duration)
          .ease(animation.easing)
          .delay(animation.delay);
      }
      
      elements.attr({
        'y': (datum: any) => y.scale(datum[y.mapping.name])
      })
      
      return elements;

  }

}
