import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { resolveFilePath } from './filesystem';

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
  const baseDir = dirname(source);

  // Regular expressions for markdown links & images
  const mdLinkOrImageRegex = /!\[([^\]]*)\]\(([^)]+)(\s[^)]+)\)/g;

  // Regular expressions for HTML elements with links/sources
  const htmlRegex = /<(?:a|img|video|audio|source|iframe)\s+[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null = null;
  const links = new Set<string>();
  const matchers: [RegExp, number][] = [
    [mdLinkOrImageRegex, 2],
    [htmlRegex, 1],
  ];

  for (const [regex, matchIndex] of matchers) {
    while ((match = regex.exec(contents)) !== null) {
      if (isRelativeLink(match[matchIndex])) {
        links.add(match[matchIndex]);
      }
    }
  }

  return Array.from(links)
    .map((link) => resolveFilePath(link, baseDir))
    .filter(Boolean);
};
