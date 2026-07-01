import { useEffect, useRef, useState } from 'react';
import { Bot, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { AICapability, AISessionEligibility, AISettings, AISessionLaunchInput } from '../../lib/types';

export function AISessionLaunchDialog({ itemId, onClose, onLaunched }: { itemId: string; onClose: () => void; onLaunched: (message: string) => void }) {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [capabilities, setCapabilities] = useState<AICapability[]>([]);
  const [eligibility, setEligibility] = useState<AISessionEligibility | null>(null);
  const [provider, setProvider] = useState('');
  const [terminal, setTerminal] = useState('');
  const [intent, setIntent] = useState<AISessionLaunchInput['intent']>('brainstorm');
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.aiSettings(), api.aiCapabilities(), api.aiSessionEligibility(itemId)]).then(([nextSettings, nextCapabilities, nextEligibility]) => {
      if (!active) return;
      setSettings(nextSettings);
      setCapabilities(nextCapabilities);
      setEligibility(nextEligibility);
      setProvider(nextSettings.defaultProvider);
      setTerminal(nextSettings.defaultTerminal);
    }).catch((caught) => active && setError(caught instanceof Error ? caught.message : 'AI session options are unavailable.')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [itemId]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !launching) onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), select:not([disabled]), input:not([disabled])'));
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [launching, onClose]);

  const launch = async () => {
    setLaunching(true);
    setError('');
    try {
      const result = await api.launchAISession(itemId, { provider, terminal, intent });
      onLaunched(`${label(result.provider)} opened in ${label(result.terminal)} for ${result.intent}.`);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'AI session launch failed.');
    } finally {
      setLaunching(false);
    }
  };

  const providers = toolOptions(settings?.providers, capabilities, 'provider');
  const terminals = toolOptions(settings?.terminals, capabilities, 'terminal');
  const canLaunch = !loading && !launching && eligibility?.editable && providers.some((item) => item.id === provider) && terminals.some((item) => item.id === terminal) && (intent !== 'implement' || eligibility.implementationReady);

  return (
    <div className="modal-backdrop ai-launch-backdrop" role="presentation">
      <section ref={dialogRef} className="modal-panel ai-launch-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-launch-title">
        <header><div><h2 id="ai-launch-title"><Bot size={19} /> Open AI session</h2><span>Start an interactive CLI with this workspace and item context.</span></div><button ref={closeRef} className="icon-button" type="button" aria-label="Close AI session dialog" disabled={launching} onClick={onClose}><X size={18} /></button></header>
        {loading && <p role="status">Loading available tools...</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {settings && eligibility && <div className="ai-launch-fields">
          <label>AI provider<select value={provider} onChange={(event) => setProvider(event.target.value)}>{providers.map((item) => <option key={item.id} value={item.id}>{label(item.id)}</option>)}</select></label>
          <label>Terminal<select value={terminal} onChange={(event) => setTerminal(event.target.value)}>{terminals.map((item) => <option key={item.id} value={item.id}>{label(item.id)}</option>)}</select></label>
          <fieldset><legend>Intent</legend><label><input type="radio" name="ai-intent" checked={intent === 'brainstorm'} onChange={() => setIntent('brainstorm')} /> Brainstorm and refine the card</label><label><input type="radio" name="ai-intent" checked={intent === 'implement'} disabled={!eligibility.implementationReady} aria-describedby="implementation-readiness" onChange={() => setIntent('implement')} /> Implement the structured plan</label></fieldset>
          <p id="implementation-readiness" className={eligibility.implementationReady ? 'eligibility-ready' : 'eligibility-blocked'}>{eligibility.implementationReady ? 'Implementation ready: plan.yaml and implementation-plan.md are available.' : `Implementation unavailable: ${eligibility.missing.join(', ') || 'required planning files are missing'}.`}</p>
          {!eligibility.editable && <p className="error">External sessions require an editable working-tree item.</p>}
          {(providers.length === 0 || terminals.length === 0) && <p className="error">Enable and detect at least one AI provider and terminal in Settings.</p>}
        </div>}
        <footer className="modal-actions"><button className="ghost" type="button" disabled={launching} onClick={onClose}>Cancel</button><button className="primary" type="button" disabled={!canLaunch} onClick={() => void launch()}>{launching ? 'Opening...' : 'Open session'}</button></footer>
      </section>
    </div>
  );
}

function toolOptions(templates: Record<string, { enabled: boolean }> | undefined, capabilities: AICapability[], kind: 'provider' | 'terminal') {
  return Object.keys(templates ?? {}).filter((id) => templates?.[id].enabled && capabilities.some((item) => item.kind === kind && item.id === id && item.detected)).map((id) => ({ id }));
}

function label(id: string) {
  return ({ claude: 'Claude', codex: 'Codex', copilot: 'Copilot', opencode: 'OpenCode', terminal: 'Terminal', iterm2: 'iTerm2', wezterm: 'WezTerm' } as Record<string, string>)[id] ?? id;
}
