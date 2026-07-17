'use strict';

const fs = require('fs');
const path = require('path');

const [peoplePath, edgesPath, outputDirectory] = process.argv.slice(2);

if (!peoplePath || !edgesPath || !outputDirectory) {
  console.error('Usage: node scripts/bundle-genealogy-snapshot.js <people.json> <edges.json> <output-directory>');
  process.exit(2);
}

const peoplePayload = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
const edgesPayload = JSON.parse(fs.readFileSync(edgesPath, 'utf8'));
const people = Array.isArray(peoplePayload.data) ? peoplePayload.data : [];
const edges = Array.isArray(edgesPayload.data) ? edgesPayload.data : [];

if (people.length < 238 || edges.length < 9) {
  console.error(`Snapshot incomplete: people=${people.length}, edges=${edges.length}`);
  process.exit(1);
}

fs.mkdirSync(outputDirectory, { recursive: true });

const peopleContent =
  "import type { Person } from '../types';\n\n" +
  '// مولدة تلقائيًا من API شجرة النسب أثناء بناء APK.\n' +
  `export const bundledPeople = ${JSON.stringify(people, null, 2)} as unknown as Person[];\n`;

const edgesContent =
  "import type { ChartEdge } from '../types';\n\n" +
  '// مولدة تلقائيًا من API شجرة النسب أثناء بناء APK.\n' +
  `export const bundledEdges = ${JSON.stringify(edges, null, 2)} as unknown as ChartEdge[];\n`;

fs.writeFileSync(path.join(outputDirectory, 'bundledPeople.ts'), peopleContent);
fs.writeFileSync(path.join(outputDirectory, 'bundledEdges.ts'), edgesContent);

console.log(`Bundled snapshot: people=${people.length}, edges=${edges.length}`);
