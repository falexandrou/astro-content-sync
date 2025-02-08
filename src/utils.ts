import { join, basename, dirname } from 'node:path';
import { statSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';

import mime from 'mime';

import type { Syncable } from "./types";

const createDestinatioIfNotExists = (destination: string) => {
  if (!destination) {
    throw new Error('Target path is missing or invalid');
  }

  const stat = statSync(destination, { throwIfNoEntry: false });

  if (!stat?.isDirectory()) {
    mkdirSync(destination, { recursive: true });
  }

  return destination;
};

export const isMarkdown = (pathName: string) => (
  ['text/markdown', 'text/x-markdown', 'text/vnd.daringfireball.markdown'].includes(mime.getType(pathName))
);

export const getLinkedFiles = (source: string) => {
  const contents = readFileSync(source, 'utf-8');
  // get the files that are linked in the markdown file
};

export const copyFile = async (source: string, s: Syncable, logger: Console = console) => {
  const destination = join(s.target, basename(source));

  createDestinatioIfNotExists(s.target);
  copyFileSync(source, destination);
  logger.info(`Copied ${basename(source)} to ${dirname(destination)}`)
};

export const copyDirectory = async (source: string, s: Syncable, logger: Console = console) => {
};

export const removeFile = async (path: string, s: Syncable, logger: Console = console) => {
};

export const removeDirectory = async (path: string, s: Syncable, logger: Console = console) => {
};
