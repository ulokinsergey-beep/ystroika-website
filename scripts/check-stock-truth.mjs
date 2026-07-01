// Source/dist-guard честности наличия. Запуск: node scripts/check-stock-truth.mjs  (exit 1 при нарушении)
//
// Правила:
//  1) В .astro-компонентах НЕТ литерала «В наличии» — вся подпись идёт через resolveAvailability()
//     из src/lib/availability.mjs (единственный источник).
//  2) В собранном dist/**/*.html «В наличии» допускается ТОЛЬКО на страницах услуг (dist/uslugi/*),
//     где это подтверждено editorial-полем stock:'in'. В каталоге, на главной и где-либо ещё — запрещено.
//
// Ловит и хитрые варианты написания: неразрывный пробел (&nbsp; /   / &#160; / &#xa0;).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');
const distDir = join(root, 'dist');
const NEEDLE = /В[\s ]*наличии/;              // «В наличии» с любым пробелом/nbsp
const norm = (s) => s.replace(/&nbsp;|&#160;|&#xa0;|&#xA0;| /g, ' ');

function walk(dir, ext) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    (statSync(p).isDirectory() ? out.push(...walk(p, ext)) : (name.endsWith(ext) && out.push(p)));
  }
  return out;
}

const problems = [];

// 1) Единый источник обязан существовать и содержать подпись.
const helper = readFileSync(join(srcDir, 'lib', 'availability.mjs'), 'utf8');
if (!NEEDLE.test(norm(helper))) problems.push('src/lib/availability.mjs не содержит подпись «В наличии» (единый источник сломан).');

// 2) .astro-исходники — 0 литералов «В наличии».
for (const file of walk(srcDir, '.astro')) {
  norm(readFileSync(file, 'utf8')).split(/\r?\n/).forEach((line, i) => {
    if (NEEDLE.test(line)) problems.push(`${relative(root, file)}:${i + 1}: литерал «В наличии» в .astro (нужно через resolveAvailability())`);
  });
}

// 3) dist HTML — «В наличии» только под uslugi/.
if (existsSync(distDir)) {
  for (const file of walk(distDir, '.html')) {
    const rel = relative(root, file);
    const underUslugi = rel.split(sep).includes('uslugi');
    if (!underUslugi && NEEDLE.test(norm(readFileSync(file, 'utf8')))) {
      problems.push(`${rel}: «В наличии» в собранном HTML вне uslugi (ложное наличие без данных)`);
    }
  }
} else {
  console.log('note: dist не найден — пропускаю проверку собранного HTML (запусти после npm run build).');
}

if (problems.length) {
  console.error(`FAIL: нарушений честности наличия — ${problems.length}:`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('OK: «В наличии» — только через resolveAvailability() и только на страницах услуг (editorial). Каталог/главная чисты.');
