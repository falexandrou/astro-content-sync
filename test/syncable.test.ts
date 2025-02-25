import fs from 'node:fs';
import { astroOptions } from "./fixtures";
import {
  SOURCE_PATH_EMPTY_MESSAGE,
  DIRECTORY_NOT_FOUND_ERROR,
  getSyncablesFromInputs,
} from "../src/syncable";

describe('getSyncablesFromInputs', () => {
  let previousEnv: NodeJS.ProcessEnv;
  let consoleSpy: jest.SpyInstance;
  let existsSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
    previousEnv = { ...process.env };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env = previousEnv;
  });

  describe('with ENV variable', () => {
    beforeEach(() => {
      existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    afterEach(() => {
      process.env = previousEnv;
      existsSpy.mockRestore();
    });

    it('raises an error when the source is malformed', () => {
      process.env.ASTRO_CONTENT_SYNC = ':/home/test/some-target';
      const syncables = getSyncablesFromInputs([], astroOptions, console);
      expect(syncables).toStrictEqual([]);
      expect(console.error).toHaveBeenCalledWith(SOURCE_PATH_EMPTY_MESSAGE);
    });

    it('accepts ENV variables when no input is passed', () => {
      const mockDir = '/home/test/some-path';
      process.env.ASTRO_CONTENT_SYNC = mockDir;

      const syncables = getSyncablesFromInputs([], astroOptions, console);
      expect(syncables.length).toEqual(1);
      expect(syncables[0]).toStrictEqual({
        ignored: [],
        source: mockDir,
        target: `${astroOptions.srcDir}/content`,
      });
    });

    it('accepts a source:target notation in the ENV variable', () => {
      const mockDir = '/home/test/some-path:/home/test/some-target';
      process.env.ASTRO_CONTENT_SYNC = mockDir;

      const syncables = getSyncablesFromInputs([], astroOptions, console);
      expect(syncables.length).toEqual(1);
      expect(syncables[0]).toStrictEqual({
        ignored: [],
        source: '/home/test/some-path',
        target: '/home/test/some-target',
      });
    });

    it('accepts multiple source:target notations in the ENV variable', () => {
      const mockDirs = '/home/test/some-path:/home/test/some-target,/home/test/another-path:/home/test/another-target';
      process.env.ASTRO_CONTENT_SYNC = mockDirs;

      const syncables = getSyncablesFromInputs([], astroOptions, console);
      expect(syncables.length).toEqual(2);

      expect(syncables[0]).toStrictEqual({
        ignored: [],
        source: '/home/test/some-path',
        target: '/home/test/some-target',
      });

      expect(syncables[1]).toStrictEqual({
        ignored: [],
        source: '/home/test/another-path',
        target: '/home/test/another-target',
      });
    });
  });

  describe('without ENV variable', () => {
    beforeEach(() => {
      existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    afterEach(() => {
      existsSpy.mockRestore();
    });

    it('returns an empty array and logs an error message when the object is not configured propely', () => {
      const syncables = getSyncablesFromInputs([{ source: '' }], astroOptions, console);
      expect(syncables).toStrictEqual([]);
      expect(console.error).toHaveBeenCalledWith(SOURCE_PATH_EMPTY_MESSAGE);
    });

    it('accepts a list of strings separated with OS directory separator as input', () => {
      const source = '/home/test/some-path';
      const target = '/home/test/some-target';
      const syncables = getSyncablesFromInputs([`${source}:${target}`], astroOptions, console);

      expect(syncables.length).toEqual(1);
      expect(syncables[0]).toStrictEqual({ ignored: [], source, target });
    });

    it('accepts a list of object configurations as inputs', () => {
      const source = '/home/test/some-path';
      const target = '/home/test/some-target';
      const syncables = getSyncablesFromInputs([{ source, target }], astroOptions, console);

      expect(syncables.length).toEqual(1);
      expect(syncables[0]).toStrictEqual({ ignored: [], source, target });
    });

    it('accepts a list of object configurations as inputs', () => {
      const source = '/home/test/some-path';
      const target = '/home/test/some-target';
      const syncables = getSyncablesFromInputs([{ source, target }], astroOptions, console);

      expect(syncables.length).toEqual(1);
      expect(syncables[0]).toStrictEqual({ ignored: [], source, target });
    });
  });

  describe('with invalid paths', () => {
    beforeEach(() => {
      existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    });

    afterEach(() => {
      existsSpy.mockRestore();
    });

    it('logs an error when the source directory does not exist', () => {
      const source = '/home/test/some-path';
      getSyncablesFromInputs([source], astroOptions, console);
      expect(console.error).toHaveBeenCalledWith(DIRECTORY_NOT_FOUND_ERROR, source);
    });

    it('logs an error when the source directory is an empty string', () => {
      getSyncablesFromInputs([''], astroOptions, console);
      expect(console.error).toHaveBeenCalledWith(SOURCE_PATH_EMPTY_MESSAGE);
    })
  });
});
