import { createAstroContentSyncIntegration } from "./integration";
import type { Syncable } from "./types";

export default (...inputs: (Syncable | string)[]) => (
  createAstroContentSyncIntegration(...inputs)
);
