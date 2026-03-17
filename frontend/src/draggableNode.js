// draggableNode.js
import { useState } from 'react';

export const DraggableNode = ({ type, label, icon = '◆', color = '#00d4aa' }) => {
  const [dragging, setDragging] = useState(false);

  const onDragStart = (event) => {
    setDragging(true);
    const appData = { nodeType: type };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={() => setDragging(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${color}33`,
        background: dragging ? `${color}22` : `${color}11`,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        flexShrink: 0,
        transition: 'all 0.15s ease',
        transform: dragging ? 'scale(0.95)' : 'scale(1)',
        // hover done via onMouseEnter/Leave for JS-only styles
      }}
      onMouseEnter={e => {
        if (!dragging) {
          e.currentTarget.style.background = `${color}22`;
          e.currentTarget.style.borderColor = `${color}66`;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 4px 12px ${color}22`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${color}11`;
        e.currentTarget.style.borderColor = `${color}33`;
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        color,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  );
};
