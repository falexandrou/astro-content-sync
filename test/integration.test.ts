import chokidar, { type FSWatcher } from 'chokidar';
import { createAstroContentSyncIntegration } from "../src/integration";
import { astroConfig } from "./fixtures";
import * as syncableUtil from '../src/syncable';
import type { Syncable } from '../src/types';

describe('createAstroContentSyncIntegration', () => {
  const config = astroConfig;
  const integration = createAstroContentSyncIntegration();
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const { hooks: { 'astro:config:setup': hook } } = integration;

  it('returns a valid object', () => {
    expect(integration).toStrictEqual({
      name: 'astro-content-sync',
      hooks: {
        'astro:config:setup': expect.any(Function),
      },
    });
  });

  it('exits when the command is other than "dev"', () => {
    hook({ command: 'build', logger, config });

    expect(logger.warn).toHaveBeenCalledWith('AstroContentSync is only available in dev mode');
  });

  it('does not set a watcher and logs an error when no syncables are in place', () => {
    const chokidarSpy = jest.spyOn(chokidar, 'watch');
    hook({ command: 'dev', config, logger });
    expect(chokidarSpy).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Please provide at least one sync configuration or set the ASTRO_CONTENT_SYNC environment variable');
  });

  it("sets the watcher and events", () => {
    const eventSpy = jest.fn();
    const chokidarSpy = jest.spyOn(chokidar, 'watch').mockReturnValue({
      on: eventSpy,
      close: jest.fn(),
    } as unknown as FSWatcher);

    const source = 'src/content';
    const target = 'public/content';

    const mockSyncables: Syncable[] = [
      { source, target, ignored: [] },
    ];

    const syncables = jest.spyOn(syncableUtil, 'getSyncablesFromInputs').mockReturnValue(mockSyncables);

    hook({ command: 'dev', config, logger });

    expect(chokidarSpy).toHaveBeenCalledWith([source], { ignored: expect.any(Function) });

    expect(eventSpy).toHaveBeenCalledWith('add', expect.any(Function));
    expect(eventSpy).toHaveBeenCalledWith('change', expect.any(Function));
    expect(eventSpy).toHaveBeenCalledWith('unlink', expect.any(Function));
    expect(eventSpy).toHaveBeenCalledWith('addDir', expect.any(Function));

    syncables.mockReset();
  });
});
