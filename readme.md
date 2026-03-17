# VectorShift Pipeline Studio

A full-stack visual pipeline builder that lets you design, connect, analyse, save, and execute AI workflows through a drag-and-drop canvas interface.

---

## What it does

- **Drag nodes** from the toolbar onto an infinite canvas
- **Connect handles** between nodes to define data flow
- **Analyse** the pipeline graph — node/edge counts, DAG validation, execution order, and issue detection
- **Save and load** pipelines to/from a backend store
- **Export and import** pipelines as JSON files
- **Start from templates** — pre-built pipelines for common AI patterns
- **Undo / redo** every action with full history

---

## Project structure

```
vector-shift/
├── README.md                  ← You are here
├── backend/
│   ├── README.md              ← Backend-specific docs
│   ├── main.py                ← FastAPI application
│   └── saved_pipelines/       ← Auto-created; stores pipeline JSON files
└── frontend/
    ├── README.md              ← Frontend-specific docs
    ├── package.json
    └── src/
        ├── App.js
        ├── store.js
        ├── toolbar.js
        ├── ui.js
        ├── submit.js
        └── nodes/
            ├── BaseNode.js
            └── ...
```

---

## Quick start

You need **two terminals** — one for the backend, one for the frontend.

### 1 — Start the backend

```bash
cd backend
pip install fastapi uvicorn pydantic
python main.py
# → Running on http://localhost:8000
```

### 2 — Start the frontend

```bash
cd frontend
npm install
npm start
# → Running on http://localhost:3000
```

### 3 — Open the app

Navigate to **http://localhost:3000** in your browser.

---

## Tech stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | React 18, ReactFlow, Zustand                        |
| Backend  | Python 3.10+, FastAPI, Pydantic V2                  |
| Styling  | CSS variables, Google Fonts (Syne + JetBrains Mono) |
| Storage  | Flat-file JSON (no database needed)                 |

---

## Features at a glance

| Feature                            | Where                            |
| ---------------------------------- | -------------------------------- |
| 9 draggable node types             | Toolbar palette                  |
| Node tooltips                      | Hover over any toolbar node      |
| Auto-resizing Text node            | Text node textarea               |
| `{{ variable }}` handle generation | Text node                        |
| Right-click context menu           | Any canvas node                  |
| Duplicate / delete nodes           | Context menu                     |
| Undo / Redo                        | Ctrl+Z / Ctrl+Y or toolbar       |
| Edge hover labels                  | Hover any connection edge        |
| DAG analysis + execution plan      | Run Pipeline button              |
| Severity-graded issue warnings     | Analysis modal → Issues tab      |
| Save / load pipelines              | Backend REST API                 |
| Export pipeline as JSON            | Toolbar → Export                 |
| Import pipeline from JSON          | Toolbar → Import                 |
| Starter templates                  | Toolbar → Templates              |
| Per-node React error boundaries    | Automatic (no setup needed)      |
| Toast notifications                | Automatic on save / load / error |

---

## Assessment parts completed

| Part | Description                                   | Status |
| ---- | --------------------------------------------- | ------ |
| 1    | Node abstraction + 5 new nodes                | ✅     |
| 2    | Unified styling system                        | ✅     |
| 3    | Text node auto-resize + variable handles      | ✅     |
| 4    | Backend integration + pipeline analysis alert | ✅     |
| +    | All suggested improvements                    | ✅     |

---

## API overview

| Method   | Endpoint           | Description                      |
| -------- | ------------------ | -------------------------------- |
| `POST`   | `/pipelines/parse` | Analyse graph, return DAG + plan |
| `POST`   | `/pipelines/save`  | Save pipeline to disk            |
| `GET`    | `/pipelines`       | List all saved pipelines         |
| `GET`    | `/pipelines/{id}`  | Load a saved pipeline            |
| `DELETE` | `/pipelines/{id}`  | Delete a saved pipeline          |
| `GET`    | `/templates`       | List built-in starter templates  |

---

## License

MIT
