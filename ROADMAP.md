# 0.1

* Update the chart when the browser window resizes.

* Savage label support (i.e. labels on bars or whatever).

* Horizontal and vertical lines. Probably will accept an array or single value that should bisect whatever axis.

  `chart.horizontalLine([10, 20]);`    

* Gridlines.
* Legends.
* Layouts (different gridlines, axis positioning etc.).
* Tooltips.
* Click events and whatnot.

  ```
  chart.points({
    click: function (point) {
        console.log('Yo')
    }
  })
  ```

* Facets
  * Responsive if possible so they would stack on mobiles.
  * Support common and free scales.

* Update chart functions. Probably have `.clearData()`, `.updateData()` and `.replaceData()` functions.

## Line Layer

* Transparent fill underneath lines.

## Layers

* ~~Points.~~
* ~~Lines.~~
  * Group parameter in case you don't want different colours for each line.
* Area? Don't really like them because it's unclear if they're stacked or not.
* Columns (vertical bars).
* Stacked columns.
* Bars (horizontal columns).
* Stacked bars.
* Pie charts. May look at polar coordinates like ggplot.
* Error bars.

## Data Transformation Layers
* Density plots.
* Histograms.
* Boxplots.

May have to apply some pre-transformation to the data. It could be like this:

```
const data = new Data(rawData)
chart(data.toDensity())
  .lines({fill: 'group'})
```

The user would have to then specify `x` and `y`, but that's a bit boilerplatey. To avoid that a parameter could be set
by the `Data` class so that `Chart` will know to use whatever magic variables are generated. Alternatively there could be
prebuilt functions like:

```
densityChart(rawData)
```

That and other special charts could extend `Chart`.
