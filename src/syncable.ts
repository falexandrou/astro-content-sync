import { existsSync } from 'node:fs';
import { join as joinPath, delimiter as PATH_DELIMITER } from 'node:path';
import { normalizePath } from './filesystem';
import type { AstroOptions, Syncable } from "./types";
import { isMarkdown } from './content';

export const DEFAULT_ERROR_MESSAGE = 'Please provide at least one sync configuration or set the ASTRO_CONTENT_SYNC environment variable';
export const SOURCE_PATH_EMPTY_MESSAGE = 'Source path is empty';
export const DIRECTORY_NOT_FOUND_ERROR = 'Directory does not exist';

export const getNormalizedSyncable = (input: Syncable | string, options: AstroOptions, logger: Console): Syncable => {
  let sourcePath = '';
  let targetPath = '';
  let ignored: string[] = [];

  if (typeof input === 'string') {
    ([sourcePath, targetPath] = input.split(PATH_DELIMITER));
  } else {
    sourcePath = input.source;
    targetPath = input.target || joinPath(options.srcDir, 'content');
    ignored = input.ignored || [];
  }

  if (!sourcePath) {
    logger.error(SOURCE_PATH_EMPTY_MESSAGE);
    return null;
  }

  return {
    source: normalizePath(sourcePath),
    target: normalizePath(targetPath, options.rootDir),
    ignored
  };
};

export const getSyncablesFromInputs = (inputs: (Syncable | string)[], options: AstroOptions, logger: Console): Syncable[] => {
  const syncables: Syncable[] = [];

  if (!inputs.length && process.env.ASTRO_CONTENT_SYNC) {
    const envSyncables = process.env.ASTRO_CONTENT_SYNC.split(',');
    syncables.push(
      ...envSyncables.map((input) => getNormalizedSyncable(input, options, logger)).filter(Boolean),
    );
  } else if (inputs.length) {
    syncables.push(
      ...inputs.map((input) => getNormalizedSyncable(input, options, logger)).filter(Boolean),
    );
  }

  return syncables.filter((dir) => {
    const { source: sourcePath } = dir;
    const exists = existsSync(sourcePath);

    if (!sourcePath) {
      logger.error(SOURCE_PATH_EMPTY_MESSAGE);
    } else if (!exists) {
      logger.error(DIRECTORY_NOT_FOUND_ERROR, sourcePath);
    }

    return sourcePath && exists;
  });
};
