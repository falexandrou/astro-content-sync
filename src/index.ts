import {
  type Syncable,
  createAstroContentSyncIntegration,
} from "./integration";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ASTRO_CONTENT_SYNC_SOURCE_PATH?: string;
      ASTRO_CONTENT_SYNC_TARGET_PATH?: string;
      ASTRO_CONTENT_SYNC_IGNORED_FILES?: string;
    }
  }
}

export default (...inputs: Syncable[]) => {
  if (
    !inputs.length &&
    process.env.ASTRO_CONTENT_SYNC_SOURCE_PATH &&
    process.env.ASTRO_CONTENT_SYNC_TARGET_PATH
  ) {
    const syncable: Syncable = {
      sourcePath: process.env.ASTRO_CONTENT_SYNC_SOURCE_PATH,
      targetPath: process.env.ASTRO_CONTENT_SYNC_TARGET_PATH,
    };

    if (process.env.ASTRO_CONTENT_SYNC_IGNORED_FILES) {
      syncable.ignoredFiles =
        process.env.ASTRO_CONTENT_SYNC_IGNORED_FILES.split(",").map((s) =>
          s.trim(),
        );
    }

    inputs.push(syncable);
  }

  if (!inputs.length) {
    console.error(
      "Please provide at least one sync configuration or set the ASTRO_CONTENT_SYNC_SOURCE_PATH and ASTRO_CONTENT_SYNC_TARGET_PATH environment variables",
    );

    return;
  }

  return createAstroContentSyncIntegration(...inputs);
};
