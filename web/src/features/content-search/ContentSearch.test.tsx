import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentSearchResults } from './ContentSearch';

const result = { id: 'one', workspaceId: 'ws', workspaceName: 'Workspace', path: 'docs/a.md', name: 'a.md', kind: 'markdown' as const, language: 'markdown', lineNumber: 2, columnStart: 3, columnEnd: 9, snippet: 'A needle here', ignored: false };

describe('ContentSearchResults', () => {
	it('highlights matches and supports keyboard opening and clearing', () => {
		const onOpen = vi.fn();
		const onEscape = vi.fn();
		render(<ContentSearchResults query="needle" results={[result]} truncated={false} loading={false} error="" activeIndex={0} onActiveIndex={vi.fn()} onOpen={onOpen} onEscape={onEscape} />);
		expect(screen.getByText('needle', { selector: 'mark' })).toBeInTheDocument();
		const listbox = screen.getByRole('listbox');
		fireEvent.keyDown(listbox, { key: 'Enter' });
		expect(onOpen).toHaveBeenCalledWith(result);
		fireEvent.keyDown(listbox, { key: 'Escape' });
		expect(onEscape).toHaveBeenCalled();
	});
});
