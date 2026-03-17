# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Dict
from collections import defaultdict, deque

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request schema ────────────────────────────────────────────────────────────

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


# ── DAG check ─────────────────────────────────────────────────────────────────

def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """
    Return True iff the directed graph formed by nodes+edges is acyclic.
    Uses Kahn's algorithm (topological sort via in-degree queue).
    Isolated nodes (no edges) are always acyclic by definition.
    """
    node_ids = {n.id for n in nodes}

    # Build adjacency list and in-degree map restricted to known nodes
    adj: Dict[str, List[str]] = defaultdict(list)
    in_degree: Dict[str, int] = {nid: 0 for nid in node_ids}

    for edge in edges:
        src, tgt = edge.source, edge.target
        # Skip edges referencing nodes not in the payload (defensive)
        if src not in node_ids or tgt not in node_ids:
            continue
        adj[src].append(tgt)
        in_degree[tgt] += 1

    # Kahn's BFS
    queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
    visited = 0

    while queue:
        node = queue.popleft()
        visited += 1
        for neighbour in adj[node]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    # If every node was visited, no cycle exists → it's a DAG
    return visited == len(node_ids)


# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse")
def parse_pipeline(payload: PipelinePayload):
    num_nodes = len(payload.nodes)
    num_edges = len(payload.edges)
    dag       = is_dag(payload.nodes, payload.edges)

    return {
        "num_nodes": num_nodes,
        "num_edges": num_edges,
        "is_dag":    dag,
    }
