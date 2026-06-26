import { Settings as SettingsIcon } from 'lucide-react';
import { statusLabels, statusOrder } from '../lib/api';
import type { ItemStatus } from '../lib/types';
import type { AppSettings } from '../features/settings/appSettings';

export function SettingsPage({ settings, onChange }: { settings: AppSettings; onChange: (settings: AppSettings) => void }) {
  const visible = new Set(settings.visibleKanbanStatuses);

  const toggleStatus = (status: ItemStatus) => {
    const next = visible.has(status)
      ? settings.visibleKanbanStatuses.filter((item) => item !== status)
      : statusOrder.filter((item) => item === status || visible.has(item));
    onChange({ ...settings, visibleKanbanStatuses: next.length > 0 ? next : [status] });
  };

  return (
    <section className="settings-page">
      <header className="settings-title">
        <h1><SettingsIcon size={22} /> Settings</h1>
        <p>Configure how Plan Manager presents workspace and board metadata.</p>
      </header>

      <section className="settings-section">
        <header>
          <div>
            <span className="settings-group-label">Kanban board</span>
            <h2>Status columns</h2>
            <p>Show or hide the statuses that appear as Kanban columns.</p>
          </div>
          <span className="settings-count">{settings.visibleKanbanStatuses.length} visible</span>
        </header>
        <div className="settings-toggle-list">
          {statusOrder.map((status) => (
            <label className="settings-toggle-row" key={status}>
              <span>
                <strong>{statusLabels[status]}</strong>
                <small>{status}</small>
              </span>
              <input
                type="checkbox"
                checked={visible.has(status)}
                onChange={() => toggleStatus(status)}
                aria-label={`Show ${statusLabels[status]} status`}
              />
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}
