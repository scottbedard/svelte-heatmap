# svelte-heatmap

This branch is a work in progress, please check back later.

## Installation

Soon...

## Basic usage

To create a heatmap, pass `props` and a `target` to the `Heatmap` constructor.

```js
const heatmap = new Heatmap({
    props: {
        // ...
    },
    target: '#some-container',
});
```

To remove the component, call `$destroy`. This will remove all elements from the DOM and unbind any event listeners.

```js
heatmap.$destroy();
```

See the [Svelte documentation](https://svelte.dev/docs#Client-side_component_API) for more information. 

## Props

Date values for `data`, `startDate`, and `endDate` should be [JavaScript `Date` objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects, or a `string` or `number` compatible with the Date constructor.

##### `allowOverflow`

Renders cells that fall outside the `startDate` to `endDate` range. Defaults to `false`.

##### `cellGap`

Defines the space between cells.

##### `cellSize`

Defines the size of each cell.

##### `colors`

Array of CSS colors to use for the chart, ordered from lowest to highest. Default colors match the GitHub contribution graph.

##### `data`

Array of objects containing the chart data. These objects should be in the shape of `{ date, value }`.

##### `dayLabelWidth`

Horizontal space to allocate for day labels. If this is `0`, day labels will not be rendered.

##### `dayLabels`

Array of strings to use for day labels. Defaults to `['', 'Mon', '', 'Web', '', 'Fri', '']`.

##### `fontColor`

Label font color. Defaults to `#333`.

##### `fontFamily`

Label font family. Defaults to `sans-serif`.

##### `fontSize`

Label font size. Defaults to `8`.

##### `emptyColor`

CSS color to use for cells with no value.

##### `monthGap`

Defines the space between months when `view` is set to `monthly`.

##### `monthLabelHeight`

Vertical space to allocate for month labels. If this is `0`, month labels will not be rendered.

##### `monthLabels`

Array of strings to use for month labels. Defaults to `['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']`.

##### `startDate`

Date object representing the first day of the graph. If omitted, this will default to the first day of the `month` or `year`, based on the current `view`.

##### `endDate`

Date object represending the last day of the graph. If omitted, this will default to the last day of the current `month` or `year`, depending on the current `view`.

##### `view`

Determines how the chart should be displayed. Supported values are `monthly` and `yearly`, defaults to `yearly`.

## License

[MIT](https://github.com/scottbedard/svelte-heatmap/blob/master/LICENSE)

Copyright (c) 2017-present, Scott Bedard
