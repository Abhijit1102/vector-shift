// ui.js
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { shallow } from 'zustand/shallow';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeErrorBoundary } from './NodeErrorBoundary';
import { ApiNode } from './nodes/apiNode';
import { FilterNode } from './nodes/filterNode';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { MathNode } from './nodes/mathNode';
import { MergeNode } from './nodes/mergeNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { TransformNode } from './nodes/transformNode';
import { useStore } from './store';

const gridSize = 20;
const proOptions = { hideAttribution: true };

// ── Wrap every node in an error boundary ─────────────────────────────────────
const withBoundary = (NodeComponent) => (props) => (
  <NodeErrorBoundary><NodeComponent {...props} /></NodeErrorBoundary>
);

const nodeTypes = {
  customInput: withBoundary(InputNode),
  llm: withBoundary(LLMNode),
  customOutput: withBoundary(OutputNode),
  text: withBoundary(TextNode),
  api: withBoundary(ApiNode),
  transform: withBoundary(TransformNode),
  filter: withBoundary(FilterNode),
  merge: withBoundary(MergeNode),
  math: withBoundary(MathNode),
};

// ── Custom edge with hover label ──────────────────────────────────────────────
const LabeledEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd, style,
}) => {
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  return (
    <>
      {/* Invisible fat hit area */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={16}
        stroke="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: hovered ? '#00d4aa' : 'rgba(0,212,170,0.55)',
          strokeWidth: hovered ? 2 : 1.5,
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
      />
      {hovered && data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: '#0d1220',
              border: '1px solid rgba(0,212,170,0.4)',
              borderRadius: 5,
              padding: '2px 8px',
              fontSize: 10,
              color: '#00d4aa',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const edgeTypes = { smoothstep: LabeledEdge };

const selector = (s) => ({
  nodes: s.nodes, edges: s.edges,
  getNodeID: s.getNodeID, addNode: s.addNode,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  onConnect: s.onConnect,
  undo: s.undo, redo: s.redo,
  canUndo: s.canUndo, canRedo: s.canRedo,
  openContextMenu: s.openContextMenu,
});

// Empty canvas hint
const EmptyHint = ({ visible }) => visible ? (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none', zIndex: 1,
  }}>
    <div style={{ width: 72, height: 72, border: '2px dashed rgba(0,212,170,0.18)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'rgba(0,212,170,0.22)', marginBottom: 16 }}>⟁</div>
    <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Drag nodes from the toolbar to begin</p>
    <p style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 8, opacity: 0.5 }}>Ctrl+Z undo · Ctrl+Y redo · Del remove · Right-click node for options</p>
  </div>
) : null;

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const {
    nodes, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect,
    undo, redo, canUndo, canRedo,
    openContextMenu,
  } = useStore(selector, shallow);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo()) undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); if (canRedo()) redo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo, canUndo, canRedo]);

  // ── Right-click on a node ───────────────────────────────────────────────────
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    openContextMenu(node.id, event.clientX, event.clientY);
  }, [openContextMenu]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    if (event?.dataTransfer?.getData('application/reactflow')) {
      const { nodeType: type } = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      if (!type) return;
      const position = rfInstance.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      const nodeID = getNodeID(type);
      addNode({ id: nodeID, type, position, data: { id: nodeID, nodeType: type } });
    }
  }, [rfInstance]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <EmptyHint visible={nodes.length === 0} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setRfInstance}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        connectionLineType='smoothstep'
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1} color="rgba(255,255,255,0.05)" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const map = { customInput: '#38bdf8', llm: '#34d399', customOutput: '#a78bfa', text: '#fb7185', api: '#818cf8', transform: '#22d3ee', filter: '#fbbf24', merge: '#94a3b8', math: '#86efac' };
            return map[node.type] || '#64748b';
          }}
          maskColor="rgba(8,12,20,0.75)"
        />
      </ReactFlow>
      <NodeContextMenu />
    </div>
  );
};
