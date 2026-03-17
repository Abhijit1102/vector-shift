// nodes/textNode.js
//
// Enhancements over the base implementation:
//   1. Auto-resizing width + height — the node grows as the user types,
//      both horizontally (up to a max) and vertically (textarea auto-expands).
//   2. Dynamic variable handles — any {{ validJsVarName }} token in the text
//      creates a labelled target Handle on the left side of the node.
//      Handles are removed automatically when their variable is deleted.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { getPalette } from './BaseNode';

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_WIDTH = 240;
const MAX_WIDTH = 520;
const MIN_HEIGHT = 80;   // textarea min-height in px
const CHAR_WIDTH_PX = 7.5;  // approximate mono char width at 11px font
const LINE_HEIGHT_PX = 18;   // approximate line height
const H_PADDING = 48;   // left+right body padding + some breathing room

// Regex: {{ varName }} where varName is a valid JS identifier
// Strips surrounding whitespace inside the braces.
const VAR_REGEX = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract unique variable names from text in order of first appearance. */
const extractVariables = (text) => {
  const seen = new Set();
  const vars = [];
  let match;
  const re = new RegExp(VAR_REGEX.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      vars.push(match[1]);
    }
  }
  return vars;
};

/** Compute the node width needed to fit the longest line. */
const computeWidth = (text) => {
  if (!text) return MIN_WIDTH;
  const longestLine = text.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, longestLine * CHAR_WIDTH_PX + H_PADDING));
};

/** Compute the textarea height needed (no scroll). */
const computeTextareaHeight = (text, width) => {
  if (!text) return MIN_HEIGHT;
  const charsPerLine = Math.floor((width - H_PADDING) / CHAR_WIDTH_PX) || 30;
  const lines = text.split('\n').reduce((count, line) => {
    return count + Math.max(1, Math.ceil(line.length / charsPerLine));
  }, 0);
  return Math.max(MIN_HEIGHT, lines * LINE_HEIGHT_PX + 8);
};

// ─── Variable handle pill ─────────────────────────────────────────────────────
const VarHandle = ({ id, nodeId, label, topPct, accent }) => (
  <div style={{ position: 'absolute', left: 0, top: topPct, transform: 'translateY(-50%)' }}>
    {/* Label pill sitting to the right of the handle dot */}
    <div style={{
      position: 'absolute',
      left: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      background: `${accent}22`,
      border: `1px solid ${accent}44`,
      borderRadius: 4,
      padding: '1px 6px',
      fontSize: 9,
      fontFamily: 'var(--font-mono)',
      color: accent,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      letterSpacing: '0.05em',
    }}>
      {label}
    </div>
    <Handle
      type="target"
      position={Position.Left}
      id={`${nodeId}-${id}`}
      style={{
        position: 'relative',
        top: 'auto', left: 'auto',
        transform: 'none',
        width: 10, height: 10,
        background: accent,
        border: '2px solid var(--bg-base)',
        borderRadius: '50%',
        boxShadow: `0 0 6px ${accent}`,
        flexShrink: 0,
      }}
    />
  </div>
);

// ─── Highlighted text preview (shows {{ var }} tokens in accent color) ─────────
const HighlightedText = ({ text, accent }) => {
  if (!text) return null;
  const parts = [];
  let last = 0;
  const re = new RegExp(VAR_REGEX.source, 'g');
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    parts.push({ type: 'var', value: match[0], name: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

  return (
    <div style={{
      position: 'absolute', inset: 0,
      padding: '4px 8px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      pointerEvents: 'none',
      color: 'transparent', // base text invisible — textarea shows it
      userSelect: 'none',
    }}>
      {parts.map((p, i) =>
        p.type === 'var'
          ? <mark key={i} style={{
            background: `${accent}28`,
            color: accent,
            borderRadius: 3,
            padding: '0 1px',
            fontWeight: 600,
            boxShadow: `inset 0 0 0 1px ${accent}44`,
          }}>{p.value}</mark>
          : <span key={i} style={{ color: 'transparent' }}>{p.value}</span>
      )}
    </div>
  );
};

// ─── TextNode ─────────────────────────────────────────────────────────────────
export const TextNode = ({ id, data }) => {
  const [text, setText] = useState(data?.text || '{{input}}');
  const textareaRef = useRef(null);
  const { accent, bg, glow } = getPalette('text');

  // Derived dimensions
  const nodeWidth = useMemo(() => computeWidth(text), [text]);
  const textareaHeight = useMemo(() => computeTextareaHeight(text, nodeWidth), [text, nodeWidth]);

  // Derived variable list
  const variables = useMemo(() => extractVariables(text), [text]);

  // Left-side padding must grow to make room for handle label pills
  const hasVars = variables.length > 0;
  const bodyPadLeft = hasVars ? 28 : 12;

  const handleChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  // Auto-focus textarea height via ref (belt-and-suspenders alongside CSS)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${textareaHeight}px`;
    }
  }, [textareaHeight]);

  // Vertical positions for variable handles, evenly distributed over node body height
  // Body starts ~42px from top (header) and has 10px padding top/bottom
  const HEADER_HEIGHT = 42;
  const FOOTER_PAD = 10;
  const bodyHeight = textareaHeight + 20 + FOOTER_PAD; // textarea + label + padding
  const totalHeight = HEADER_HEIGHT + bodyHeight;

  const handleTopPx = (i) => {
    if (variables.length === 1) return HEADER_HEIGHT + bodyHeight / 2;
    const step = bodyHeight / (variables.length + 1);
    return HEADER_HEIGHT + step * (i + 1);
  };

  return (
    <div
      style={{
        width: nodeWidth,
        background: bg,
        border: `1px solid ${accent}44`,
        borderRadius: 12,
        boxShadow: `0 0 0 1px ${accent}11, 0 8px 32px rgba(0,0,0,0.55), 0 0 24px ${glow}`,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-primary)',
        position: 'relative',
        transition: 'width 0.15s ease, box-shadow 0.2s ease',
        // overflow visible so handle label pills can overflow left edge
        overflow: 'visible',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}33, 0 12px 40px rgba(0,0,0,0.6), 0 0 36px ${glow}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}11, 0 8px 32px rgba(0,0,0,0.55), 0 0 24px ${glow}`; }}
    >
      {/* Accent top bar */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.8,
        borderRadius: '12px 12px 0 0',
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
        }}>T</div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 11,
          color: accent,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          flex: 1,
        }}>
          Text
        </span>
        {/* Variable count badge */}
        {variables.length > 0 && (
          <span style={{
            fontSize: 9,
            background: `${accent}22`,
            border: `1px solid ${accent}44`,
            color: accent,
            borderRadius: 10,
            padding: '1px 6px',
            letterSpacing: '0.05em',
          }}>
            {variables.length} var{variables.length !== 1 ? 's' : ''}
          </span>
        )}
        <span style={{ fontSize: 9, color: `${accent}66`, fontFamily: 'var(--font-mono)' }}>
          {id?.split('-').slice(-1)[0]}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: `10px 12px 10px ${bodyPadLeft}px`, transition: 'padding-left 0.15s ease' }}>
        <label style={{
          display: 'block',
          fontSize: 9,
          color: `${accent}88`,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 4,
          fontWeight: 600,
        }}>
          Content
        </label>

        {/* Textarea wrapper — houses both the real textarea and highlight overlay */}
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            placeholder="Type text or use {{ variable }} to add inputs"
            style={{
              width: '100%',
              height: textareaHeight,
              minHeight: MIN_HEIGHT,
              background: 'rgba(0,0,0,0.25)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 5,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              lineHeight: 1.6,
              padding: '4px 8px',
              outline: 'none',
              resize: 'none',         // we handle sizing programmatically
              overflow: 'hidden',     // no scrollbar — node grows instead
              boxSizing: 'border-box',
              transition: 'height 0.1s ease, border-color 0.15s, box-shadow 0.15s',
              position: 'relative',
              zIndex: 1,
            }}
            onFocus={e => {
              e.target.style.borderColor = `${accent}66`;
              e.target.style.boxShadow = `0 0 0 2px ${accent}18`;
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.08)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Hint line */}
        {variables.length === 0 && (
          <div style={{ marginTop: 6, fontSize: 9, color: `${accent}44`, letterSpacing: '0.06em' }}>
            Tip: use <span style={{ color: `${accent}88` }}>{'{{ varName }}'}</span> to create input handles
          </div>
        )}
      </div>

      {/* ── Dynamic variable handles on the left ── */}
      {variables.map((varName, i) => {
        const topPx = handleTopPx(i);
        return (
          <div
            key={varName}
            style={{
              position: 'absolute',
              left: 0,
              top: topPx,
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 0,
            }}
          >
            {/* Label pill */}
            <div style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: `${accent}1a`,
              border: `1px solid ${accent}44`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: accent,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              letterSpacing: '0.05em',
              zIndex: 10,
            }}>
              {varName}
            </div>

            {/* The actual handle */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${id}-${varName}`}
              style={{
                top: 'auto',
                left: -5,
                position: 'absolute',
                width: 10,
                height: 10,
                background: accent,
                border: '2px solid var(--bg-base)',
                borderRadius: '50%',
                boxShadow: `0 0 6px ${accent}`,
                transform: 'none',
                zIndex: 10,
              }}
            />
          </div>
        );
      })}

      {/* Static source handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-output`}
        style={{
          top: '50%',
          right: -5,
          width: 10,
          height: 10,
          background: accent,
          border: '2px solid var(--bg-base)',
          borderRadius: '50%',
          boxShadow: `0 0 6px ${accent}`,
        }}
      />
    </div>
  );
};
