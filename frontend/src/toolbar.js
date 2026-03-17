// toolbar.js
import { DraggableNode } from './draggableNode';

const NODES = [
    { type: 'customInput', label: 'Input', icon: '⬇', color: '#38bdf8' },
    { type: 'llm', label: 'LLM', icon: '🧠', color: '#34d399' },
    { type: 'customOutput', label: 'Output', icon: '⬆', color: '#a78bfa' },
    { type: 'text', label: 'Text', icon: 'T', color: '#fb7185' },
    { type: 'api', label: 'API Call', icon: '🌐', color: '#818cf8' },
    { type: 'transform', label: 'Transform', icon: '⚙', color: '#22d3ee' },
    { type: 'filter', label: 'Filter', icon: '⑂', color: '#fbbf24' },
    { type: 'merge', label: 'Merge', icon: '⊕', color: '#94a3b8' },
    { type: 'math', label: 'Math', icon: '∑', color: '#86efac' },
];

export const PipelineToolbar = () => (
    <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 24px',
        height: 64,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
        zIndex: 10,
    }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, #00d4aa, #0097ff)',
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                boxShadow: '0 0 18px rgba(0,212,170,0.4)',
            }}>⟁</div>
            <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1 }}>
                    VectorShift
                </div>
                <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 3 }}>
                    Pipeline Studio
                </div>
            </div>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }} />

        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
            Nodes
        </span>

        {/* Palette */}
        <div style={{ display: 'flex', gap: 8, flex: 1, overflowX: 'auto', paddingBottom: 2 }}>
            {NODES.map((n, i) => (
                <DraggableNode key={n.type} type={n.type} label={n.label} icon={n.icon} color={n.color} />
            ))}
        </div>

        {/* Status */}
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.25)',
            borderRadius: 20, padding: '4px 12px', flexShrink: 0,
        }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Ready</span>
        </div>
    </header>
);
