import { exit } from 'process';
import * as envValidation from './env_validation'
import * as nodeStart from './node_start'

await envValidation.runTests();
await nodeStart.runTests();

exit(0);