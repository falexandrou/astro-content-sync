import chokidar, { type FSWatcher } from "chokidar";
import { copyDirectory, copyFile, removeDirectory, removeFile } from "./utils";
import { getSyncablesFromInputs } from "./syncable";
import type { AstroOptions, Syncable, SyncablesMap } from "./types";

declare global {
  var watcher: FSWatcher;
  namespace NodeJS {
    interface ProcessEnv {
      ASTRO_CONTENT_DIR?: string;
      ASTRO_CONTENT_IGNORED?: string;
    }
  }
}

export const createAstroContentSyncIntegration = (...inputs: (Syncable | string)[]) => {
  return {
    name: "astro-content-sync",
    hooks: {
      "astro:config:setup": ({ command, logger, config }) => {
        if (command !== "dev") {
          logger.warn("AstroContentSync is only available in in dev mode");
          return;
        }

        if (global.watcher) {
          logger.info("Watcher already initialized");
          return;
        }

        const options: AstroOptions = {
          srcDir: config.srcDir.patname,
          publicDir: config.publicDir.pathname,
        };

        const syncables = getSyncablesFromInputs(inputs, options, logger);
        const watched: Map<string, Syncable> = new Map(syncables.map((dir) => [dir.source, dir]));
        const watchedSources = Array.from(watched.keys());

        const isIgnored = (path: string) => (
          syncables.some((s) => (
            path.startsWith(s.source) && s.ignored?.some((i) => path.match(i))
          ))
        );

        const withSyncable = (path: string, callback: (syncable: Syncable) => void) => {
          const syncable = syncables.find((s) => path.startsWith(s.source));

          if (!syncable) {
            logger.warn(`Path ${path} is not watched, ignoring...`);
            return;
          }

          return callback(syncable);
        }

        globalThis.watcher = chokidar.watch(watchedSources, {
          ignored: (path) => {
            if (isIgnored(path)) {
              logger.info(`Path ${path} is ignored`);
              return true;
            }
            return false;
          },
        });

        const watcher = globalThis.watcher;
        watcher.on('add', (path) => withSyncable(path, (syncable) => copyFile(path, syncable, logger)));
        watcher.on('change', (path) => withSyncable(path, (syncable) => copyFile(path, syncable, logger)));
        watcher.on('unlink', (path) => withSyncable(path, (syncable) => removeFile(path, syncable, logger)));

        watcher.on('addDir', (path) => withSyncable(path, (syncable) => copyDirectory(path, syncable, logger)));
        watcher.on('unlinkDir', (path) => withSyncable(path, (syncable) => removeDirectory(path, syncable, logger)));

        logger.warn(
          `Watching the following for content changes...\n${watchedSources.map(p => `  ${p}`).join("\n")}\n`,
        );
      },
    },
  };
};
