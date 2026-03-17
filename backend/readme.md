# VectorShift Backend

A lightweight Python/FastAPI backend that provides pipeline graph analysis, persistence, and template serving for the VectorShift Pipeline Studio frontend.

---

## Requirements

- Python 3.10 or higher
- pip

---

## Installation

```bash
cd backend
pip install fastapi uvicorn pydantic
```

---

## Running

```bash
# Option A — direct (recommended)
python main.py

# Option B — uvicorn CLI
uvicorn main:app --reload
```

The server starts at **http://localhost:8000**.

Verify it is running:
```bash
curl http://localhost:8000
# → {"status": "VectorShift Pipeline API v2 running"}
```

Interactive API docs are available at **http://localhost:8000/docs** (Swagger UI).

---

## Project structure

```
backend/
├── main.py               ← All API logic (single file)
└── saved_pipelines/      ← Auto-created on first run; stores .json pipeline files
    ├── abc12345.json
    └── ...
```

---

## Endpoints

### `POST /pipelines/parse`

Analyses a pipeline graph and returns a full diagnostic report.

**Request body**
```json
{
  "nodes": [{ "id": "customInput-1", "type": "customInput" }],
  "edges": [{ "id": "e1", "source": "customInput-1", "target": "llm-1" }]
}
```

**Response**
```json
{
  "num_nodes": 2,
  "num_edges": 1,
  "is_dag": true,
  "topo_order": ["customInput-1", "llm-1"],
  "issues": [
    { "severity": "info", "message": "Pipeline has a single unconnected node." }
  ],
  "exec_plan": [
    { "step": 1, "node_id": "customInput-1", "node_type": "customInput", "action": "Read input data", "status": "pending" },
    { "step": 2, "node_id": "llm-1",         "node_type": "llm",         "action": "Run language model inference", "status": "pending" }
  ]
}
```

| Field        | Type       | Description                                              |
|--------------|------------|----------------------------------------------------------|
| `num_nodes`  | `int`      | Total number of nodes in the pipeline                    |
| `num_edges`  | `int`      | Total number of edges (connections)                      |
| `is_dag`     | `bool`     | Whether the graph is a Directed Acyclic Graph            |
| `topo_order` | `string[]` | Node IDs in topological execution order (empty if cycle) |
| `issues`     | `object[]` | Validation issues with severity levels                   |
| `exec_plan`  | `object[]` | Simulated execution plan (empty if cycle)                |

**Issue severity levels**

| Severity  | Meaning                                          |
|-----------|--------------------------------------------------|
| `error`   | Prevents valid execution (e.g. cycle detected)   |
| `warning` | Potential problem (e.g. isolated nodes)          |
| `info`    | Informational observation                        |

---

### `POST /pipelines/save`

Saves a named pipeline to disk and returns its generated ID.

**Request body**
```json
{
  "name": "My RAG Pipeline",
  "nodes": [...],
  "edges": [...]
}
```

**Response**
```json
{
  "id": "abc12345",
  "name": "My RAG Pipeline",
  "created_at": "2024-01-15T10:30:00"
}
```

---

### `GET /pipelines`

Returns a summary list of all saved pipelines.

**Response**
```json
{
  "pipelines": [
    {
      "id": "abc12345",
      "name": "My RAG Pipeline",
      "num_nodes": 4,
      "num_edges": 3,
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

### `GET /pipelines/{id}`

Loads the full node/edge data for a saved pipeline.

```bash
curl http://localhost:8000/pipelines/abc12345
```

Returns 404 if the pipeline ID does not exist.

---

### `DELETE /pipelines/{id}`

Deletes a saved pipeline by ID.

```bash
curl -X DELETE http://localhost:8000/pipelines/abc12345
```

**Response**
```json
{ "deleted": "abc12345" }
```

---

### `GET /templates`

Returns all built-in starter pipeline templates.

**Response**
```json
{
  "templates": [
    {
      "id": "basic-rag",
      "name": "Basic RAG",
      "description": "Retrieve context then generate an answer with an LLM.",
      "nodes": [...],
      "edges": [...]
    }
  ]
}
```

**Built-in templates**

| ID               | Name             | Description                                         |
|------------------|------------------|-----------------------------------------------------|
| `basic-rag`      | Basic RAG        | Two inputs → Text prompt → LLM → Output             |
| `summarizer`     | Summarizer       | Document input → Text template → LLM → Summary out  |
| `api-transform`  | API + Transform  | Input → API Call → Extract field → Output           |

---

## DAG detection — how it works

The backend uses **Kahn's algorithm** (BFS topological sort):

1. Build an adjacency list and in-degree map from all edges
2. Seed a queue with every node that has zero incoming edges
3. Repeatedly dequeue a node, decrement its neighbours' in-degrees, and enqueue any that reach zero
4. If the number of processed nodes equals the total node count → no cycle → valid DAG
5. If any nodes remain unprocessed → a cycle exists → not a DAG

Time complexity: **O(V + E)** where V = nodes, E = edges.

---

## Validation rules

| Rule | Severity |
|------|----------|
| Pipeline has no nodes | error |
| Every node has an incoming edge (likely a cycle) | error |
| Every node has an outgoing edge (likely a cycle) | error |
| One or more isolated nodes with no connections | warning |
| Edge-to-node ratio is unusually high | warning |
| Pipeline has exactly one unconnected node | info |

---

## Storage

Pipelines are stored as individual JSON files in `./saved_pipelines/`. Each file is named `{id}.json` where the ID is the first 8 characters of a UUID4. No database is required.

---

## CORS

The server allows requests from `http://localhost:3000` (the default React dev server). To change this, update the `allow_origins` list in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-production-domain.com"],
    ...
)
```
