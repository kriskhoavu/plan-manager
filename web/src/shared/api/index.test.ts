import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '.';

describe('shared api facade', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes workspace sources', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'w1', name: 'Workspace', path: '/repo', baselineBranch: 'main', createdAt: '2026-06-20T00:00:00Z' }]
    }));

    await expect(api.workspaces()).resolves.toEqual([
      { id: 'w1', name: 'Workspace', path: '/repo', baselineBranch: 'main', createdAt: '2026-06-20T00:00:00Z', sources: [] }
    ]);
  });

  it('normalizes Git status defaults', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ workspaceId: 'w1', branch: 'main' })
    }));

    await expect(api.gitStatus('w1')).resolves.toEqual({
      workspaceId: 'w1',
      branch: 'main',
      ahead: 0,
      behind: 0,
      dirty: false,
      conflicted: false,
      changes: []
    });
  });
});
