import { resolveFilePath } from "../src/filesystem";

describe('resolveFilePath', () => {
  it('resolves relative paths properly', () => {
    const resolvedPath = resolveFilePath('./src/filesystem.ts');
    expect(resolvedPath).toEqual(`${process.cwd()}/src/filesystem.ts`);
  });
});
