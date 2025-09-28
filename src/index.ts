import { createAstroContentSyncIntegration } from "./integration.js";
import type { Syncable } from "./types.d.ts";

export default (...inputs: (Syncable | string)[]) => (
  createAstroContentSyncIntegration(...inputs)
);
