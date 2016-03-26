import { Chart } from './Chart';
import { ChartOptions } from './ChartOptions';
import { Mapping, Mappings } from './Mapping';
import { Theme } from './Theme';
import { Data } from './Data';


export const PlotJS = {

  chart: function (data: any[], mappings: Mappings, chartOptions?: ChartOptions) {
    return new Chart(data, mappings, chartOptions);
  },

  mapping: function (field: string, definition?: { [index: string]: any } | { [index: number]: any | any[] }) {
    return new Mapping(field, definition);
  },

  data: function (data: any[]) {
    return new Data(data);
  },

  type: {
    ordinal: function () {

    }
  },

  labels: {
    comma: function () {
      return d3.format(',')
    },
    integer: function () {
      return d3.format('d')
    },
    currency: function (currencySymbol?: string) {
      return d3.format('$,');
    }
  },

  theme: {
    'main': new Theme(['#2980b9', '#27ae60', '#e74c3c', '#9b59b6', '#1cccaa', '#f39c12'], ['#f1c40f', '#f39c12'])
  }

};
