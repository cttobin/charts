import { Layer } from './Layer';
import { LayerParameters } from '../LayerParameters';
import { Chart } from '../Chart';
import { ContinuousRangeScale, OrdinalRangeScale } from '../Scale';


export interface TextLayerParameters extends LayerParameters {
  size: () => number;
  fill: () => string;
  opacity: () => number;
  stroke: () => string;
  weight: () => number;
  label: () => string;
}


export class TextLayer extends Layer {

  constructor(chart: Chart, userParameters: LayerParameters) {

    const theme = chart._theme;

    super('text', chart, userParameters, {

      'size': new ContinuousRangeScale(20, [2, 6]),
      'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
      'opacity': new ContinuousRangeScale(1, [0.1, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient),
      'label': new OrdinalRangeScale(null, null, null)

    });

  }

  public draw(): void {

    let parameterScales = this.parameterScales as TextLayerParameters;
    let chart = this.chart;
    const mappings = chart._mappings;

    chart._plotArea
      .append('g')
      .attr('class', this.className)
      .selectAll('.datum-points')
      .data(chart._data.rows)
      .enter()
      .append('text')
      .attr({
        'x': (datum: any) => chart._scales.x(datum[mappings.x.name]),
        'y': (datum: any) => chart._scales.y(datum[mappings.y.name])
      })
      .style({
        'fill': parameterScales.fill,
        'stroke': parameterScales.stroke,
        'opacity': parameterScales.opacity,
        'font-size': parameterScales.size
      })
      .text(function (datum) {
        return datum[mappings.label.name];
      });


  }

}
