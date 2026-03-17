// submit.js
import { useCallback, useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useStore } from './store';

const API_URL = 'http://localhost:8000/pipelines/parse';
const selector = (s) => ({ nodes: s.nodes, edges: s.edges });

// ── Animated counter ──────────────────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === 0) { setDisplay(0); return; }
        let cur = 0;
        const step = Math.max(1, Math.ceil(value / 20));
        const id = setInterval(() => {
            cur = Math.min(cur + step, value);
            setDisplay(cur);
            if (cur >= value) clearInterval(id);
        }, 28);
        return () => clearInterval(id);
    }, [value]);
    return <>{display}</>;
};

// ── Severity config ───────────────────────────────────────────────────────────
const SEVERITY = {
    error: { color: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', icon: '✕' },
    warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', icon: '⚠' },
    info: { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)', icon: 'ℹ' },
};

// ── Node type → readable name ─────────────────────────────────────────────────
const TYPE_LABELS = {
    customInput: 'Input', customOutput: 'Output', llm: 'LLM',
    text: 'Text', api: 'API Call', transform: 'Transform',
    filter: 'Filter', merge: 'Merge', math: 'Math',
};
const TYPE_COLORS = {
    customInput: '#38bdf8', customOutput: '#a78bfa', llm: '#34d399',
    text: '#fb7185', api: '#818cf8', transform: '#22d3ee',
    filter: '#fbbf24', merge: '#94a3b8', math: '#86efac',
};

// ── Result modal ──────────────────────────────────────────────────────────────
const ResultModal = ({ result, error, onClose }) => {
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const isDag = result?.is_dag;
    const issues = result?.issues || [];
    const execPlan = result?.exec_plan || [];
    const topoOrder = result?.topo_order || [];
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warnCount = issues.filter(i => i.severity === 'warning').length;

    const accentMain = error ? '#fb7185' : isDag ? '#34d399' : '#fbbf24';
    const accentDim = error ? 'rgba(251,113,133,0.1)' : isDag ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)';

    const Tab = ({ id, label, badge, badgeColor }) => (
        <button onClick={() => setTab(id)} style={{
            padding: '6px 12px', fontSize: 10, background: tab === id ? 'rgba(255,255,255,0.07)' : 'transparent',
            border: 'none', borderBottom: tab === id ? `2px solid ${accentMain}` : '2px solid transparent',
            color: tab === id ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
        }}>
            {label}
            {badge > 0 && (
                <span style={{ background: `${badgeColor || accentMain}22`, border: `1px solid ${badgeColor || accentMain}44`, color: badgeColor || accentMain, borderRadius: 10, padding: '0 5px', fontSize: 9 }}>
                    {badge}
                </span>
            )}
        </button>
    );

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.18s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: 480, maxHeight: '82vh',
                background: '#0d1220',
                border: `1px solid ${accentMain}33`,
                borderRadius: 16,
                boxShadow: `0 0 0 1px ${accentMain}11, 0 24px 64px rgba(0,0,0,0.7), 0 0 40px ${accentMain}18`,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
                fontFamily: 'var(--font-mono)',
            }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accentMain}, transparent)` }} />

                {/* Header */}
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: accentDim, border: `1px solid ${accentMain}44`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {error ? '⚠' : isDag ? '✓' : '⚠'}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: error ? '#fb7185' : 'var(--text-primary)' }}>
                                {error ? 'Connection Error' : 'Pipeline Analysis'}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.08em' }}>
                                {error ? 'Backend unreachable' : `${result.num_nodes} nodes · ${result.num_edges} edges`}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 26, height: 26, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>

                {/* Tabs */}
                {!error && (
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px' }}>
                        <Tab id="overview" label="Overview" />
                        <Tab id="plan" label="Exec Plan" badge={execPlan.length} />
                        <Tab id="issues" label="Issues" badge={errorCount + warnCount} badgeColor={errorCount > 0 ? '#fb7185' : '#fbbf24'} />
                    </div>
                )}

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1 }}>

                    {/* Error state */}
                    {error && (
                        <div style={{ padding: 20 }}>
                            <div style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8, padding: '12px 14px', fontSize: 11, color: '#fb7185', lineHeight: 1.6 }}>{error}</div>
                            <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                Make sure the backend is running:<br />
                                <code style={{ color: 'var(--accent)' }}>python main.py</code>
                            </div>
                        </div>
                    )}

                    {/* Overview tab */}
                    {!error && tab === 'overview' && (
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 10, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 9, color: 'rgba(56,189,248,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Nodes</div>
                                    <div style={{ fontSize: 30, fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-display)', lineHeight: 1 }}><AnimatedNumber value={result.num_nodes} /></div>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>total pipeline nodes</div>
                                </div>
                                <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.18)', borderRadius: 10, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 9, color: 'rgba(129,140,248,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Edges</div>
                                    <div style={{ fontSize: 30, fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-display)', lineHeight: 1 }}><AnimatedNumber value={result.num_edges} /></div>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>connections</div>
                                </div>
                            </div>
                            {/* DAG card */}
                            <div style={{ background: accentDim, border: `1px solid ${accentMain}33`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 40, height: 40, flexShrink: 0, background: `${accentMain}18`, border: `1px solid ${accentMain}44`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                    {isDag ? '✓' : '↻'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: accentMain, fontFamily: 'var(--font-display)' }}>
                                        {isDag ? 'Valid DAG' : 'Contains a Cycle'}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                                        {isDag
                                            ? 'No cycles found. Pipeline can execute in deterministic order.'
                                            : 'A circular dependency was detected. Remove the cycle to enable execution.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Execution plan tab */}
                    {!error && tab === 'plan' && (
                        <div style={{ padding: '16px 20px' }}>
                            {execPlan.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 11 }}>
                                    No execution plan — pipeline contains a cycle.
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
                                        Simulated execution order from the backend. Nodes run in topological sequence.
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {execPlan.map((step) => {
                                            const color = TYPE_COLORS[step.node_type] || '#64748b';
                                            return (
                                                <div key={step.node_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 22, height: 22, flexShrink: 0, background: `${accentMain}18`, border: `1px solid ${accentMain}33`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: accentMain, fontWeight: 700 }}>
                                                        {step.step}
                                                    </div>
                                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{step.node_id}</div>
                                                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{step.action}</div>
                                                        </div>
                                                        <span style={{ fontSize: 9, background: `${color}18`, border: `1px solid ${color}33`, color, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
                                                            {TYPE_LABELS[step.node_type] || step.node_type}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Issues tab */}
                    {!error && tab === 'issues' && (
                        <div style={{ padding: '16px 20px' }}>
                            {issues.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, color: '#34d399', fontSize: 12 }}>
                                    ✓ No issues — pipeline looks clean!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {issues.map((issue, i) => {
                                        const s = SEVERITY[issue.severity] || SEVERITY.info;
                                        return (
                                            <div key={i} style={{ display: 'flex', gap: 10, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px' }}>
                                                <span style={{ color: s.color, flexShrink: 0, fontSize: 13, marginTop: 1 }}>{s.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 9, color: s.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{issue.severity}</div>
                                                    <div style={{ fontSize: 11, color: `${s.color}cc`, lineHeight: 1.6 }}>{issue.message}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
                    Press <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3, padding: '1px 5px' }}>Esc</kbd> or click outside to dismiss
                </div>
            </div>

            <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
        </div>
    );
};

// ── SubmitButton ──────────────────────────────────────────────────────────────
export const SubmitButton = () => {
    const { nodes, edges } = useStore(selector, shallow);
    const [status, setStatus] = useState('idle');
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleClick = useCallback(async () => {
        if (status === 'loading') return;
        setStatus('loading'); setResult(null); setErrorMsg(null);
        try {
            const res = await fetch(API_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges }),
            });
            if (!res.ok) throw new Error(`Server ${res.status}: ${await res.text()}`);
            const data = await res.json();
            setResult(data); setStatus('done');
        } catch (err) {
            setErrorMsg(err.message || 'Unknown error'); setStatus('error');
        } finally {
            setModalOpen(true);
            setTimeout(() => setStatus('idle'), 600);
        }
    }, [nodes, edges, status]);

    const isLoading = status === 'loading';
    const isDone = status === 'done';
    const isError = status === 'error';
    const bgColor = isError ? 'linear-gradient(135deg,#be123c,#fb7185)' : isDone ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#00d4aa,#0097ff)';
    const glow = isError ? 'rgba(251,113,133,0.4)' : isDone ? 'rgba(52,211,153,0.4)' : 'rgba(0,212,170,0.35)';
    const label = isLoading ? 'Analysing…' : isDone ? '✓ Complete' : isError ? '⚠ Error' : 'Run Pipeline';

    return (
        <>
            <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52, background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pipeline</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{nodes.length}</span> node{nodes.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: 'var(--border-default)' }}>·</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        <span style={{ color: '#818cf8', fontWeight: 600 }}>{edges.length}</span> edge{edges.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <button
                    onClick={handleClick} disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 22px', background: bgColor, border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxShadow: `0 0 18px ${glow}`, opacity: isLoading ? 0.7 : 1 }}
                    onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = `0 0 28px ${glow}, 0 4px 14px rgba(0,0,0,0.4)`; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 18px ${glow}`; }}
                >
                    {isLoading && <span style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                    {label}
                </button>
            </footer>
            {modalOpen && <ResultModal result={result} error={errorMsg} onClose={() => setModalOpen(false)} />}
        </>
    );
};
