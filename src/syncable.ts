import { existsSync } from 'node:fs';
import { join as joinPath, delimiter as PATH_DELIMITER } from 'node:path';
import { copyFile, removeFile } from './filesystem';
import { isMarkdown } from './markdown';
import type { AstroOptions, Syncable } from "./types";

export const SOURCE_PATH_EMPTY_MESSAGE = 'Source path is empty';
export const DEFAULT_ERROR_MESSAGE = 'Please provide at least one sync configuration or set the ASTRO_CONTENT_SYNC environment variable';
export const DIRECTORY_NOT_FOUND_ERROR = 'Directory does not exist';

export const getNormalizedSyncable = (input: Syncable | string, defaults: AstroOptions, logger: Console): Syncable => {
  let syncable: Syncable = {
    source: '',
    target: '',
    ignored: [],
  };

  if (typeof input === 'string') {
    const [src, target] = input.split(PATH_DELIMITER);

    if (!src) {
      logger.error(SOURCE_PATH_EMPTY_MESSAGE);
      return null;
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

  if (!inputs.length && process.env.ASTRO_CONTENT_SYNC) {
    syncables.push(
      ...process.env.ASTRO_CONTENT_SYNC.split(',').map((input) => getNormalizedSyncable(input, options, logger)).filter(Boolean),
    );
  } else if (inputs.length) {
    syncables.push(
      ...inputs.map((input) => getNormalizedSyncable(input, options, logger)).filter(Boolean),
    );
  }

  if (!syncables.length) {
    logger.error(DEFAULT_ERROR_MESSAGE);
    return [];
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
