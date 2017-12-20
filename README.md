# svelte-heatmap

[![build status](https://img.shields.io/circleci/project/github/scottbedard/svelte-heatmap.svg)](https://circleci.com/gh/scottbedard/svelte-heatmap)
[![coverage](https://img.shields.io/codecov/c/github/scottbedard/svelte-heatmap.svg)](https://codecov.io/gh/scottbedard/svelte-heatmap)
[![dev dependencies](https://img.shields.io/david/dev/scottbedard/svelte-heatmap.svg)](https://david-dm.org/scottbedard/svelte-heatmap?type=dev)
[![npm](https://img.shields.io/npm/v/svelte-heatmap.svg)](https://www.npmjs.com/package/svelte-heatmap)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/scottbedard/svelte-heatmap/blob/master/LICENSE)

### Demo

https://scottbedard.net/svelte-heatmap

<a href="https://scottbedard.net/svelte-heatmap">
    <img src="https://user-images.githubusercontent.com/7980426/33039711-1d483760-cdf6-11e7-83ca-cb4275edc314.png" alt="SvelteHeatmap" />
</a>

### Installation

The preferred way to install this package is through Yarn or NPM.

```bash
# install through yarn
yarn add svelte-heatmap

# or install through npm
npm install --save svelte-heatmap
```

Alternatively, you can simply reference it from a CDN.

```html
<!-- heatmap script -->
<script src="https://rawgit.com/scottbedard/svelte-heatmap/master/dist/heatmap.js"></script>

<!-- default styles -->
<link rel="stylesheet" href="https://rawgit.com/scottbedard/svelte-heatmap/master/dist/heatmap.css">
```

### Basic usage

To use the heatmap, simply instantiate one and mount it to a DOM element.

> **Note:** If you're using this from a CDN, use the global variable `SvelteHeatmap`.

```js
import SvelteHeatmap from 'svelte-heatmap';

new SvelteHeatmap({
    target: document.querySelector('#target'),
    data: {
        history: [
            { date: '2000/01/01', value: 5 },
        ],
        tooltip: (date, value) => `${value} contributions on ${date}`,
    },
});
```

### Custom colors

To define a set of custom colors, simply provide an array of css colors. The `emptyColor` property will be used for days with no value.

```js
new SvelteHeatmap({
    target: el,
    data: {
        colors: ['#c6e48b', '#7bc96f', '#239a3b', '#196127'],
        emptyColor: '#dddddd',
        history: [],
    },
});
```

Alternatively, you can calculate colors on the fly using the following options. Be aware when doing this, `lowColor` and `highColor` must be 6 digit hex values (ex: `#123456`).

```js
new SvelteHeatmap({
    target: el,
    data: {
        colors: 10, // <- number of colors to use
        lowColor: '#aaaaaa', // <- color for low values
        highColor: '#000000', // <- color for high values
        emptyColor: '#dddddd',
        history: [],
    },
});
```

### Legend

A legend can be enabled/disabled via the `showLegend` property. To customize the labels, set `legendLow` or `legendHigh` values.

```js
new SventeHeatmap({
    target: el,
    data: {
        history: [],
        showLegend: true,
        legendLow: 'Less',
        legendHigh: 'More',
    },
});
```
