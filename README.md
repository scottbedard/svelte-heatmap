# svelte-heatmap

This branch is a work in progress, please check back later.

## Installation

Soon...

## Basic usage

Soon...

## Props

##### `colors`

Array of CSS colors to use for the chart, ordered from lowest to highest. Default colors match the GitHub contribution graph.

##### `emptyColor`

CSS color to use for cells with no value.

##### `startDate`

Date object representing the first day of the graph. If omitted, this will default to the first day of the `month` or `year`, based on the current `view`.

##### `endDate`

Date object represending the last day of the graph. If omitted, this will default to the last day of the current `month` or `year`, depending on the current `view`.

##### `view`

Determines how the chart should be displayed. Supported values are `monthly` and `yearly`, defaults to `yearly`.

## License

[MIT](https://github.com/scottbedard/svelte-heatmap/blob/master/LICENSE)

Copyright (c) 2017-present, Scott Bedard
