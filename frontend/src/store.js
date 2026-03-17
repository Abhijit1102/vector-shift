// store.js
import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';

const API = 'http://localhost:8000';
const MAX_HISTORY = 60;

const snapshot = (nodes, edges) => ({
  nodes: JSON.parse(JSON.stringify(nodes)),
  edges: JSON.parse(JSON.stringify(edges)),
});

export const useStore = create((set, get) => ({
  // ── Canvas ──────────────────────────────────────────────────────────────────
  nodes: [],
  edges: [],
  nodeIDs: {},

  // ── History ─────────────────────────────────────────────────────────────────
  past: [],
  future: [],

  // ── Meta ────────────────────────────────────────────────────────────────────
  pipelineName: 'Untitled Pipeline',
  savedPipelines: [],
  templates: [],

  // ── Toast ────────────────────────────────────────────────────────────────────
  toast: null,

  // ── Context menu (node right-click) ─────────────────────────────────────────
  contextMenu: null,   // { nodeId, x, y } | null

  // ── Internal history helper ──────────────────────────────────────────────────
  _push: () => {
    const { nodes, edges, past } = get();
    set({ past: [...past, snapshot(nodes, edges)].slice(-MAX_HISTORY), future: [] });
  },

  // ── Node ID ──────────────────────────────────────────────────────────────────
  getNodeID: (type) => {
    const ids = { ...get().nodeIDs };
    ids[type] = (ids[type] ?? 0) + 1;
    set({ nodeIDs: ids });
    return `${type}-${ids[type]}`;
  },

  // ── Canvas mutations ─────────────────────────────────────────────────────────
  addNode: (node) => { get()._push(); set({ nodes: [...get().nodes, node] }); },

  onNodesChange: (changes) => {
    if (changes.some(c => c.type === 'remove')) get()._push();
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    if (changes.some(c => c.type === 'remove')) get()._push();
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get()._push();
    set({
      edges: addEdge({
        ...connection,
        type: 'smoothstep', animated: true,
        markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
      }, get().edges),
    });
  },

  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, [fieldName]: fieldValue } } : n
      ),
    });
  },

  // ── Duplicate node ───────────────────────────────────────────────────────────
  duplicateNode: (nodeId) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node) return;
    get()._push();
    const newId = get().getNodeID(node.type);
    const newNode = {
      ...JSON.parse(JSON.stringify(node)),
      id: newId,
      position: { x: node.position.x + 30, y: node.position.y + 30 },
      data: { ...JSON.parse(JSON.stringify(node.data)), id: newId },
      selected: false,
    };
    set({ nodes: [...get().nodes, newNode] });
    get().showToast(`Duplicated node`, 'info');
  },

  // ── Delete node ──────────────────────────────────────────────────────────────
  deleteNode: (nodeId) => {
    get()._push();
    set({
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    });
    get().showToast('Node deleted', 'info');
  },

  // ── Context menu ─────────────────────────────────────────────────────────────
  openContextMenu: (nodeId, x, y) => set({ contextMenu: { nodeId, x, y } }),
  closeContextMenu: () => set({ contextMenu: null }),

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  undo: () => {
    const { past, nodes, edges, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1), nodes: prev.nodes, edges: prev.edges,
      future: [snapshot(nodes, edges), ...future].slice(0, MAX_HISTORY)
    });
  },
  redo: () => {
    const { past, nodes, edges, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      future: future.slice(1), nodes: next.nodes, edges: next.edges,
      past: [...past, snapshot(nodes, edges)].slice(-MAX_HISTORY)
    });
  },
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // ── Clear ────────────────────────────────────────────────────────────────────
  clearCanvas: () => { get()._push(); set({ nodes: [], edges: [], nodeIDs: {} }); },

  // ── Pipeline name ─────────────────────────────────────────────────────────────
  setPipelineName: (name) => set({ pipelineName: name }),

  // ── Toast ─────────────────────────────────────────────────────────────────────
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3200);
  },

  // ── Export pipeline as JSON file ──────────────────────────────────────────────
  exportPipeline: () => {
    const { nodes, edges, pipelineName } = get();
    const blob = new Blob(
      [JSON.stringify({ name: pipelineName, nodes, edges }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pipelineName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    get().showToast('Pipeline exported as JSON', 'success');
  },

  // ── Import pipeline from JSON file ────────────────────────────────────────────
  importPipeline: (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.nodes || !data.edges) throw new Error('Invalid pipeline file');
        get()._push();
        set({
          nodes: data.nodes, edges: data.edges,
          pipelineName: data.name || 'Imported Pipeline', nodeIDs: {}
        });
        get().showToast(`Imported "${data.name || 'pipeline'}"`, 'success');
      } catch (err) {
        get().showToast(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  },

  // ── Load template ─────────────────────────────────────────────────────────────
  loadTemplate: (template) => {
    get()._push();
    set({
      nodes: template.nodes,
      edges: template.edges,
      pipelineName: template.name,
      nodeIDs: {},
    });
    get().showToast(`Template "${template.name}" loaded`, 'success');
  },

  // ── Fetch templates from backend ──────────────────────────────────────────────
  fetchTemplates: async () => {
    try {
      const res = await fetch(`${API}/templates`);
      const data = await res.json();
      set({ templates: data.templates || [] });
    } catch (_) { /* offline — ignore */ }
  },

  // ── Save pipeline to backend ──────────────────────────────────────────────────
  savePipeline: async () => {
    const { nodes, edges, pipelineName, showToast } = get();
    try {
      const res = await fetch(`${API}/pipelines/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pipelineName, nodes, edges }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      showToast(`Saved "${data.name}"`, 'success');
      get().fetchSavedPipelines();
      return data;
    } catch (e) { showToast(`Save failed: ${e.message}`, 'error'); return null; }
  },

  // ── Load pipeline from backend ────────────────────────────────────────────────
  loadPipeline: async (id) => {
    const { showToast, _push } = get();
    try {
      const res = await fetch(`${API}/pipelines/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      _push();
      set({
        nodes: data.nodes, edges: data.edges,
        pipelineName: data.name, nodeIDs: {}
      });
      showToast(`Loaded "${data.name}"`, 'success');
    } catch (e) { showToast(`Load failed: ${e.message}`, 'error'); }
  },

  // ── Fetch saved pipeline list ─────────────────────────────────────────────────
  fetchSavedPipelines: async () => {
    try {
      const res = await fetch(`${API}/pipelines`);
      const data = await res.json();
      set({ savedPipelines: data.pipelines });
    } catch (_) { /* offline */ }
  },

  // ── Delete saved pipeline ─────────────────────────────────────────────────────
  deleteSavedPipeline: async (id) => {
    const { showToast } = get();
    try {
      await fetch(`${API}/pipelines/${id}`, { method: 'DELETE' });
      showToast('Pipeline deleted', 'info');
      get().fetchSavedPipelines();
    } catch (e) { showToast(`Delete failed: ${e.message}`, 'error'); }
  },
}));
