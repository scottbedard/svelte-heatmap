import pkg from './package.json';
import resolve from '@rollup/plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import { terser } from "rollup-plugin-terser";

const name = 'SvelteHeatmap';

export default {
    input: 'src/index.js',
    output: [
        {
            file: `dist/index.cjs.js`,
            format: 'cjs',
        },
        {
            file: `dist/index.esm.js`,
            format: 'es',
        },
        {
            file: `dist/index.umd.js`,
            format: 'umd',
            name,
        },
        {
            file: `dist/index.umd.min.js`,
            format: 'umd',
            name,
            plugins: [
                terser(),
            ],
        },
    ],
    plugins: [
        svelte(),
        resolve(),
    ],
};
