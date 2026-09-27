// Construit la maquette 3D autonome : un seul fichier HTML, three.js embarqué.
//   npm install && npm run build
// Produit ../maison-303-3d.html (page complète, fonctionne hors ligne).
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const res = await build({
  entryPoints: [join(here, 'src/main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  legalComments: 'none',
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const body = readFileSync(join(here, 'src/page.html'), 'utf8')
  .replace('<!--APP_SCRIPT-->', () => `<script>\n${js}</script>`);

const full = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(here, '..', 'maison-303-3d.html'), full);
if (process.argv.includes('--fragment')) {
  // variante sans squelette (publication en Artifact)
  writeFileSync(process.argv[process.argv.indexOf('--fragment') + 1], body);
}
console.log('OK', (full.length / 1024).toFixed(0) + ' kB');
