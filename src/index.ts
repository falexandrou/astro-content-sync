import { createAstroContentSyncIntegration } from "./integration.js";
import type { Syncable } from "./types";

export default (...inputs: (Syncable | string)[]) => (
  createAstroContentSyncIntegration(...inputs)
);
