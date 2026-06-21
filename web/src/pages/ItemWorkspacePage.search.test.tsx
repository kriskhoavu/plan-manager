import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemWorkspacePage } from './ItemWorkspacePage';

const apiMock = vi.hoisted(() => ({
	item: vi.fn(), files: vi.fn(), file: vi.fn(), diff: vi.fn(), gitStatus: vi.fn(), searchItemContent: vi.fn(),
	saveFile: vi.fn(), saveMetadata: vi.fn(), revertFile: vi.fn(), gitFetch: vi.fn(), gitPull: vi.fn(), gitPush: vi.fn(), gitCommit: vi.fn(), createBranch: vi.fn()
}));

vi.mock('../lib/api', () => ({
	api: apiMock,
	statusLabels: {},
	ApiError: class ApiError extends Error { recoveryHint?: string }
}));

describe('ItemWorkspacePage content search', () => {
	beforeEach(() => {
		Object.values(apiMock).forEach((mock) => mock.mockReset());
		apiMock.item.mockResolvedValue({ id: 'item-1', workspaceId: 'ws', workspaceName: 'Workspace', title: 'Item', scope: 'platform', identifier: 'PM-009', branch: 'main', status: 'draft', tags: [], metadataSource: 'plan.yaml', documents: [], metadata: {}, counts: { files: 1 } });
		apiMock.files.mockResolvedValue([]);
		apiMock.diff.mockResolvedValue({ diff: '' });
		apiMock.gitStatus.mockResolvedValue({ workspaceId: 'ws', branch: 'main', ahead: 0, behind: 0, dirty: false, conflicted: false, changes: [] });
		apiMock.file.mockResolvedValue({ id: 'README_md', path: 'README.md', content: '# Match', language: 'markdown', hash: 'hash', kind: 'markdown', sizeBytes: 7, editable: true });
		apiMock.searchItemContent.mockResolvedValue({
			results: [{ id: 'match', workspaceId: 'ws', workspaceName: 'Workspace', itemId: 'item-1', path: 'plans/platform/PM-009/README.md', fileId: 'README_md', name: 'README.md', kind: 'markdown', language: 'markdown', lineNumber: 4, columnStart: 1, columnEnd: 7, snippet: 'needle', ignored: false }],
			truncated: false, filesVisited: 1, bytesRead: 10, skippedFiles: 0
		});
	});

	it('searches only the item and opens a matched file with context', async () => {
		render(<ItemWorkspacePage itemId="item-1" refreshKey={0} onBack={vi.fn()} />);
		fireEvent.change(await screen.findByRole('textbox', { name: 'Search inside this item' }), { target: { value: 'needle' } });
		const result = await screen.findByRole('option', { name: /README.md/i });
		fireEvent.click(result);
		await waitFor(() => expect(apiMock.file).toHaveBeenCalledWith('item-1', 'README_md'));
		expect(document.querySelector('.content-match-context')).toHaveTextContent('Line 4, columns 1–7');
	});
});
