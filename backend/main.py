# main.py — VectorShift Pipeline API
import json, os, uuid
from collections import defaultdict, deque
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

app = FastAPI(title="VectorShift Pipeline API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAVE_DIR = os.path.join(os.path.dirname(__file__), "saved_pipelines")
os.makedirs(SAVE_DIR, exist_ok=True)


# ── Schemas ───────────────────────────────────────────────────────────────────

class Node(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str

class Edge(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    source: str
    target: str

class PipelinePayload(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class SavePayload(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


# ── Graph helpers ─────────────────────────────────────────────────────────────

def build_graph(nodes: List[Node], edges: List[Edge]):
    node_ids  = {n.id for n in nodes}
    adj       = defaultdict(list)
    in_degree = {nid: 0 for nid in node_ids}
    for e in edges:
        if e.source in node_ids and e.target in node_ids:
            adj[e.source].append(e.target)
            in_degree[e.target] += 1
    return node_ids, adj, in_degree


def topological_sort(nodes: List[Node], edges: List[Edge]) -> Optional[List[str]]:
    """Kahn's algorithm. Returns ordered IDs or None if cycle exists."""
    node_ids, adj, in_degree = build_graph(nodes, edges)
    queue = deque(nid for nid, d in in_degree.items() if d == 0)
    order = []
    while queue:
        nid = queue.popleft()
        order.append(nid)
        for nb in adj[nid]:
            in_degree[nb] -= 1
            if in_degree[nb] == 0:
                queue.append(nb)
    return order if len(order) == len(node_ids) else None


def validate_pipeline(nodes: List[Node], edges: List[Edge]) -> List[Dict[str, str]]:
    """
    Return structured validation warnings with severity levels.
    Each item: { severity: 'error'|'warning'|'info', message: str }
    """
    issues = []
    node_ids = {n.id for n in nodes}

    if not nodes:
        issues.append({"severity": "error", "message": "Pipeline has no nodes."})
        return issues

    has_in, has_out = set(), set()
    for e in edges:
        if e.source in node_ids: has_out.add(e.source)
        if e.target in node_ids: has_in.add(e.target)

    isolated = node_ids - has_in - has_out
    if isolated:
        issues.append({"severity": "warning", "message": f"{len(isolated)} isolated node(s) with no connections."})

    sources = [n.id for n in nodes if n.id not in has_in]
    sinks   = [n.id for n in nodes if n.id not in has_out]

    if len(sources) == 0:
        issues.append({"severity": "error", "message": "No source nodes (all nodes have incoming edges — likely a cycle)."})
    if len(sinks) == 0:
        issues.append({"severity": "error", "message": "No sink nodes (all nodes have outgoing edges — likely a cycle)."})
    if len(nodes) == 1 and len(edges) == 0:
        issues.append({"severity": "info", "message": "Pipeline has a single unconnected node."})
    if len(edges) > len(nodes) * 3:
        issues.append({"severity": "warning", "message": "High edge-to-node ratio — consider simplifying the pipeline."})

    return issues


def simulate_execution(nodes: List[Node], topo_order: List[str]) -> List[Dict[str, Any]]:
    """
    Walk the topological order and produce a simulated execution log.
    Each step describes what the node type would do conceptually.
    """
    node_map = {n.id: n for n in nodes}
    log = []
    for step, nid in enumerate(topo_order):
        node = node_map.get(nid)
        node_type = getattr(node, "type", "unknown") if node else "unknown"
        action = {
            "customInput":  "Read input data",
            "customOutput": "Write output data",
            "llm":          "Run language model inference",
            "text":         "Render text template",
            "api":          "Send HTTP request",
            "transform":    "Apply data transformation",
            "filter":       "Evaluate condition and route",
            "merge":        "Merge incoming data streams",
            "math":         "Evaluate numeric expression",
        }.get(node_type, "Execute node logic")

        log.append({
            "step":      step + 1,
            "node_id":   nid,
            "node_type": node_type,
            "action":    action,
            "status":    "pending",
        })
    return log


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "VectorShift Pipeline API v2 running"}


@app.post("/pipelines/parse")
def parse_pipeline(payload: PipelinePayload):
    """
    Full pipeline analysis:
    - Node/edge counts
    - DAG check
    - Topological execution order
    - Structured validation issues
    - Simulated execution plan
    """
    topo_order = topological_sort(payload.nodes, payload.edges)
    is_dag     = topo_order is not None
    issues     = validate_pipeline(payload.nodes, payload.edges)
    exec_plan  = simulate_execution(payload.nodes, topo_order) if is_dag else []

    return {
        "num_nodes":  len(payload.nodes),
        "num_edges":  len(payload.edges),
        "is_dag":     is_dag,
        "topo_order": topo_order or [],
        "issues":     issues,
        "exec_plan":  exec_plan,
    }


@app.post("/pipelines/save")
def save_pipeline(payload: SavePayload):
    pid    = str(uuid.uuid4())[:8]
    record = {
        "id": pid, "name": payload.name,
        "nodes": payload.nodes, "edges": payload.edges,
        "created_at": datetime.utcnow().isoformat(),
    }
    with open(os.path.join(SAVE_DIR, f"{pid}.json"), "w") as f:
        json.dump(record, f, indent=2)
    return {"id": pid, "name": payload.name, "created_at": record["created_at"]}


@app.get("/pipelines")
def list_pipelines():
    out = []
    for fname in sorted(os.listdir(SAVE_DIR)):
        if not fname.endswith(".json"): continue
        with open(os.path.join(SAVE_DIR, fname)) as f:
            r = json.load(f)
        out.append({"id": r["id"], "name": r["name"],
                    "num_nodes": len(r["nodes"]), "num_edges": len(r["edges"]),
                    "created_at": r["created_at"]})
    return {"pipelines": out}


@app.get("/pipelines/{pid}")
def load_pipeline(pid: str):
    path = os.path.join(SAVE_DIR, f"{pid}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"Pipeline '{pid}' not found.")
    with open(path) as f:
        return json.load(f)


@app.delete("/pipelines/{pid}")
def delete_pipeline(pid: str):
    path = os.path.join(SAVE_DIR, f"{pid}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"Pipeline '{pid}' not found.")
    os.remove(path)
    return {"deleted": pid}


@app.get("/templates")
def list_templates():
    """Return built-in starter pipeline templates."""
    return {"templates": TEMPLATES}


# ── Built-in templates ────────────────────────────────────────────────────────

TEMPLATES = [
    {
        "id": "basic-rag",
        "name": "Basic RAG",
        "description": "Retrieve context then generate an answer with an LLM.",
        "nodes": [
            {"id": "customInput-1", "type": "customInput", "position": {"x": 60,  "y": 160}, "data": {"id": "customInput-1", "nodeType": "customInput", "inputName": "query",   "inputType": "Text"}},
            {"id": "customInput-2", "type": "customInput", "position": {"x": 60,  "y": 280}, "data": {"id": "customInput-2", "nodeType": "customInput", "inputName": "context", "inputType": "Text"}},
            {"id": "text-1",        "type": "text",        "position": {"x": 320, "y": 200}, "data": {"id": "text-1",        "nodeType": "text",        "text": "Context: {{context}}\n\nQuestion: {{query}}"}},
            {"id": "llm-1",         "type": "llm",         "position": {"x": 580, "y": 200}, "data": {"id": "llm-1",         "nodeType": "llm",         "model": "gpt-4o"}},
            {"id": "customOutput-1","type": "customOutput","position": {"x": 820, "y": 200}, "data": {"id": "customOutput-1","nodeType": "customOutput","outputName": "answer",  "outputType": "Text"}},
        ],
        "edges": [
            {"id": "e1", "source": "customInput-1", "target": "text-1",        "sourceHandle": "customInput-1-value", "targetHandle": "text-1-query"},
            {"id": "e2", "source": "customInput-2", "target": "text-1",        "sourceHandle": "customInput-2-value", "targetHandle": "text-1-context"},
            {"id": "e3", "source": "text-1",        "target": "llm-1",         "sourceHandle": "text-1-output",       "targetHandle": "llm-1-prompt"},
            {"id": "e4", "source": "llm-1",         "target": "customOutput-1","sourceHandle": "llm-1-response",      "targetHandle": "customOutput-1-value"},
        ],
    },
    {
        "id": "summarizer",
        "name": "Summarizer",
        "description": "Feed a document into an LLM to produce a summary.",
        "nodes": [
            {"id": "customInput-1", "type": "customInput", "position": {"x": 60,  "y": 200}, "data": {"id": "customInput-1", "nodeType": "customInput", "inputName": "document", "inputType": "Text"}},
            {"id": "text-1",        "type": "text",        "position": {"x": 300, "y": 200}, "data": {"id": "text-1",        "nodeType": "text",        "text": "Summarise the following document in 3 bullet points:\n\n{{document}}"}},
            {"id": "llm-1",         "type": "llm",         "position": {"x": 560, "y": 200}, "data": {"id": "llm-1",         "nodeType": "llm",         "model": "gpt-4o"}},
            {"id": "customOutput-1","type": "customOutput","position": {"x": 800, "y": 200}, "data": {"id": "customOutput-1","nodeType": "customOutput","outputName": "summary",  "outputType": "Text"}},
        ],
        "edges": [
            {"id": "e1", "source": "customInput-1", "target": "text-1",        "sourceHandle": "customInput-1-value", "targetHandle": "text-1-document"},
            {"id": "e2", "source": "text-1",        "target": "llm-1",         "sourceHandle": "text-1-output",       "targetHandle": "llm-1-prompt"},
            {"id": "e3", "source": "llm-1",         "target": "customOutput-1","sourceHandle": "llm-1-response",      "targetHandle": "customOutput-1-value"},
        ],
    },
    {
        "id": "api-transform",
        "name": "API + Transform",
        "description": "Call an API, extract a field, then output the result.",
        "nodes": [
            {"id": "customInput-1", "type": "customInput", "position": {"x": 60,  "y": 200}, "data": {"id": "customInput-1", "nodeType": "customInput", "inputName": "query", "inputType": "Text"}},
            {"id": "api-1",         "type": "api",         "position": {"x": 300, "y": 200}, "data": {"id": "api-1",         "nodeType": "api",         "url": "https://api.example.com/search", "method": "GET"}},
            {"id": "transform-1",   "type": "transform",   "position": {"x": 560, "y": 200}, "data": {"id": "transform-1",   "nodeType": "transform",   "operation": "Extract Field", "expression": "data.results[0]"}},
            {"id": "customOutput-1","type": "customOutput","position": {"x": 800, "y": 200}, "data": {"id": "customOutput-1","nodeType": "customOutput","outputName": "result", "outputType": "Text"}},
        ],
        "edges": [
            {"id": "e1", "source": "customInput-1", "target": "api-1",         "sourceHandle": "customInput-1-value",  "targetHandle": "api-1-body"},
            {"id": "e2", "source": "api-1",         "target": "transform-1",   "sourceHandle": "api-1-response",       "targetHandle": "transform-1-in"},
            {"id": "e3", "source": "transform-1",   "target": "customOutput-1","sourceHandle": "transform-1-out",      "targetHandle": "customOutput-1-value"},
        ],
    },
]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
