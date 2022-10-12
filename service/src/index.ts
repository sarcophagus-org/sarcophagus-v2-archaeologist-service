import { startService } from "./start_service";

await startService({ nodeName: "arch" });
export { logProfile } from "./cli/utils";
export { objectDashToCamelCase } from "./cli/utils";
export { dashToCamelCase } from "./cli/utils";