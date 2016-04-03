Inspired by ggplot2, Tober Charts...

Basic bar chart:

```javascript
tx.chart(data, {
  x: tx.mapping('year'),
  y: tx.mapping('sales')
}).bars()
  .draw('#sales-chart')
```

## Placement

Charts can be added to a page using the `Chart.draw()`. Pass a CSS selector or element to `draw()` and the chart will render there.

The resulting chart will take up 100% of the height and width of the given element, so you may position or size that container as appropriate to determine the size and position of the chart.

```html
<div id="chart"></div>
```

```javascript
chart.draw('#chart');
```

```css
#chart {
  width: 500px;
  margin: 0 auto;
}
```

**Note:** `draw()` uses `d3.select()` behind the scenes. Please refer to its [documentation](https://github.com/mbostock/d3/wiki/Selections) if you are facing selection woes.

## Layers

*Layers* are the elements on a chart that display the input data&mdash;points, bars, lines etc. A chart must have at least one layer and can have any number beyond that. For example, to plot both points and lines on a chart:

```javascript
tx.chart(data)
  .x(tx.mapping('year'))
  .y(tx.mapping('sales'))
  .lines()
  .points()
  .draw('#sales-chart')
```

Layers are rendered in the order they are provided. In the example above, the `points` layer is plotted on top of the lines `layer`.

## Layer Parameters

Layers have many configurable parameters such as the size and colour of points in a scatterplot, the thickness, dash design and colour of lines in a line chart and so on. These parameters can be set to either fixed values or mapped to the input data. For fixed values, simply provide a number or string argument:

```javascript
chart.points({radius: 6, fill: 'red'})
```

In this example, every point in the chart will have radius of `6` and a fill colour `red`. Things get interesting when these parameters are mapped to the input data rather than hardcoded.


## Mapping

A *mapping* defines a relationship between the input data and the displayed output. They are defined using the `mapping()` function. Input data can be mapped to many different parameters of a layer. For example, here's how to vary the size of points in a scatterplot by a variable "sales".

```javascript
tx.chart(data)
  .x(tx.mapping('year'))
  .y(tx.mapping('sales'))
  .points({radius: tx.mapping('sales')})
  .draw('#sales-chart')
```

Every layer parameter has a default range that is applied when a mapping is used. For example `radius` varies from 3 to 8 pixels. Assume that the "sales" value can vary from a minimum of €1,000 to a maximum  of €50,000. On the chart, points with a sales value of €1,000 will have a radius of `3`. Points with a sales value of €50,000 will have a radius of `8`. A point with a sales of value of €25,000 would be somewhere in between (`5.35`).

### Custom Mapping

The mapping can be customised too.

```javascript
chart.lines({fill: tx.mapping('department', {
  'Accounts': 'red',
  'Sales': 'blue',
  'Advertising': 'green'
})});

```


### Reusing Mappings

A mapping can be reused. For example, rather than doing this:

```javascript
chart.lines({
  fill: tx.mapping('department', {
    'Accounts': 'red',
    'Sales': 'blue',
    'Advertising': 'green'
  })
})
.bars({
  fill: tx.mapping('department', {
    'Accounts': 'red',
    'Sales': 'blue',
    'Advertising': 'green'
  })
});
```

... assign the mapping to a variable and reuse it.

```javascript
const departmentMapping = tx.mapping('department', {
  'Accounts': 'red',
  'Sales': 'blue',
  'Advertising': 'green'
});

chart.lines({fill: departmentMapping})
  .bar({fill: departmentMapping});
```

... or even:

```javascript
const departmentFill = {
  fill: tx.mapping('department', {
    'Accounts': 'red',
    'Sales': 'blue',
    'Advertising': 'green'
  })
};

chart
  .lines(departmentFill)
  .bar(departmentFill);
```

## Titles

Use `Chart.title()` to add the a main title to a chart. Or `Chart.titles()` to add/edit the main, axes and/or legend titles.

```javascript
chart.titles({
  main: 'Title above the chart',
  x: 'Year',
  y: 'Sales',
  fill: 'Sales'
})
```
