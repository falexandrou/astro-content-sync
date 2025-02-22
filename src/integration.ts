import chokidar, { type FSWatcher } from 'chokidar';
import { getLinkedFilesInMarkdown, isMarkdown } from './markdown';
import { getFilesInDirectory } from './filesystem';
import { getLinkedSyncable, getSyncablesFromInputs, SyncableFile, DEFAULT_ERROR_MESSAGE } from './syncable';
import type { AstroOptions, Syncable } from './types';

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
    name: 'astro-content-sync',
    hooks: {
      'astro:config:setup': ({ command, logger, config }) => {
        if (command !== 'dev') {
          logger.warn('AstroContentSync is only available in dev mode');
          return;
        }

        if (global.watcher) {
          logger.info('Watcher already initialized');
          return;
        }

        const options: AstroOptions = {
          srcDir: config.srcDir.pathname,
          publicDir: config.publicDir.pathname,
        };

        const syncables = getSyncablesFromInputs(inputs, options, logger);

        if (!syncables.length) {
          logger.error(DEFAULT_ERROR_MESSAGE);
          return [];
        }


        const watched: Map<string, Syncable> = new Map(syncables.map((dir) => [dir.source, dir]));
        const watchedSources = Array.from(watched.keys());

        const watcher = chokidar.watch(watchedSources, {
          ignored: (path) => {
            const isIgnored = syncables.some(
              (s) => path.startsWith(s.source) && s.ignored?.some((i) => path.match(i)),
            );

            if (isIgnored) {
              logger.info(`Path ${path} is ignored`);
              return true;
            }

            return false;
          },
        });

        const getSyncableFilesForFilePath = (path: string): SyncableFile[] => {
          const parentSyncable = syncables.find((s) => path.startsWith(s.source));

          if (!parentSyncable) {
            return [];
          }

          const syncableFiles: SyncableFile[] = [];

          // Get the SyncableFile for the path
          syncableFiles.push(new SyncableFile(path, parentSyncable.source, parentSyncable.target, logger));

          // Get the SyncableFiles for files linked in the content of the path
          if (isMarkdown(path)) {
            const linkedFiles = getLinkedFilesInMarkdown(path);

            for (const linked of linkedFiles) {
              syncableFiles.push(
                getLinkedSyncable(linked, parentSyncable, options, logger),
              );
            }
          }

          return syncableFiles;
        };

        const getSyncableFilesForDirectory = (directory: string) => {
          const syncable = syncables.find((s) => s.source.startsWith(directory));

          if (!syncable) {
            return [];
          }

          // Get the SyncableFiles for the directory
          return getFilesInDirectory(directory, path => isMarkdown(path))
            .flatMap((file) => getSyncableFilesForFilePath(file));
        };

        watcher.on('add', (path: string) =>
          getSyncableFilesForFilePath(path).map((syncableFile) => syncableFile.copy()),
        );
        watcher.on('change', (path: string) =>
          getSyncableFilesForFilePath(path).forEach((syncableFile) => syncableFile.copy()),
        );
        watcher.on('unlink', (path: string) =>
          getSyncableFilesForFilePath(path).forEach((syncableFile) => syncableFile.delete()),
        );

        watcher.on('addDir', (path: string) =>
          getSyncableFilesForDirectory(path).forEach((syncableFile) => syncableFile.copy()),
        );
        watcher.on('unlinkDir', (path: string) =>
          getSyncableFilesForDirectory(path).forEach((syncableFile) => syncableFile.delete()),
        );

        globalThis.watcher = watcher;

        logger.warn(
          `Watching the following for content changes...\n${watchedSources.map((p) => `  ${p}`).join('\n')}\n`,
        );
      },
    },
  };
};
