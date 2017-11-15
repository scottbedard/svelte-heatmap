import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import istanbul from 'rollup-plugin-istanbul';
import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';

const plugins = [
	svelte({
		css: function (css) {
			css.write('dist/heatmap.css');
		},
		include: './src/**/*.html',
	}),
	babel({
		exclude: 'node_modules/**',
		include: './src/**/*.js',
		plugins: ['external-helpers'],
	}),
];

if (process.env.NODE_ENV === 'test') {
	plugins.push(istanbul({
        exclude: [
            'test/**/*',
            'node_modules/**/*',
        ] ,
    }));
}

export default [
	// Browser friendly UMD build.
	{
		input: 'src/main.js',
		output: {
			file: pkg.browser,
			format: 'umd',
		},
		name: 'SvelteHeatmap',
		plugins: [
			resolve(),
			commonjs(),
		].concat(plugins),
	},

	// CommonJS (for Node) and ES module (for bundlers) build
	{
		input: 'src/main.js',
		external: ['ms'],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		],
        plugins: plugins,
	}
];
