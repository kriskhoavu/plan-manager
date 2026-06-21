import type { KeyboardEvent, RefObject } from 'react';
import { Search, X } from 'lucide-react';
import type { WorkspaceContentSearchResult } from '../../lib/types';

export function ContentSearchInput({ query, onQueryChange, caseSensitive, onCaseSensitiveChange, label }: {
	query: string;
	onQueryChange: (query: string) => void;
	caseSensitive: boolean;
	onCaseSensitiveChange: (value: boolean) => void;
	label: string;
}) {
	return <div className="content-search-input" role="search">
		<label><Search size={15} /><input aria-label={label} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={label} /></label>
		<label className="content-search-case"><input type="checkbox" checked={caseSensitive} onChange={(event) => onCaseSensitiveChange(event.target.checked)} /> Aa</label>
		{query && <button className="icon-button" type="button" aria-label="Clear content search" onClick={() => onQueryChange('')}><X size={14} /></button>}
	</div>;
}

export function ContentSearchResults({ query, results, truncated, loading, error, activeIndex, onActiveIndex, onOpen, onEscape, treeRef }: {
	query: string;
	results: WorkspaceContentSearchResult[];
	truncated: boolean;
	loading: boolean;
	error: string;
	activeIndex: number;
	onActiveIndex: (index: number) => void;
	onOpen: (result: WorkspaceContentSearchResult) => void;
	onEscape: () => void;
	treeRef?: RefObject<HTMLElement | null>;
}) {
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			onEscape();
			treeRef?.current?.focus();
			return;
		}
		if (!results.length) return;
		if (event.key === 'ArrowDown') { event.preventDefault(); onActiveIndex(Math.min(activeIndex + 1, results.length - 1)); }
		if (event.key === 'ArrowUp') { event.preventDefault(); onActiveIndex(Math.max(activeIndex - 1, 0)); }
		if (event.key === 'Enter') { event.preventDefault(); onOpen(results[activeIndex] ?? results[0]); }
	};
	return <div className="content-search-results" role="listbox" aria-label="Content search results" tabIndex={0} onKeyDown={onKeyDown}>
		<div className="content-search-live" aria-live="polite">{loading ? 'Searching file contents…' : `${results.length} content matches`}</div>
		{error && <p className="content-search-message error">{error}</p>}
		{!loading && !error && results.length === 0 && <p className="content-search-message">No content matches.</p>}
		{results.map((result, index) => <button key={result.id} type="button" role="option" aria-selected={index === activeIndex} className={index === activeIndex ? 'active' : ''} onMouseEnter={() => onActiveIndex(index)} onClick={() => onOpen(result)}>
			<span><strong>{result.name}</strong><small>{result.workspaceName} · {result.path}:{result.lineNumber}</small></span>
			<span className="content-search-snippet">{highlightSnippet(result.snippet, query, result.id)}</span>
			<small>Line {result.lineNumber}, columns {result.columnStart}–{result.columnEnd}</small>
		</button>)}
		{truncated && <p className="content-search-message">More matches exist. Refine the query.</p>}
	</div>;
}

function highlightSnippet(snippet: string, query: string, key: string) {
	const index = snippet.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
	if (!query || index < 0) return snippet;
	return <>{snippet.slice(0, index)}<mark key={key}>{snippet.slice(index, index + query.length)}</mark>{snippet.slice(index + query.length)}</>;
}
