import { existsSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { copyFile, removeFile } from './filesystem';
import type { AstroOptions, Syncable } from "./types";
import { isMarkdown } from './markdown';

export const getNormalizedSyncable = (input: Syncable | string, defaults: AstroOptions): Syncable => {
  let syncable: Syncable = {
    source: '',
    target: '',
    ignored: [],
  };

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

export class SyncableFile {
  /**
    * @description The path to the source file
   */
  sourceFile: string;

  /**
   * @description The path to the target file
   */
  targetFile: string;

  /**
   * @description The logger instance
   */
  private logger: Console;

  /**
   * @description The path to the directory that the source file is in
   */
  private targetDir: string;

  constructor(fileName: string, sourceDir: string, targetDir: string, logger: Console = console) {
    this.sourceFile = fileName;
    this.targetDir = targetDir;

    const relativeFileName = fileName.replace(sourceDir, '');
    this.targetFile = joinPath(targetDir, relativeFileName);

    this.logger = logger;
  }

  /**
   * @description Copy the file to the target directory
   */
  copy() {
    try {
      copyFile(this.sourceFile, this.targetFile);
      this.logger.info(`Copied ${this.sourceFile} into ${this.targetDir}`);
    } catch (err) {
      this.logger.error(`Failed to copy ${this.sourceFile} to ${this.targetFile}`);
      this.logger.error(err);
    }
  }

  /**
   * @description Delete the file from the target directory
   */
  delete() {
    removeFile(this.targetFile);
    this.logger.info(`Deleted ${this.targetFile}`);
  }
}

export const getLinkedSyncable = (fileName: string, parent: Syncable, options: AstroOptions) => {
  const targetDir = isMarkdown(fileName) ? parent.target : options.publicDir;
  const relativePath = fileName.replace(parent.source, '');

  const targetFile = joinPath(targetDir, relativePath);
  return new SyncableFile(fileName, parent.source, targetFile);
};
