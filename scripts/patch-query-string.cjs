// Expo Router 57 uses query-string 7 (CommonJS). The fixed decoder 0.5.1
// exports an ES module default. Adapt only this import, never its algorithm.
const fs = require('node:fs');
const path = require('node:path');
const filename = require.resolve('query-string');
const metadata = require(path.join(path.dirname(filename), 'package.json'));
if (metadata.version !== '7.1.3') throw new Error('Reevaluate decoder interoperability after query-string upgrade');
const original = "const decodeComponent = require('decode-uri-component');";
const patched = "const decodeComponent = require('decode-uri-component').default;";
const source = fs.readFileSync(filename, 'utf8');
if (source.includes(patched)) {
  console.log('query-string decoder interoperability already applied');
} else {
  if (source.split(original).length !== 2) throw new Error('Unexpected query-string source; refusing patch');
  fs.writeFileSync(filename, source.replace(original, patched));
  console.log('query-string: official decoder 0.5.1 default export connected');
}
