/// <reference path="../../typings/browser.d.ts" />

import { PlotJS } from './components/plot';
import { Chart } from './components/Chart';
import { Data } from './components/Data';

(function () {

  const rawData = [
    {'year': 2010, 'sales': 1000, 'department': 'A'},
    {'year': 2011, 'sales': 2000, 'department': 'A'},
    {'year': 2012, 'sales': 3000, 'department': 'A'},
    {'year': 2013, 'sales': 800, 'department': 'A'},
    {'year': 2014, 'sales': 1250, 'department': 'A'},
    {'year': 2015, 'sales': 250, 'department': 'A'},
    {'year': 2010, 'sales': 5000, 'department': 'B'},
    {'year': 2011, 'sales': 1890, 'department': 'B'},
    {'year': 2012, 'sales': 2800, 'department': 'B'},
    {'year': 2013, 'sales': 2800, 'department': 'B'},
    {'year': 2014, 'sales': 2175, 'department': 'B'},
    {'year': 2015, 'sales': 1276, 'department': 'B'}
  ];

  const department = PlotJS.mapping('department');

  const chart = PlotJS.chart(rawData, {
      x: PlotJS.mapping('year'),
      y: PlotJS.mapping('sales'),
      label: department
    })
    .ticksFormat({
      y: PlotJS.labels.comma(),
      x: PlotJS.labels.integer()
    })
    .lines({
      stroke: department
    })
    .points({fill: department})
    .titles({
      main: 'What',
      y: 'Total Sales'
    })
    .animate({delay: 250})
    // .title('Chart Title')
    .draw('.some-container');

  //setTimeout(chart.removeData, 2000);

})();


module toberCharts {

  'use strict';

}
