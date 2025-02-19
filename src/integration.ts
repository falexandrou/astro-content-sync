import chokidar, { type FSWatcher } from "chokidar";
import { getSyncablesFromInputs, SyncableFile } from "./syncable";
import { getLinkedFilesInMarkdown, isMarkdown } from "./markdown";
import { getFilesInDirectory } from "./filesystem";
import type { AstroOptions, Syncable } from "./types";

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

        globalThis.watcher = chokidar.watch(watchedSources, {
          ignored: (path) => {
            const isIgnored = syncables.some((s) => (
              path.startsWith(s.source) && s.ignored?.some((i) => path.match(i))
            ));

            if (isIgnored) {
              logger.info(`Path ${path} is ignored`);
              return true;
            }

            return false;
          },
        });

        const watcher = globalThis.watcher;

        const getSyncableFilesForFilePath = (path: string): SyncableFile[] => {
          const syncable = syncables.find((s) => path.startsWith(s.source));

          if (!syncable) {
            return [];
          }

          const syncableFiles: SyncableFile[] = [];

          // Get the SyncableFile for the path
          syncableFiles.push(new SyncableFile(path, syncable.source, syncable.target, logger));

          // Get the SyncableFiles for files linked in the content of the path
          if (isMarkdown(path)) {
            getLinkedFilesInMarkdown(path).forEach((linkedFile) => (
              syncableFiles.push(
                new SyncableFile(linkedFile, syncable.source, syncable.target, logger),
              )
            ));
          }

          return syncableFiles;
        };

        const getSyncableFilesForDirectory = (directory: string) => {
          const syncable = syncables.find((s) => s.source.startsWith(directory));

          if (!syncable) {
            return [];
          }

          // Get the SyncableFiles for the directory
          return syncable.mimeTypes.map(
            mimeType => getFilesInDirectory(directory, mimeType).map(
              (file) => new SyncableFile(file, syncable.source, syncable.target, logger),
            )
          ).flat();
        };

        watcher.on('add', (path) => getSyncableFilesForFilePath(path).map((syncableFile) => syncableFile.copy()));
        watcher.on('change', (path) => getSyncableFilesForFilePath(path).forEach((syncableFile) => syncableFile.copy()));
        watcher.on('unlink', (path) => getSyncableFilesForFilePath(path).forEach((syncableFile) => syncableFile.delete()));

        watcher.on('addDir', (path) => getSyncableFilesForDirectory(path).forEach((syncableFile) => syncableFile.copy()));
        watcher.on('unlinkDir', (path) => getSyncableFilesForDirectory(path).forEach((syncableFile) => syncableFile.delete()));

        logger.warn(
          `Watching the following for content changes...\n${watchedSources.map(p => `  ${p}`).join("\n")}\n`,
        );
      },
    },
  };
};
