import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../lib/api';
import { AISessionLaunchDialog } from './AISessionLaunchDialog';

vi.mock('../../lib/api', () => ({ api: {
  aiSettings: vi.fn(), aiCapabilities: vi.fn(), aiSessionEligibility: vi.fn(), launchAISession: vi.fn()
} }));

function mockOptions(implementationReady: boolean) {
  vi.mocked(api.aiSettings).mockResolvedValue({
    defaultProvider: 'codex', defaultTerminal: 'terminal',
    providers: { codex: { enabled: true, executable: 'codex', args: [] } },
    terminals: { terminal: { enabled: true, executable: '/Terminal.app', args: [] } }
  });
  vi.mocked(api.aiCapabilities).mockResolvedValue([
    { id: 'codex', kind: 'provider', detected: true, configured: true, executable: '/bin/codex' },
    { id: 'terminal', kind: 'terminal', detected: true, configured: true, executable: '/Terminal.app' }
  ]);
  vi.mocked(api.aiSessionEligibility).mockResolvedValue({ editable: true, implementationReady, missing: implementationReady ? [] : ['implementation-plan.md'] });
}

describe('AISessionLaunchDialog', () => {
  afterEach(() => vi.clearAllMocks());

  it('disables implementation when the item is not ready and launches brainstorming', async () => {
    mockOptions(false);
    vi.mocked(api.launchAISession).mockResolvedValue({ accepted: true, provider: 'codex', terminal: 'terminal', intent: 'brainstorm', startedAt: '2026-07-02T00:00:00Z' });
    const onClose = vi.fn();
    const onLaunched = vi.fn();
    render(<AISessionLaunchDialog itemId="item-1" onClose={onClose} onLaunched={onLaunched} />);
    expect(await screen.findByText(/implementation unavailable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/implement the structured plan/i)).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Open session' }));
    await waitFor(() => expect(api.launchAISession).toHaveBeenCalledWith('item-1', { provider: 'codex', terminal: 'terminal', intent: 'brainstorm' }));
    expect(onLaunched).toHaveBeenCalledWith(expect.stringContaining('Codex opened'));
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open and reports launch errors', async () => {
    mockOptions(true);
    vi.mocked(api.launchAISession).mockRejectedValue(new Error('Terminal missing'));
    const onClose = vi.fn();
    render(<AISessionLaunchDialog itemId="item-1" onClose={onClose} onLaunched={vi.fn()} />);
    await screen.findByText(/implementation ready/i);
    fireEvent.click(screen.getByRole('button', { name: 'Open session' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Terminal missing');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('prevents duplicate launch submissions', async () => {
    mockOptions(true);
    let resolveLaunch!: (value: { accepted: true; provider: string; terminal: string; intent: 'brainstorm'; startedAt: string }) => void;
    vi.mocked(api.launchAISession).mockReturnValue(new Promise((resolve) => { resolveLaunch = resolve; }));
    render(<AISessionLaunchDialog itemId="item-1" onClose={vi.fn()} onLaunched={vi.fn()} />);
    await screen.findByText(/implementation ready/i);
    const button = screen.getByRole('button', { name: 'Open session' });
    fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'Opening...' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Opening...' }));
    expect(api.launchAISession).toHaveBeenCalledTimes(1);
    await act(async () => resolveLaunch({ accepted: true, provider: 'codex', terminal: 'terminal', intent: 'brainstorm', startedAt: '2026-07-02T00:00:00Z' }));
  });

  it('launches a free prompt without requiring editable card context', async () => {
    mockOptions(false);
    vi.mocked(api.aiSessionEligibility).mockResolvedValue({ editable: false, implementationReady: false, missing: ['editable working-tree item'] });
    vi.mocked(api.launchAISession).mockResolvedValue({ accepted: true, provider: 'codex', terminal: 'terminal', intent: 'free_prompt', startedAt: '2026-07-02T00:00:00Z' });
    render(<AISessionLaunchDialog itemId="snapshot" onClose={vi.fn()} onLaunched={vi.fn()} />);
    const freePrompt = await screen.findByLabelText(/free prompt/i);
    fireEvent.click(freePrompt);
    expect(screen.getByText(/no card context will be injected/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open session' }));
    await waitFor(() => expect(api.launchAISession).toHaveBeenCalledWith('snapshot', { provider: 'codex', terminal: 'terminal', intent: 'free_prompt' }));
  });
});
