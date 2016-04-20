/// <reference path="../../typings/browser.d.ts" />

import { PlotJS } from './components/plot';
import { Chart } from './components/Chart';
import { Data } from './components/Data';

(function() {

    const rawData = [
        { 'year': 2010, 'sales': 1000, 'department': 'B' },
        { 'year': 2011, 'sales': 2000, 'department': 'A' },
        { 'year': 2012, 'sales': 3000, 'department': 'A' },
        { 'year': 2013, 'sales': 800, 'department': 'A' },
        { 'year': 2014, 'sales': 1250, 'department': 'A' },
        { 'year': 2015, 'sales': 250, 'department': 'A' },
        { 'year': 2010, 'sales': 5000, 'department': 'A' },
        { 'year': 2011, 'sales': 1890, 'department': 'B' },
        { 'year': 2012, 'sales': 2800, 'department': 'B' },
        { 'year': 2013, 'sales': 2800, 'department': 'B' },
        { 'year': 2014, 'sales': 2175, 'department': 'B' },
        { 'year': 2015, 'sales': 1276, 'department': 'B' }
    ];
    
    const dateData = [
        { 'year': new Date(2010, 0, 1), 'sales': 1000, 'department': 'A' },
        { 'year': new Date(2011, 0, 1), 'sales': 2000, 'department': 'A' },
        { 'year': new Date(2012, 0, 1), 'sales': 3000, 'department': 'A' },
        { 'year': new Date(2013, 0, 1), 'sales': 800, 'department': 'A' },
        { 'year': new Date(2014, 0, 1), 'sales': 1250, 'department': 'A' },
        { 'year': new Date(2015, 0, 1), 'sales': 250, 'department': 'A' }
    ];

    const rawData2 = [{"year":2010,"sales":1000,"department":"a","thing":"1"},{"year":2010,"sales":2000,"department":"a","thing":"2"},{"year":2010,"sales":3000,"department":"b","thing":"1"},{"year":2010,"sales":4000,"department":"b","thing":"2"},{"year":2011,"sales":5000,"department":"a","thing":"1"},{"year":2011,"sales":6000,"department":"a","thing":"2"},{"year":2011,"sales":7000,"department":"b","thing":"1"},{"year":2011,"sales":8000,"department":"b","thing":"2"}] ;

    const department = PlotJS.mapping('department');

    const subset = _.filter(dateData, { department: 'A' });
    const chart = PlotJS.chart(dateData, {

    })
        .x(PlotJS.mapping('year'), {
            format: d3.time.format('%Y'),
            otherSide: false
        })
        .y(PlotJS.mapping('sales'), {
            format: PlotJS.labels.currency(),
            otherSide: false
        })
        .points({
            fill: PlotJS.mapping('department'),
            size: PlotJS.mapping('sales')
        })
        .lines({
            stroke: PlotJS.mapping('department')
        })
        // .columns({
        //     fill: department
        // })
        // .animate(null)
        // .title('Chart 2')
        // .subtitle('Subtitle')
        .draw('.chart-1')
        .then(function () {
            console.log('Done!');
        });

})();


module toberCharts {

    'use strict';

}
