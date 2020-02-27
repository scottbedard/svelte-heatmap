# svelte-heatmap

This branch is a work in progress, please check back later.

## Installation

Soon...

## Basic usage

Soon...

## Props

> **Note:** Date values for `data`, `startDate`, and `endDate` should be [JavaScript `Date` objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects, or a `string` or `number` compatible with the Date constructor.

####
#### `data`

Array of objects containing the chart data. These objects should be in the shape of `{ date, value }`.

##### `cellGap`

Defines the space between cells.

##### `cellSize`

Defines the size of each cell.

##### `colors`

Array of CSS colors to use for the chart, ordered from lowest to highest. Default colors match the GitHub contribution graph.

##### `emptyColor`

CSS color to use for cells with no value.

##### `monthGap`

Defines the space between months when `view` is set to `monthly`.

##### `startDate`

Date object representing the first day of the graph. If omitted, this will default to the first day of the `month` or `year`, based on the current `view`.

##### `endDate`

Date object represending the last day of the graph. If omitted, this will default to the last day of the current `month` or `year`, depending on the current `view`.

##### `view`

Determines how the chart should be displayed. Supported values are `monthly` and `yearly`, defaults to `yearly`.

## License

[MIT](https://github.com/scottbedard/svelte-heatmap/blob/master/LICENSE)

Copyright (c) 2017-present, Scott Bedard
