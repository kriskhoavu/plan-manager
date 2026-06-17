import { useEffect, useMemo, useState } from 'react';
import { FileText, FolderGit2, Search } from 'lucide-react';
import { api, statusLabels } from '../lib/api';
import type { PlanSummary, RepositoryConfig } from '../lib/types';

export function PlansPage({ repository, refreshKey, onOpenPlan }: {
  repository?: RepositoryConfig;
  refreshKey: number;
  onOpenPlan: (planId: string) => void;
}) {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repository) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    api.plans(new URLSearchParams({ repositoryId: repository.id }))
      .then(setPlans)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [repository, refreshKey]);

  const filteredPlans = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return plans;
    return plans.filter((plan) => [
      plan.title,
      plan.ticket,
      plan.service,
      plan.branch,
      plan.author,
      plan.owner,
      plan.description,
      sourceRoot(plan, repository)
    ].filter(Boolean).join(' ').toLowerCase().includes(text));
  }, [plans, query, repository]);

  if (!repository && !loading) {
    return (
      <section className="empty-state">
        <h1>Plans</h1>
        <p>Register a local Git repository to browse plans.</p>
      </section>
    );
  }

  return (
    <section className="list-page">
      <div className="page-title list-title">
        <div>
          <h1><FileText size={22} /> Plans</h1>
          <span><FolderGit2 size={15} /> {repository?.name ?? 'No workspace selected'}</span>
        </div>
      </div>
      <label className="filter-input list-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plans..." />
      </label>
      <div className="filter-summary">
        <span>{filteredPlans.length} of {plans.length} items</span>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="plan-list" aria-busy={loading}>
        {loading && Array.from({ length: 5 }).map((_, index) => <div className="plan-list-row skeleton" key={index} />)}
        {!loading && filteredPlans.map((plan) => (
          <button type="button" className="plan-list-row" key={plan.id} onClick={() => onOpenPlan(plan.id)}>
            <div>
              <strong>{plan.title}</strong>
              <span>{plan.ticket} · {plan.service || 'docs'} · {plan.branch}</span>
            </div>
            <p>{plan.description || 'No description'}</p>
            <div className="plan-list-meta">
              <span>{sourceRoot(plan, repository)}</span>
              <span>{statusLabels[plan.status]}</span>
              <span>{plan.author || plan.owner || 'Unknown'}</span>
            </div>
          </button>
        ))}
        {!loading && filteredPlans.length === 0 && <div className="empty-list">No plans match the current search.</div>}
      </div>
    </section>
  );
}

function sourceRoot(plan: PlanSummary, repository?: RepositoryConfig): string {
  const root = plan.planRoot ?? '';
  const directories = repository?.planDirectories ?? [];
  return directories.find((directory) => root === directory || root.startsWith(`${directory}/`)) ?? root.split('/')[0] ?? 'plans';
}
