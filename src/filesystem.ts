import { statSync, mkdirSync, readdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'node:path/win32';

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

export const copyFile = async (source: string, destination: string) => {
  const destinationDir = dirname(destination);
  createDirectoryIfNotExists(destinationDir);
  copyFileSync(source, destination);
};

export const removeFile = async (file: string) => {
  unlinkSync(file);
};

export const resolveFilePath = (fileName: string) => {
  try {
    const resolvedPath = join(fileName);
    const stat = statSync(resolvedPath, { throwIfNoEntry: false });

    if (!stat?.isFile()) {
      return null;
    }

    return resolvedPath;
  } catch {
    return null;
  }
};
