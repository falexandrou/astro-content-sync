import { readFileSync } from 'node:fs';
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

  // Regular expressions for markdown links
  const mdLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  // Regular expressions for HTML elements with links/sources
  const htmlRegex = /<(?:a|img|video|audio|source|iframe)\s+[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null = null;
  const links = new Set<string>();
  const matchers: [RegExp, number][] = [
    [mdLinkRegex, 2],
    [mdImageRegex, 2],
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
    .map((link) => resolveFilePath(link))
    .filter(Boolean);
};
