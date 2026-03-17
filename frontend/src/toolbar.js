// toolbar.js
import { useCallback, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { DraggableNode } from './draggableNode';
import { SavedPipelinesPanel } from './SavedPipelinesPanel';
import { useStore } from './store';
import { TemplatesPanel } from './TemplatesPanel';

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

// Tooltip-aware node descriptors for the palette
const NODE_TOOLTIPS = {
    customInput: 'Input node — entry point for data into the pipeline',
    llm: 'LLM node — runs a language model on its prompt input',
    customOutput: 'Output node — final destination for pipeline results',
    text: 'Text node — define a text template with {{ variables }}',
    api: 'API Call node — make HTTP requests to external services',
    transform: 'Transform node — apply a data transformation operation',
    filter: 'Filter node — route data based on a condition',
    merge: 'Merge node — combine multiple inputs into one',
    math: 'Math node — evaluate a numeric expression',
};

const selector = s => ({
    pipelineName: s.pipelineName,
    setPipelineName: s.setPipelineName,
    undo: s.undo, redo: s.redo,
    canUndo: s.canUndo, canRedo: s.canRedo,
    clearCanvas: s.clearCanvas,
    savePipeline: s.savePipeline,
    exportPipeline: s.exportPipeline,
    importPipeline: s.importPipeline,
});

const IconBtn = ({ onClick, disabled, title, children, accent = 'rgba(255,255,255,0.55)' }) => (
    <button
        onClick={onClick} disabled={disabled} title={title}
        style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '5px 10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: disabled ? 'rgba(255,255,255,0.2)' : accent,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; } }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    >
        {children}
    </button>
);

// Draggable node pill with tooltip
const TooltipNode = ({ type, label, icon, color }) => {
    const [tip, setTip] = useState(false);
    return (
        <div style={{ position: 'relative' }}
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
        >
            <DraggableNode type={type} label={label} icon={icon} color={color} />
            {tip && (
                <div style={{
                    position: 'absolute', bottom: '110%', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#0d1220',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 7, padding: '6px 10px',
                    fontSize: 10, color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap', zIndex: 9999,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    animation: 'tipIn 0.1s ease',
                }}>
                    {NODE_TOOLTIPS[type]}
                    <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, background: '#0d1220', border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none', borderLeft: 'none', transform: 'translateX(-50%) rotate(45deg)' }} />
                </div>
            )}
            <style>{`@keyframes tipIn { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
        </div>
    );
};

export const PipelineToolbar = () => {
    const {
        pipelineName, setPipelineName,
        undo, redo, canUndo, canRedo,
        clearCanvas, savePipeline,
        exportPipeline, importPipeline,
    } = useStore(selector, shallow);

    const [editingName, setEditingName] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const importRef = useRef(null);

    const handleClear = () => {
        if (confirmClear) { clearCanvas(); setConfirmClear(false); }
        else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 2500); }
    };

    const handleImportClick = () => importRef.current?.click();

    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) { importPipeline(file); e.target.value = ''; }
    }, [importPipeline]);

    return (
        <>
            <header style={{
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-default)',
                flexShrink: 0, zIndex: 10,
            }}>
                {/* ── Top row ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', height: 50 }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#00d4aa,#0097ff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 14px rgba(0,212,170,0.35)' }}>⟁</div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1 }}>VectorShift</div>
                            <div style={{ fontSize: 8, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>Pipeline Studio</div>
                        </div>
                    </div>

                    <div style={{ width: 1, height: 24, background: 'var(--border-default)', flexShrink: 0 }} />

                    {/* Editable pipeline name */}
                    {editingName ? (
                        <input
                            autoFocus value={pipelineName}
                            onChange={e => setPipelineName(e.target.value)}
                            onBlur={() => setEditingName(false)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--accent)', borderRadius: 5, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, padding: '3px 8px', outline: 'none', minWidth: 160 }}
                        />
                    ) : (
                        <div onClick={() => setEditingName(true)} title="Click to rename"
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', cursor: 'text', padding: '3px 6px', borderRadius: 5, border: '1px solid transparent', transition: 'border-color 0.15s', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                            {pipelineName}
                            <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 5 }}>✎</span>
                        </div>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'nowrap' }}>
                        <IconBtn onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">↩ Undo</IconBtn>
                        <IconBtn onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Y)">↪ Redo</IconBtn>

                        <div style={{ width: 1, height: 18, background: 'var(--border-default)' }} />

                        <IconBtn onClick={() => setShowTemplates(true)} title="Load a starter template" accent="#a78bfa">⚡ Templates</IconBtn>
                        <IconBtn onClick={() => setShowLibrary(true)} title="Load a saved pipeline" accent="#38bdf8">📂 Load</IconBtn>
                        <IconBtn onClick={savePipeline} title="Save pipeline to backend" accent="#34d399">💾 Save</IconBtn>

                        <div style={{ width: 1, height: 18, background: 'var(--border-default)' }} />

                        <IconBtn onClick={exportPipeline} title="Export pipeline as JSON" accent="#22d3ee">⬇ Export</IconBtn>
                        <IconBtn onClick={handleImportClick} title="Import pipeline from JSON file" accent="#fbbf24">⬆ Import</IconBtn>
                        <input ref={importRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />

                        <div style={{ width: 1, height: 18, background: 'var(--border-default)' }} />

                        <IconBtn onClick={handleClear} title={confirmClear ? 'Click again to confirm' : 'Clear canvas'} accent={confirmClear ? '#fb7185' : 'rgba(255,255,255,0.4)'}>
                            {confirmClear ? '⚠ Confirm?' : '🗑 Clear'}
                        </IconBtn>
                    </div>

                    {/* Status pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.22)', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                        <span style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live</span>
                    </div>
                </div>

                {/* ── Node palette ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px', borderTop: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>Nodes</span>
                    <div style={{ width: 1, height: 16, background: 'var(--border-default)', flexShrink: 0 }} />
                    {NODES.map(n => (
                        <TooltipNode key={n.type} type={n.type} label={n.label} icon={n.icon} color={n.color} />
                    ))}
                </div>
            </header>

            {showLibrary && <SavedPipelinesPanel onClose={() => setShowLibrary(false)} />}
            {showTemplates && <TemplatesPanel onClose={() => setShowTemplates(false)} />}
        </>
    );
};
