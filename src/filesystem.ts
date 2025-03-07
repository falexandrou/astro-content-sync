import { join, dirname, isAbsolute, resolve } from 'node:path';
import { statSync, mkdirSync, readdirSync, copyFileSync, unlinkSync, readFileSync, writeFileSync } from 'node:fs';
import { isImage, isMarkdown, replaceContentLink } from './content';
import { OBSIDIAN_IMAGE_DIRS } from './constants';
import type { ContentLink } from './types';

export const normalizePath = (path: string, base = '') => (
  isAbsolute(path) ? path : join(base, path)
);

export const createDirectoryIfNotExists = (destination: string) => {
  if (!destination) {
    throw new Error('Target path is missing or invalid');
  }

  const stat = statSync(destination, { throwIfNoEntry: false });

  if (!stat?.isDirectory()) {
    mkdirSync(destination, { recursive: true });
  }

  return destination;
};

export const getFilesInDirectory = (source: string, matcher: (name: string) => boolean): string[] => {
  const matchingFiles = [];

  // get the files in directory with the specified extension, recursivel
  const dirents = readdirSync(source, { withFileTypes: true });

  for (const dirent of dirents) {
    const filePath = join(source, dirent.name);

    if (dirent.isDirectory()) {
      matchingFiles.push(...getFilesInDirectory(filePath, matcher));
    } else if (matcher(filePath)) {
      matchingFiles.push(filePath);
    }
  }

  return matchingFiles;
};

export const copyFile = async (source: string, destination: string, links: ContentLink[] = []) => {
  const destinationDir = dirname(destination);
  createDirectoryIfNotExists(destinationDir);

  if (isMarkdown(source)) {
    let content = readFileSync(source, 'utf-8').toString();

    for (const link of links) {
      content = replaceContentLink(content, link);
    }

    writeFileSync(destination, content);
  } else {
    copyFileSync(source, destination);
  }
};

export const removeFile = async (file: string) => {
  unlinkSync(file);
};

const resolveAbsolutePath = (fileName: string, baseDir = ''): string | null => {
  try {
    const stat = statSync(join(baseDir, fileName), { throwIfNoEntry: false });

    if (!stat?.isFile()) {
      return null;
    }

    return resolve(normalizePath(fileName, baseDir));
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const resolveFilePath = (fileName: string, baseDir = ''): string | null => {
  const resolved = resolveAbsolutePath(fileName, baseDir);

  if (!isImage(fileName) || resolved) {
    return resolved;
  }

  // We're looking for an image file that wasn't resolved, we need to attempt lookign into the obsidian image directories
  const attempts = OBSIDIAN_IMAGE_DIRS.map(dirName => resolveAbsolutePath(fileName, join(baseDir, dirName)));
  return attempts.find(Boolean) ?? null;
};
