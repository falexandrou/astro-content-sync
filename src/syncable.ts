import { existsSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import type { AstroOptions, Syncable } from "./types";

export const getNormalizedSyncable = (input: Syncable | string, defaults: AstroOptions): Syncable => {
  let syncable: Syncable = { source: '', target: '', ignored: [] };

  if (typeof input === 'string') {
    const [src, target] = input.split(':');

    if (!src) {
      throw new Error('Source path is missing');
    }

    return {
      ...syncable,
      source: src,
      target: target || joinPath(defaults.srcDir, 'content'),
    };
  }

  return {
    ...syncable,
    ...input,
  };
};

export const getSyncablesFromInputs = (inputs: (Syncable | string)[], options: AstroOptions, logger: Console): Syncable[] => {
  const syncables: Syncable[] = [];

  if (!inputs.length) {
    logger.error("Please provide at least one sync configuration or set the ASTRO_CONTENT_SRC environment variable");
    return [];
  }

  if (!inputs.length && process.env.ASTRO_CONTENT_SRC) {
    syncables.push(
      ...process.env.ASTRO_CONTENT_SRC.split(',').map((input) => getNormalizedSyncable(input, options)),
    );
  } else {
    syncables.push(
      ...inputs.map((input) => getNormalizedSyncable(input, options)),
    );
  }

  return syncables.filter((dir) => {
    const { source: sourcePath } = dir;
    const exists = existsSync(sourcePath);

    if (!exists) {
      logger.error(`Directory ${sourcePath} does not exist`);
    }

    return exists;
  });
};
