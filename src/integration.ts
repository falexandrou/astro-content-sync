import * as fs from "node:fs";
import chokidar, { type FSWatcher } from "chokidar";

declare global {
  var watcher: FSWatcher;
}

export type Syncable = {
  /**
   * @description The path to the directory that will be watched for changes
   */
  sourcePath: string;

  /**
   * @description The path to the directory that the sourcePath will be synced to
   */
  targetPath: string;

  /**
   * @description List of glob patterns to be ignored by the integration
   */
  ignoredFiles?: string[];

  /**
   * @description Function to transform the path of the file before syncing
   * @param path The path of the file
   * @returns The transformed path
   */
  transform?: (path: string) => string;
};

export const createAstroContentSyncIntegration = (...inputs: Syncable[]) => {
  return {
    name: "astro-content-sync",
    hooks: {
      "astro:config:setup": ({ command }) => {
        if (command !== "dev") {
          console.warn("AstroContentSync is only available in in dev mode");
          return;
        }

        const validDirectories = inputs.filter((dir) => {
          const { sourcePath } = dir;
          const exists = fs.existsSync(sourcePath);

          if (!exists) {
            console.error(`Directory ${sourcePath} does not exist`);
          }

          return exists;
        });

        const watched: Map<string, Syncable> = new Map(
          validDirectories.map((dir) => [dir.sourcePath, dir]),
        );

        globalThis.watcher = chokidar.watch(Object.keys(watched));
      },
    },
  };
};
