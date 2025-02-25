import { join, dirname, isAbsolute } from 'node:path';
import { statSync, mkdirSync, readdirSync, copyFileSync, unlinkSync, readFileSync, writeFileSync, link } from 'node:fs';
import { isMarkdown, replaceLinkedFile } from './markdown';

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

export const copyFile = async (source: string, destination: string, linkedFiles: string[] = []) => {
  const destinationDir = dirname(destination);
  createDirectoryIfNotExists(destinationDir);

  if (isMarkdown(source)) {
    let content = readFileSync(source, 'utf-8').toString();

    for (const linked of linkedFiles) {
      content = replaceLinkedFile(content, linked);
    }

    writeFileSync(destination, content);
  } else {
    copyFileSync(source, destination);
  }
};

export const removeFile = async (file: string) => {
  unlinkSync(file);
};

export const resolveFilePath = (fileName: string, baseDir = '') => {
  try {
    const stat = statSync(join(baseDir, fileName), { throwIfNoEntry: false });

    if (!stat?.isFile()) {
      return null;
    }

    return normalizePath(fileName, baseDir);
  } catch (err) {
    console.error(err);
    return null;
  }
};
