import { markdownWithLinks } from './fixtures';

describe('getLinkedFilesInMarkdown', () => {
  beforeAll(() => {
    jest.mock('node:fs', () => {
      return {
        ...jest.requireActual('node:fs'),
        readFileSync: jest.fn().mockReturnValue(markdownWithLinks),
        statSync: jest.fn().mockReturnValue({ isFile: () => true }),
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns the files linked in markdown content', () => {
    const { getLinkedFilesInMarkdown } = require('../src/markdown');

    const linkedFiles = getLinkedFilesInMarkdown('file.md');
    expect(linkedFiles).toEqual([
      `${process.cwd()}/image.png`,
      `${process.cwd()}/link.md`,
    ]);
  });
});
