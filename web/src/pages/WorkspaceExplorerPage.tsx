import { FolderTree, KanbanSquare } from 'lucide-react';
import type { ExplorerLocation } from '../app/router';
import type { WorkspaceConfig } from '../lib/types';

export function WorkspaceExplorerPage({
  workspaces,
  location,
  onOpenKanban
}: {
  workspaces: WorkspaceConfig[];
  location?: ExplorerLocation;
  onOpenKanban: (workspace: WorkspaceConfig) => void;
}) {
  return (
    <section className="page workspace-explorer-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">All workspaces</span>
          <h1>Workspace Explorer</h1>
          <p>Browse registered repositories without changing the active Kanban workspace.</p>
        </div>
      </div>
      <div className="panel explorer-route-placeholder">
        {workspaces.map((workspace) => (
          <div className={workspace.id === location?.workspaceId ? 'explorer-root active' : 'explorer-root'} key={workspace.id}>
            <FolderTree size={18} />
            <span><strong>{workspace.name}</strong><small>{workspace.path}</small></span>
            <button type="button" className="ghost" onClick={() => onOpenKanban(workspace)}>
              <KanbanSquare size={15} /> Open Kanban
            </button>
          </div>
        ))}
        {workspaces.length === 0 && <p>No workspaces registered.</p>}
      </div>
    </section>
  );
}
