import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AstroOptions, ContentLink, Syncable } from './types.d.ts';
import { IMAGE_EXTENSIONS, MARKDOWN_EXTENSIONS } from './constants.js';

export const isImage = (pathName: string) => {
  return IMAGE_EXTENSIONS.some((ext) => pathName.endsWith(ext));
}

export const isMarkdown = (pathName: string) => {
  return MARKDOWN_EXTENSIONS.some((ext) => pathName.endsWith(ext))
};

const isRelativeLink = (path: string) => (
  !path.startsWith('http')
);

export const getLinkedFilesInMarkdown = (source: string) => {
  const contents = readFileSync(source, 'utf-8');

  // Regular expressions for markdown links & images
  const mdImageRegex = /!\[\[([^\]]+)\]\]/g;
  const mdLinkRegex = /!?\[([^\]]*)\]\(([^)]+)(\s?[^)]+)?\)/g;

  // Regular expressions for HTML elements with links/sources
  const htmlRegex = /<(?:a|img|video|audio|source|iframe)\s+[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null = null;
  const links = new Set<string>();
  const matchers: [RegExp, number][] = [
    [mdLinkRegex, 2],
    [mdImageRegex, 1],
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

  return isMarkdown(relativePath)
    ? join(syncable.target ?? options.rootDir, relativePath)
    : join(options.publicDir, relativePath);
};

export const getUrlForFile = (relativePath: string, syncable: Syncable, options: AstroOptions): string => {
  let relativeUri = relativePath;

  if (isMarkdown(relativePath)) {
    relativeUri = getTargetPath(relativePath, syncable, options)
      .replace(join(options.srcDir, 'content'), '')
      .replace(new RegExp(`^\/(.*)${MARKDOWN_EXTENSIONS.join('|')}$`, 'gi'), '$1');
  }

  return `/${relativeUri}`;
};
