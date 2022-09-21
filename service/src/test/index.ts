import path from 'path';
import { fileURLToPath } from 'url';
import { TestSuite } from './utils';

const cwd = path.dirname(fileURLToPath(import.meta.url));
console.log(cwd);

const suite = new TestSuite(cwd);
await suite.expectOutput('arch started with id: LAYgss', { sourceFile: '../index.js', timeout: 3000 });