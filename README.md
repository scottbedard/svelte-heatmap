# svelte-heatmap

[![Netlify](https://img.shields.io/netlify/4d4e781f-f953-4b8a-92c8-ad4ba986236e)](https://svelte-heatmap.netlify.app/)
[![Build status](https://img.shields.io/github/workflow/status/scottbedard/svelte-heatmap/Test)](https://github.com/scottbedard/svelte-heatmap/actions)
[![Dependencies](https://img.shields.io/david/scottbedard/svelte-heatmap)](https://david-dm.org/scottbedard/svelte-heatmap)
[![Dev dependencies](https://img.shields.io/david/dev/scottbedard/svelte-heatmap)](https://david-dm.org/scottbedard/svelte-heatmap?type=dev)
[![Size](https://img.shields.io/bundlephobia/minzip/svelte-heatmap?color=yellow&label=size)](https://bundlephobia.com/result?p=svelte-heatmap)
[![NPM](https://img.shields.io/npm/v/svelte-heatmap)](https://www.npmjs.com/package/svelte-heatmap)
[![License](https://img.shields.io/github/license/scottbedard/svelte-heatmap?color=blue)](https://github.com/scottbedard/svelte-heatmap/blob/master/LICENSE)

A light weight and customizable version of GitHub's contribution graph.

[![Heatmap examples](https://user-images.githubusercontent.com/7980426/78958159-27d55280-7a9c-11ea-9b08-8b5d7df31d7a.png)](https://svelte-heatmap.netlify.app/)

## 📦 Installation

The recommended way to install this package is through NPM.

```bash
npm install svelte-heatmap
```

Alternatively, you may access it via the CDN. When using the CDN, this package will be exposed globally as `SvelteHeatmap`.

```html
<script src="https://unpkg.com/svelte-heatmap"></script>
```

## 🚀 Basic usage

To create a heatmap, pass `props` and a `target` to the `SvelteHeatmap` constructor.

```js
import SvelteHeatmap from 'svelte-heatmap';

const heatmap = new SvelteHeatmap({
    props: {
        data: [
            // ...
        ],
    },
    target: '#some-container',
});
```

To remove the component, call `$destroy`.

```js
heatmap.$destroy();
```

See the [Svelte documentation](https://svelte.dev/docs#Client-side_component_API) for more information. 

## ⚙️ Options

> **Note:** Date values for `data`, `startDate`, and `endDate` should be [JavaScript `Date` objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects, or a value compatible with the Date constructor.

##### `allowOverflow`

Renders cells that fall outside the `startDate` to `endDate` range. Defaults to `false`.

##### `cellGap`

Defines the space between cells.

##### `cellRadius`

Defines the radius of each cell. This should be a number relative to the `cellSize`, or a string representing a percentage such as `'50%'`.

##### `cellSize`

Defines the size of each cell.

##### `colors`

Array of CSS colors to use for the chart, ordered from lowest to highest. Default colors match GitHub's contribution graph with `['#c6e48b', '#7bc96f', '#239a3b', '#196127']`.

##### `data`

Array of objects containing the chart data. These objects should be in the shape of `{ date, value }`.

##### `dayLabelWidth`

Horizontal space to allocate for day labels. If this is `0`, day labels will not be rendered.

##### `dayLabels`

Array of strings to use for day labels. Defaults to `['', 'Mon', '', 'Wed', '', 'Fri', '']`.

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

## 📄 License

[MIT](https://github.com/scottbedard/svelte-heatmap/blob/master/LICENSE)

Copyright (c) 2017-present, Scott Bedard
