import { Chart } from './../Chart';
import { Layer, LayerNumberParameter, LayerStringParameter } from './Layer';
import { ContinuousRangeScale } from './../Scale';
import { OrdinalRangeScale } from './../Scale';
import { isOrdinalScale } from './../utilities/isOrdinalScale';

export interface PointParameters {
  size?: LayerNumberParameter;
  fill?: LayerStringParameter;
  opacity?: LayerNumberParameter;
  stroke?: LayerStringParameter;
  color?: LayerStringParameter;
}


interface PointScales {
  size: () => number;
  fill: () => string;
  opacity: () => number;
  stroke: () => string;
}


export class PointLayer extends Layer {

  private elements: d3.Transition<SVGElement>;

  constructor(chart: Chart, userParameters: PointParameters) {

    const theme = chart.theme;

    super('points', false, false, false, false, chart, userParameters, {

      'size': new ContinuousRangeScale(4, [3, 8]),
      'fill': new OrdinalRangeScale(theme.swatch[1], theme.swatch, theme.gradient),
      'opacity': new ContinuousRangeScale(1, [0.1, 1]),
      'stroke': new OrdinalRangeScale(null, theme.swatch, theme.gradient)

    });

  }

  public remove(): void {
    this.elements.remove();
  }

  public draw(container: d3.Selection<SVGElement>, index: number): d3.Transition<SVGElement> {

    const parameterScales = <PointScales> this.parameterScales;
    const chart = this.chart;
    
    const x = chart.axes.x;
    const y = chart.axes.y;
    let xScale = x.scale;
    
    if (isOrdinalScale(xScale)) {
        xScale = xScale.copy();
        xScale.rangeRoundBands([xScale.rangeBand() / 2, chart.plotAreaWidth + (xScale.rangeBand() / 2)], 0.1);
    }

    this.elements = <any> chart.plotArea
      .append('g')
      .attr('class', this.className)
      .selectAll(this.datumClassName)
      .data(chart.data.rows)
      .enter()
      .append('circle')
      .style({
        'fill': parameterScales.fill,
        'stroke': parameterScales.stroke,
        'opacity': parameterScales.opacity
      })
      .on('mouseover', (datum: any) => {

        this.tooltip = chart.plotArea
          .append('circle')
          .attr({
            'r': parameterScales.size() + 3,
            'cx': xScale(datum[x.mapping.name]),
            'cy': y.scale(datum[y.mapping.name]),
            'class': this.tooltipClassName
          });

      })
      .on('mouseout', () => {
        this.tooltip.remove();
      })
      .attr({
        'r': parameterScales.size,
        'cx': (datum: any) => xScale(datum[x.mapping.name])
      });

    if (chart.isAnimated()) {
      const animation = chart.animation;
      this.elements = this.elements.attr('cy', y.scale.range()[0])
        .transition()
        .duration(animation.duration)
        .ease(animation.easing)
        .delay(animation.delay * index);
    }

    return this.elements.attr('cy', (datum: any) => y.scale(datum[y.mapping.name]));

  }

}
