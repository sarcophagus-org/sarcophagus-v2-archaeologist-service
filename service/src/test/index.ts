import * as evnValidation from './env_validation'
import * as nodeStart from './node_start'

await evnValidation.runTests();
await nodeStart.runTests();