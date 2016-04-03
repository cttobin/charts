import { Chart } from './Chart';
import { Layer } from './layers/Layer';


export class LiveChart {

	private chart: Chart;
  
	constructor (chart: Chart) {
		this.chart = chart;
	}

  public removeData(): void {
    _.forEach(this.chart.layers, (layer: Layer) => layer.remove());
  }

}
