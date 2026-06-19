import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { WorkspaceConfig } from '../lib/types';
import { pathForRoute, routeFromLocation } from './router';
import type { Route } from './router';

const contentVersionStorageKey = 'itemManagerContentVersion';

export function useAppState() {
  const [route, setRoute] = useState<Route>(routeFromLocation);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => localStorage.getItem('activeWorkspaceId') ?? '');
  const [contentRefreshKey, setContentRefreshKey] = useState(0);
  const [stateVersion, setStateVersion] = useState('');
  const [showStaleNotice, setShowStaleNotice] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onPop = () => setRoute(routeFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next: Route) => {
    history.pushState(null, '', pathForRoute(next));
    setRoute(next);
  };

  const refreshWorkspaces = () => api.workspaces().then(setWorkspaces).catch(() => setWorkspaces([]));
  const markStateCurrent = async (broadcast = false) => {
    const state = await api.state();
    setStateVersion(state.version);
    setShowStaleNotice(false);
    if (broadcast) {
      localStorage.setItem(contentVersionStorageKey, `${state.version}:${Date.now()}`);
    }
  };
  const refreshAppData = async (broadcast = false) => {
    await refreshWorkspaces();
    setContentRefreshKey((key) => key + 1);
    await markStateCurrent(broadcast);
  };
  const refreshAppStateOnly = async (broadcast = false) => {
    await refreshWorkspaces();
    await markStateCurrent(broadcast);
  };

  useEffect(() => {
    void refreshAppData();
  }, []);

  useEffect(() => {
    const checkState = async () => {
      if (document.hidden) return;
      try {
        const state = await api.state();
        if (!stateVersion) {
          setStateVersion(state.version);
        } else if (state.version !== stateVersion) {
          setShowStaleNotice(true);
        }
      } catch {
        // The regular page APIs already surface request errors where needed.
      }
    };
    const interval = window.setInterval(checkState, 30000);
    const onVisibilityChange = () => {
      if (!document.hidden) void checkState();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [stateVersion]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== contentVersionStorageKey || !event.newValue) return;
      const version = event.newValue.split(':')[0];
      if (stateVersion && version !== stateVersion) {
        setShowStaleNotice(true);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [stateVersion]);

  useEffect(() => {
    if (workspaces.length === 0) {
      setActiveWorkspaceId('');
      localStorage.removeItem('activeWorkspaceId');
      return;
    }
    if (!workspaces.some((repo) => repo.id === activeWorkspaceId)) {
      const nextId = workspaces[0].id;
      setActiveWorkspaceId(nextId);
      localStorage.setItem('activeWorkspaceId', nextId);
    }
  }, [activeWorkspaceId, workspaces]);

  const selectWorkspace = (repo: WorkspaceConfig) => {
    setActiveWorkspaceId(repo.id);
    localStorage.setItem('activeWorkspaceId', repo.id);
    navigate({ name: 'kanban' });
  };

  const activeRepo = workspaces.find((repo) => repo.id === activeWorkspaceId) ?? workspaces[0];
  const lastSync = useMemo(() => {
    if (!activeRepo?.lastScannedAt) return 'Not scanned';
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
      Math.round((new Date(activeRepo.lastScannedAt).getTime() - Date.now()) / 60000),
      'minute'
    );
  }, [activeRepo]);

  return {
    route,
    theme,
    setTheme,
    workspaces,
    activeRepo,
    contentRefreshKey,
    showStaleNotice,
    setShowStaleNotice,
    navigate,
    selectWorkspace,
    refreshAppData,
    refreshAppStateOnly,
    lastSync
  };
}
