// Fails when a built page shows an admonition fence (`:::`) as text, which is
// what happens to an admonition the Markdown parser did not recognise.
// Code blocks and inline code are skipped: pages may show the syntax there.
// Run after `docusaurus build`; checks every version and locale in build/.
import {readdir, readFile} from 'node:fs/promises';
import {join, relative} from 'node:path';

const buildDir = new URL('../build/', import.meta.url).pathname;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* htmlFiles(path);
    } else if (entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

function visibleText(html) {
  return html
    .replace(/<(script|style|pre|code)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
}

let pages = 0;
const failures = [];
for await (const file of htmlFiles(buildDir)) {
  pages++;
  const text = visibleText(await readFile(file, 'utf8'));
  const at = text.indexOf(':::');
  if (at !== -1) {
    const context = text
      .slice(Math.max(0, at - 40), at + 60)
      .replace(/\s+/g, ' ')
      .trim();
    failures.push(`${relative(buildDir, file)}: …${context}…`);
  }
}

if (pages === 0) {
  console.error('check-admonitions: no HTML in build/; run the build first');
  process.exit(1);
}
if (failures.length > 0) {
  console.error(
    `check-admonitions: ${failures.length} page(s) show a literal ":::" (an admonition that did not render):`,
  );
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.warn(`check-admonitions: ${pages} pages, no unrendered admonitions`);
