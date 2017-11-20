# svelte-heatmap

[![build status](https://img.shields.io/circleci/project/github/scottbedard/svelte-heatmap.svg)](https://circleci.com/gh/scottbedard/svelte-heatmap)
[![coverage](https://img.shields.io/codecov/c/github/scottbedard/svelte-heatmap.svg)](https://codecov.io/gh/scottbedard/svelte-heatmap)
[![npm](https://img.shields.io/npm/v/svelte-heatmap.svg)](https://www.npmjs.com/package/svelte-heatmap)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/scottbedard/svelte-heatmap/blob/master/LICENSE)

### Demo

https://scottbedard.net/svelte-heatmap

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
