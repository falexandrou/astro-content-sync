import chokidar, { type FSWatcher } from 'chokidar';
import { getLinkedFilesInMarkdown, getTargetPath, getUrlForFile, isImage, isMarkdown } from './content';
import { copyFile, getFilesInDirectory, removeFile, resolveFilePath } from './filesystem';
import { getSyncablesFromInputs, DEFAULT_ERROR_MESSAGE } from './syncable';
import type { AstroOptions, ContentLink, Syncable } from './types';

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
          rootDir: config.root.pathname,
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

        const handleFileUpdate = (path: string) => {
          const syncable = syncables.find((s) => path.startsWith(s.source));
          const targetPath = getTargetPath(path, syncable, options);
          const linkUrls: ContentLink[] = [];

          if (!isMarkdown(path)) {
            return;
          }

          copyFile(path, targetPath, linkUrls);

          const linkedFiles = getLinkedFilesInMarkdown(path);

          for (const linked of linkedFiles) {
            const targetLinked = getTargetPath(linked, syncable, options);

            linkUrls.push({ source: linked, url: getUrlForFile(linked, syncable, options) });

            const sourcePath = isImage(linked)
              ? resolveFilePath(linked, syncable.source)
              : resolveFilePath(linked, syncable.source);

            if (!sourcePath) {
              logger.warn(`Could not resolve ${linked} mentioned in ${path}`);
              continue;
            }

            copyFile(sourcePath, targetLinked);
          }

          logger.info(`Copied ${path} to ${targetPath}`);
        };

        const handleFileDeletion = (path: string) => {
          const targetPath = getTargetPath(path, syncables.find((s) => path.startsWith(s.source)), options);

          removeFile(targetPath);
          logger.info(`Removed ${targetPath}`);
        };

        const handleDirectoryUpdate = (directory: string) => {
          const markdownFiles = getFilesInDirectory(directory, path => isMarkdown(path));

          for (const path of markdownFiles) {
            handleFileUpdate(path);
          }
        };

        watcher.on('add', handleFileUpdate);
        watcher.on('change', handleFileUpdate);
        watcher.on('unlink', handleFileDeletion);
        watcher.on('addDir', handleDirectoryUpdate);

        globalThis.watcher = watcher;

        logger.warn(
          `Watching the following for content changes...\n${watchedSources.map((p) => `  ${p}`).join('\n')}\n`,
        );
      },
    },
  };
};
