// submit.js
// Sends nodes + edges to /pipelines/parse and shows a styled result modal.

import { useCallback, useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useStore } from './store';

const API_URL = 'http://localhost:8000/pipelines/parse';

// ── Zustand selector ──────────────────────────────────────────────────────────
const selector = (s) => ({ nodes: s.nodes, edges: s.edges });

// ── Animated counter (ticks up from 0 to target) ─────────────────────────────
const AnimatedNumber = ({ value }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === 0) { setDisplay(0); return; }
        let start = 0;
        const step = Math.ceil(value / 20);
        const id = setInterval(() => {
            start = Math.min(start + step, value);
            setDisplay(start);
            if (start >= value) clearInterval(id);
        }, 30);
        return () => clearInterval(id);
    }, [value]);
    return <>{display}</>;
};

// ── Result modal ──────────────────────────────────────────────────────────────
const ResultModal = ({ result, error, onClose }) => {
    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const isDag = result?.is_dag;
    const accentMain = isDag ? '#34d399' : '#fb7185';
    const accentDim = isDag ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)';

    return (
        // Backdrop
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.18s ease',
            }}
        >
            {/* Panel — stop propagation so clicking inside doesn't close */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: 420,
                    background: '#0d1220',
                    border: `1px solid ${error ? '#fb7185' : accentMain}44`,
                    borderRadius: 16,
                    boxShadow: `0 0 0 1px ${error ? '#fb7185' : accentMain}11,
                      0 24px 64px rgba(0,0,0,0.7),
                      0 0 40px ${error ? 'rgba(251,113,133,0.15)' : `${accentMain}22`}`,
                    overflow: 'hidden',
                    animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
                    fontFamily: 'var(--font-mono)',
                }}
            >
                {/* Accent top bar */}
                <div style={{
                    height: 3,
                    background: `linear-gradient(90deg, transparent, ${error ? '#fb7185' : accentMain}, transparent)`,
                }} />

                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: `1px solid rgba(255,255,255,0.06)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32,
                            background: error ? 'rgba(251,113,133,0.15)' : accentDim,
                            border: `1px solid ${error ? '#fb7185' : accentMain}44`,
                            borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16,
                        }}>
                            {error ? '⚠' : isDag ? '✓' : '↻'}
                        </div>
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700, fontSize: 14,
                                color: error ? '#fb7185' : 'var(--text-primary)',
                                letterSpacing: '0.02em',
                            }}>
                                {error ? 'Pipeline Error' : 'Pipeline Analysis'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.08em' }}>
                                {error ? 'Could not reach backend' : 'Results from /pipelines/parse'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 28, height: 28,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, lineHeight: 1,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >×</button>
                </div>

                {/* Error body */}
                {error && (
                    <div style={{ padding: '20px 24px 24px' }}>
                        <div style={{
                            background: 'rgba(251,113,133,0.08)',
                            border: '1px solid rgba(251,113,133,0.2)',
                            borderRadius: 8, padding: '12px 14px',
                            fontSize: 11, color: '#fb7185', lineHeight: 1.6,
                        }}>
                            {error}
                        </div>
                        <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            Make sure the backend is running:<br />
                            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                                uvicorn main:app --reload
                            </span>
                        </div>
                    </div>
                )}

                {/* Success body */}
                {result && !error && (
                    <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Stat cards row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {/* Nodes */}
                            <div style={{
                                background: 'rgba(56,189,248,0.06)',
                                border: '1px solid rgba(56,189,248,0.2)',
                                borderRadius: 10, padding: '14px 16px',
                            }}>
                                <div style={{ fontSize: 9, color: 'rgba(56,189,248,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
                                    Nodes
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                                    <AnimatedNumber value={result.num_nodes} />
                                </div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                                    total pipeline nodes
                                </div>
                            </div>

                            {/* Edges */}
                            <div style={{
                                background: 'rgba(129,140,248,0.06)',
                                border: '1px solid rgba(129,140,248,0.2)',
                                borderRadius: 10, padding: '14px 16px',
                            }}>
                                <div style={{ fontSize: 9, color: 'rgba(129,140,248,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
                                    Edges
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                                    <AnimatedNumber value={result.num_edges} />
                                </div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                                    connections between nodes
                                </div>
                            </div>
                        </div>

                        {/* DAG status — full width card */}
                        <div style={{
                            background: accentDim,
                            border: `1px solid ${accentMain}33`,
                            borderRadius: 10, padding: '14px 16px',
                            display: 'flex', alignItems: 'center', gap: 14,
                        }}>
                            <div style={{
                                width: 40, height: 40, flexShrink: 0,
                                background: `${accentMain}18`,
                                border: `1px solid ${accentMain}44`,
                                borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20,
                            }}>
                                {isDag ? '✓' : '↻'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 700,
                                    color: accentMain,
                                    fontFamily: 'var(--font-display)',
                                    letterSpacing: '0.03em',
                                }}>
                                    {isDag ? 'Valid DAG' : 'Contains a Cycle'}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                                    {isDag
                                        ? 'This pipeline has no cycles. It can be executed in a deterministic topological order.'
                                        : 'A cycle was detected. Execution order is ambiguous — remove the circular dependency to fix it.'}
                                </div>
                            </div>
                        </div>

                        {/* Dismiss hint */}
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
                            Press <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>Esc</kbd> or click outside to dismiss
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
        </div>
    );
};

// ── SubmitButton ──────────────────────────────────────────────────────────────
export const SubmitButton = () => {
    const { nodes, edges } = useStore(selector, shallow);
    const [status, setStatus] = useState('idle'); // idle | loading | done | error
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleClick = useCallback(async () => {
        if (status === 'loading') return;

        setStatus('loading');
        setResult(null);
        setErrorMsg(null);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server responded ${response.status}: ${text}`);
            }

            const data = await response.json();
            setResult(data);
            setStatus('done');
        } catch (err) {
            setErrorMsg(err.message || 'Unknown error');
            setStatus('error');
        } finally {
            setModalOpen(true);
            // Reset button state after a short delay so it's ready again
            setTimeout(() => setStatus('idle'), 600);
        }
    }, [nodes, edges, status]);

    // Button appearance per state
    const isLoading = status === 'loading';
    const isDone = status === 'done';
    const isError = status === 'error';
    const bgColor = isError ? 'linear-gradient(135deg, #be123c, #fb7185)'
        : isDone ? 'linear-gradient(135deg, #059669, #34d399)'
            : 'linear-gradient(135deg, #00d4aa, #0097ff)';
    const glowColor = isError ? 'rgba(251,113,133,0.4)'
        : isDone ? 'rgba(52,211,153,0.4)'
            : 'rgba(0,212,170,0.35)';
    const label = isLoading ? 'Analysing…'
        : isDone ? '✓ Complete'
            : isError ? '⚠ Error'
                : 'Run Pipeline';

    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    return (
        <>
            <footer style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                height: 56,
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-default)',
                flexShrink: 0,
            }}>
                {/* Pipeline stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Pipeline
                    </span>
                    <div style={{ display: 'flex', gap: 14 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{nodeCount}</span>
                            {' '}node{nodeCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{ color: 'var(--border-default)' }}>·</span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                            <span style={{ color: '#818cf8', fontWeight: 600 }}>{edgeCount}</span>
                            {' '}edge{edgeCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Run button */}
                <button
                    onClick={handleClick}
                    disabled={isLoading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 24px',
                        background: bgColor,
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700, fontSize: 12,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: `0 0 20px ${glowColor}`,
                        opacity: isLoading ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = `0 0 32px ${glowColor}, 0 4px 16px rgba(0,0,0,0.4)`; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}`; }}
                >
                    {isLoading && (
                        <span style={{
                            width: 12, height: 12,
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.7s linear infinite',
                        }} />
                    )}
                    {label}
                </button>
            </footer>

            {/* Result / error modal */}
            {modalOpen && (
                <ResultModal
                    result={result}
                    error={errorMsg}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </>
    );
};
