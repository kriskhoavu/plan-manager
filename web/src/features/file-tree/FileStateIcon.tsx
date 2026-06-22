import { FilePlus2, PencilLine, TriangleAlert } from 'lucide-react';
import type { GitChangeStatus } from '../../lib/types';

export type TreeFileState = GitChangeStatus | 'unsaved';

export function FileStateIcon({ state }: { state: TreeFileState }) {
  const label = treeFileStateLabel(state);
  if (state === 'added' || state === 'untracked') {
    return <FilePlus2 className={`tree-state-icon ${state}`} size={14} aria-label={label} />;
  }
  if (state === 'conflicted') {
    return <TriangleAlert className={`tree-state-icon ${state}`} size={14} aria-label={label} />;
  }
  return <PencilLine className={`tree-state-icon ${state}`} size={14} aria-label={label} />;
}

function treeFileStateLabel(state: TreeFileState): string {
  switch (state) {
    case 'added':
    case 'untracked':
      return 'New file not committed';
    case 'unsaved':
      return 'Unsaved editor changes';
    case 'conflicted':
      return 'File has conflicts';
    case 'deleted':
      return 'Deleted file';
    case 'renamed':
      return 'Renamed file';
    case 'copied':
      return 'Copied file';
    case 'modified':
    default:
      return 'Modified file not committed';
  }
}
