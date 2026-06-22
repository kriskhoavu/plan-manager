import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FileStateIcon } from './FileStateIcon';

describe('FileStateIcon', () => {
  it.each([
    ['modified', 'Modified file not committed'],
    ['added', 'New file not committed'],
    ['untracked', 'New file not committed'],
    ['conflicted', 'File has conflicts'],
    ['unsaved', 'Unsaved editor changes']
  ] as const)('labels %s file state', (state, label) => {
    render(<FileStateIcon state={state} />);
    expect(screen.getByLabelText(label)).toHaveClass('tree-state-icon', state);
  });
});
