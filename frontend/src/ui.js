// ui.js
import { useCallback, useRef, useState } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { shallow } from 'zustand/shallow';
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

const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  api: ApiNode,
  transform: TransformNode,
  filter: FilterNode,
  merge: MergeNode,
  math: MathNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

// Empty canvas hint
const EmptyHint = ({ visible }) => visible ? (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none', zIndex: 1,
    animation: 'fadeSlideIn 0.5s ease',
  }}>
    <div style={{
      width: 72, height: 72,
      border: '2px dashed rgba(0,212,170,0.25)',
      borderRadius: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28, color: 'rgba(0,212,170,0.3)',
      marginBottom: 16,
    }}>⟁</div>
    <p style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      Drag nodes from the toolbar to begin
    </p>
  </div>
) : null;

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const { nodes, edges, getNodeID, addNode, onNodesChange, onEdgesChange, onConnect } = useStore(selector, shallow);

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
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        connectionLineType='smoothstep'
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={gridSize}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const map = {
              customInput: '#38bdf8', llm: '#34d399', customOutput: '#a78bfa',
              text: '#fb7185', api: '#818cf8', transform: '#22d3ee',
              filter: '#fbbf24', merge: '#94a3b8', math: '#86efac',
            };
            return map[node.type] || '#64748b';
          }}
          maskColor="rgba(8,12,20,0.7)"
        />
      </ReactFlow>
    </div>
  );
};
