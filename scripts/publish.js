const consola = require('consola');
const exec = require('child_process').execSync;
const path = require('path');
const pkg = require('../package.json');

const distDir = path.resolve(__dirname, '..', 'dist');

async function cli() {
    exec('npm publish --access public', { cwd: distDir, stdio: 'inherit' });
    consola.success(`Published svelte-heatmap ${pkg.version}`);
}

if (require.main === module) {
    cli();
}