// nodes/BaseNode.js
// Single styled shell for every pipeline node.

import { Handle, Position } from 'reactflow';

// ─── Color palette (per variant) ─────────────────────────────────────────────
const PALETTE = {
    input: { accent: '#38bdf8', bg: 'rgba(14,28,46,0.95)', glow: 'rgba(56,189,248,0.18)' },
    output: { accent: '#a78bfa', bg: 'rgba(20,14,40,0.95)', glow: 'rgba(167,139,250,0.18)' },
    llm: { accent: '#34d399', bg: 'rgba(10,28,20,0.95)', glow: 'rgba(52,211,153,0.18)' },
    text: { accent: '#fb7185', bg: 'rgba(30,12,18,0.95)', glow: 'rgba(251,113,133,0.18)' },
    api: { accent: '#818cf8', bg: 'rgba(14,14,36,0.95)', glow: 'rgba(129,140,248,0.18)' },
    transform: { accent: '#22d3ee', bg: 'rgba(8,28,32,0.95)', glow: 'rgba(34,211,238,0.18)' },
    filter: { accent: '#fbbf24', bg: 'rgba(28,22,8,0.95)', glow: 'rgba(251,191,36,0.18)' },
    merge: { accent: '#94a3b8', bg: 'rgba(16,20,28,0.95)', glow: 'rgba(148,163,184,0.15)' },
    math: { accent: '#86efac', bg: 'rgba(10,26,16,0.95)', glow: 'rgba(134,239,172,0.18)' },
};
const getPalette = (v) => PALETTE[v] || PALETTE.text;

// ─── Auto-distribute handles vertically per side ──────────────────────────────
const placeHandles = (arr) =>
    arr.map((h, i) => ({
        ...h,
        top: arr.length === 1 ? '50%' : `${(100 / (arr.length + 1)) * (i + 1)}%`,
    }));

// ─── Individual field components ──────────────────────────────────────────────
const FieldInput = ({ field, value, onChange, accent }) => {
    const base = {
        width: '100%',
        background: 'rgba(0,0,0,0.25)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 5,
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        padding: '4px 8px',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxSizing: 'border-box',
    };

    const focusStyle = `
    .vs-input:focus {
      border-color: ${accent}66 !important;
      box-shadow: 0 0 0 2px ${accent}18 !important;
    }
    .vs-input::placeholder { color: rgba(255,255,255,0.18); }
    .vs-select option { background: #111827; }
  `;

    if (field.type === 'display') {
        return <div style={{ ...base, opacity: 0.55, cursor: 'default', padding: '5px 8px' }}>{value}</div>;
    }

    if (field.type === 'select') {
        return (
            <>
                <style>{focusStyle}</style>
                <select className="vs-input" value={value} onChange={e => onChange(e.target.value)}
                    style={{
                        ...base, cursor: 'pointer', appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23${accent.replace('#', '')}99'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                        paddingRight: 24,
                    }}>
                    {(field.options || []).map(o => (
                        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                    ))}
                </select>
            </>
        );
    }

    if (field.type === 'textarea') {
        return (
            <>
                <style>{focusStyle}</style>
                <textarea className="vs-input" value={value} onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder || ''} rows={field.rows || 3}
                    style={{ ...base, resize: 'vertical', lineHeight: 1.5 }} />
            </>
        );
    }

    return (
        <>
            <style>{focusStyle}</style>
            <input className="vs-input" type="text" value={value} onChange={e => onChange(e.target.value)}
                placeholder={field.placeholder || ''}
                style={base} />
        </>
    );
};

// ─── BaseNode ─────────────────────────────────────────────────────────────────
/**
 * Props:
 *   id            {string}
 *   title         {string}
 *   variant       {string}   – key into PALETTE
 *   icon          {string}   – emoji / symbol
 *   handles       {array}    – [{ id, type: 'source'|'target', position? }]
 *   fields        {array}    – [{ key, label, type, options?, placeholder?, rows?, defaultValue? }]
 *   fieldValues   {object}
 *   onFieldChange {fn}       – (key, value) => void
 *   children      {node}     – optional extra JSX
 *   width         {number}
 */
export const BaseNode = ({
    id,
    title,
    variant = 'text',
    icon = '◆',
    handles = [],
    fields = [],
    fieldValues = {},
    onFieldChange = () => { },
    children,
    width = 230,
}) => {
    const { accent, bg, glow } = getPalette(variant);

    const targets = placeHandles(handles.filter(h => h.type === 'target' || (!h.position && h.type === 'target')));
    const sources = placeHandles(handles.filter(h => h.type === 'source' || (!h.position && h.type === 'source')));

    return (
        <div
            style={{
                width,
                background: bg,
                border: `1px solid ${accent}44`,
                borderRadius: 12,
                boxShadow: `0 0 0 1px ${accent}11, 0 8px 32px rgba(0,0,0,0.55), 0 0 24px ${glow}`,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}33, 0 12px 40px rgba(0,0,0,0.6), 0 0 36px ${glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}11, 0 8px 32px rgba(0,0,0,0.55), 0 0 24px ${glow}`; }}
        >
            {/* Accent top bar */}
            <div style={{
                height: 2,
                background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                opacity: 0.8,
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px 6px',
                borderBottom: `1px solid ${accent}18`,
                background: `linear-gradient(180deg, ${accent}10, transparent)`,
            }}>
                <div style={{
                    width: 24, height: 24,
                    background: `${accent}22`,
                    border: `1px solid ${accent}44`,
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, flexShrink: 0,
                }}>
                    {icon}
                </div>
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 11,
                    color: accent,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    flex: 1,
                }}>
                    {title}
                </span>
                {/* ID badge */}
                <span style={{
                    fontSize: 9,
                    color: `${accent}66`,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.04em',
                }}>
                    {id?.split('-').slice(-1)[0]}
                </span>
            </div>

            {/* Body */}
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fields.map(field => (
                    <div key={field.key}>
                        <label style={{
                            display: 'block',
                            fontSize: 9,
                            color: `${accent}88`,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                            fontWeight: 600,
                        }}>
                            {field.label}
                        </label>
                        <FieldInput
                            field={field}
                            value={fieldValues[field.key] ?? field.defaultValue ?? ''}
                            onChange={val => onFieldChange(field.key, val)}
                            accent={accent}
                        />
                    </div>
                ))}
                {children}
            </div>

            {/* Target handles (left) */}
            {targets.map(h => (
                <Handle key={h.id} type="target" position={Position.Left}
                    id={`${id}-${h.id}`}
                    style={{
                        top: h.top, left: -5,
                        width: 10, height: 10,
                        background: accent,
                        border: `2px solid var(--bg-base)`,
                        borderRadius: '50%',
                        boxShadow: `0 0 6px ${accent}`,
                        transition: 'transform 0.15s',
                    }}
                />
            ))}

            {/* Source handles (right) */}
            {sources.map(h => (
                <Handle key={h.id} type="source" position={Position.Right}
                    id={`${id}-${h.id}`}
                    style={{
                        top: h.top, right: -5,
                        width: 10, height: 10,
                        background: accent,
                        border: `2px solid var(--bg-base)`,
                        borderRadius: '50%',
                        boxShadow: `0 0 6px ${accent}`,
                        transition: 'transform 0.15s',
                    }}
                />
            ))}
        </div>
    );
};

export { getPalette, PALETTE };
