import { readFileSync } from 'node:fs';
import type { AstroOptions, ContentLink, Syncable } from './types';
import { join } from 'node:path';

const MARKDOWN_EXTENSIONS = [
  '.md',
  '.mkd',
  '.mdwn',
  '.mdown',
  '.mdtxt',
  '.mdtext',
  '.markdown',
  '.text',
];

export const isMarkdown = (pathName: string) => (
  MARKDOWN_EXTENSIONS.some((ext) => pathName.endsWith(ext))
);

const isRelativeLink = (path: string) => (
  !path.startsWith('http')
);

export const getLinkedFilesInMarkdown = (source: string) => {
  const contents = readFileSync(source, 'utf-8');

  // Regular expressions for markdown links & images
  const mdLinkOrImageRegex = /!?\[([^\]]*)\]\(([^)]+)(\s[^)]+)?\)/g;

  // Regular expressions for HTML elements with links/sources
  const htmlRegex = /<(?:a|img|video|audio|source|iframe)\s+[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null = null;
  const links = new Set<string>();
  const matchers: [RegExp, number][] = [
    [mdLinkOrImageRegex, 2],
    [htmlRegex, 1],
  ];

  for (const [regex, matchIndex] of matchers) {
    // biome-ignore lint/suspicious/noAssignInExpressions:
    while ((match = regex.exec(contents)) !== null) {
      if (isRelativeLink(match[matchIndex])) {
        links.add(match[matchIndex]);
      }
    }
  }

  return Array.from(links).filter(Boolean);
};

export const replaceContentLink = (content: string, link: ContentLink) => {
  const reg = new RegExp(`(${link.source}(\s[^\)]+)?)`, 'gi');
  return content.replace(reg, link.url);
};

export const getTargetPath = (path: string, syncable: Syncable, options: AstroOptions) => {
  const relativePath = path.replace(syncable.source, '').replace(/^\/?(.*)\/?$/gi, '$1');

  return isMarkdown(path)
    ? join(syncable.target ?? options.rootDir, relativePath)
    : join(options.publicDir, relativePath);
};

export const getUrlForFile = (relativePath: string, syncable: Syncable, options: AstroOptions): string => {
  let relativeUri = relativePath;

  if (isMarkdown(relativePath)) {
    relativeUri = getTargetPath(relativePath, syncable, options)
      .replace(join(options.srcDir, 'content'), '')
      .replace(/\/(.*)\.md$/gi, '$1');
  }

  return `/${relativeUri}`;
};
