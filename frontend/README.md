# VectorShift Frontend

A React-based visual pipeline builder built on ReactFlow. Drag, connect, configure, and analyse AI workflow nodes on an infinite canvas.

---

## Requirements

- Node.js 16 or higher
- npm 8 or higher

---

## Installation & running

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

The backend must also be running at `http://localhost:8000` for save/load and analysis features to work.

---

## Project structure

```
frontend/src/
│
├── App.js                    ← Root layout shell
├── index.js                  ← React DOM entry point
├── index.css                 ← Design system (CSS variables, fonts, animations)
├── store.js                  ← Zustand global state store
│
├── toolbar.js                ← Header bar with logo, pipeline name, actions, node palette
├── ui.js                     ← ReactFlow canvas (drag/drop, keyboard, context menu)
├── submit.js                 ← Footer run button and analysis result modal
├── draggableNode.js          ← Individual draggable node pill in the toolbar
│
├── Toast.js                  ← Floating in-app notification
├── NodeErrorBoundary.js      ← React error boundary wrapping each node
├── NodeContextMenu.js        ← Right-click context menu (duplicate, delete)
├── SavedPipelinesPanel.js    ← Modal panel to browse/load/delete saved pipelines
├── TemplatesPanel.js         ← Modal panel to browse and load starter templates
│
└── nodes/
    ├── BaseNode.js           ← Shared node shell (styling, handles, fields)
    ├── useNodeFields.js      ← Hook for node field state management
    ├── inputNode.js          ← Input node
    ├── outputNode.js         ← Output node
    ├── llmNode.js            ← LLM node
    ├── textNode.js           ← Text node (auto-resize + variable handles)
    ├── apiNode.js            ← API Call node
    ├── transformNode.js      ← Transform node
    ├── filterNode.js         ← Filter / Route node
    ├── mergeNode.js          ← Merge node
    └── mathNode.js           ← Math node
```

---

## Node types

| Node      | Color    | Handles                       | Description                              |
| --------- | -------- | ----------------------------- | ---------------------------------------- |
| Input     | Sky blue | → output (right)              | Entry point for pipeline data            |
| Output    | Purple   | input → (left)                | Final destination for results            |
| LLM       | Green    | system, prompt → / ← response | Runs a language model                    |
| Text      | Red      | `{{var}}` → / ← output        | Text template with variable substitution |
| API Call  | Indigo   | body → / ← response, status   | Makes an HTTP request                    |
| Transform | Cyan     | in → / ← out                  | Applies a data transformation            |
| Filter    | Amber    | in → / ← true, false          | Routes data based on a condition         |
| Merge     | Slate    | a, b, c → / ← out             | Combines multiple inputs into one        |
| Math      | Lime     | a, b → / ← result             | Evaluates a numeric expression           |

---

## Node abstraction

All nodes are built on two shared modules:

### `BaseNode.js`

The visual shell for every node. Accepts declarative props:

```jsx
<BaseNode
  id={id}
  title="My Node"
  variant="api" // key into the color palette
  icon="🌐"
  handles={[
    { id: "in", type: "target" },
    { id: "out", type: "source" },
  ]}
  fields={[
    { key: "url", label: "URL", type: "text" },
    {
      key: "method",
      label: "Method",
      type: "select",
      options: ["GET", "POST"],
    },
  ]}
  fieldValues={values}
  onFieldChange={handleChange}
/>
```

**Field types:** `text`, `select`, `textarea`, `display`

**Variants (color themes):** `input`, `output`, `llm`, `text`, `api`, `transform`, `filter`, `merge`, `math`

### `useNodeFields.js`

Replaces the boilerplate `useState` + handler pattern:

```js
const { values, handleChange } = useNodeFields(
  { url: "https://...", method: "GET" }, // defaults
  data, // ReactFlow data prop (overrides)
);
```

### Creating a new node

A complete new node is 15–20 lines:

```jsx
import { BaseNode } from "./BaseNode";
import { useNodeFields } from "./useNodeFields";

export const MyNode = ({ id, data }) => {
  const { values, handleChange } = useNodeFields({ myField: "default" }, data);
  return (
    <BaseNode
      id={id}
      title="My Node"
      variant="transform"
      icon="★"
      handles={[
        { id: "in", type: "target" },
        { id: "out", type: "source" },
      ]}
      fields={[{ key: "myField", label: "Setting", type: "text" }]}
      fieldValues={values}
      onFieldChange={handleChange}
    />
  );
};
```

Then register it in `ui.js` (`nodeTypes`) and `toolbar.js` (`NODES` array).

---

## Text node — special features

### Auto-resize

The node width and textarea height grow automatically as you type:

- **Width** scales with the longest line (min 240px, max 520px)
- **Height** scales with the number of lines (no scrollbar — node expands instead)

### Variable handles

Typing `{{ variableName }}` inside the textarea automatically creates a labelled target handle on the left side of the node. Rules:

- Variable name must be a valid JavaScript identifier (`[a-zA-Z_$][a-zA-Z0-9_$]*`)
- Whitespace inside `{{ }}` is ignored (`{{ my_var }}` = `{{my_var}}`)
- Duplicate variable names produce a single handle
- Deleting the text removes the handle automatically

---

## State management

All state lives in `store.js` (Zustand). Key actions:

| Action                 | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `addNode`              | Add a node to the canvas (pushes undo history)  |
| `onNodesChange`        | Handle ReactFlow node change events             |
| `onEdgesChange`        | Handle ReactFlow edge change events             |
| `onConnect`            | Create a new edge                               |
| `duplicateNode(id)`    | Clone a node with a new ID, offset by 30px      |
| `deleteNode(id)`       | Remove a node and all its connected edges       |
| `undo` / `redo`        | Step through canvas history (up to 60 steps)    |
| `clearCanvas`          | Remove all nodes and edges                      |
| `setPipelineName`      | Rename the current pipeline                     |
| `savePipeline`         | POST to backend and refresh saved list          |
| `loadPipeline(id)`     | GET from backend and replace canvas             |
| `exportPipeline`       | Download canvas as `.json` file                 |
| `importPipeline(file)` | Load a `.json` file into the canvas             |
| `loadTemplate(t)`      | Load a template object directly onto the canvas |
| `fetchTemplates`       | GET `/templates` from backend                   |
| `showToast(msg, type)` | Show a toast notification (success/error/info)  |

---

## Keyboard shortcuts

| Shortcut             | Action                       |
| -------------------- | ---------------------------- |
| `Ctrl + Z`           | Undo                         |
| `Ctrl + Y`           | Redo                         |
| `Ctrl + Shift + Z`   | Redo (alternative)           |
| `Delete / Backspace` | Delete selected node or edge |
| `Escape`             | Close any open modal or menu |
| `Right-click node`   | Open context menu            |

---

## Toolbar actions

| Button       | Description                                    |
| ------------ | ---------------------------------------------- |
| ↩ Undo       | Undo last canvas change                        |
| ↪ Redo       | Redo last undone change                        |
| ⚡ Templates | Open starter template browser                  |
| 📂 Load      | Open saved pipelines panel                     |
| 💾 Save      | Save current pipeline to backend               |
| ⬇ Export     | Download pipeline as `.json` file              |
| ⬆ Import     | Load pipeline from a `.json` file              |
| 🗑 Clear     | Clear the canvas (requires confirmation click) |

---

## Run Pipeline — analysis modal

Clicking **Run Pipeline** POSTs the current nodes and edges to `/pipelines/parse`. The result modal shows three tabs:

### Overview tab

- **Nodes** count (animated counter)
- **Edges** count (animated counter)
- **DAG status** — green card if valid, amber card if cycle detected

### Exec Plan tab

Lists each node in topological execution order with:

- Step number
- Node ID
- Human-readable action description
- Colour-coded node type badge

### Issues tab

Lists all validation issues returned by the backend, colour-coded by severity:

- 🔴 **Error** — prevents valid execution
- 🟡 **Warning** — potential problem
- 🔵 **Info** — informational note

---

## Design system

Defined in `index.css` as CSS variables. Key tokens:

```css
--bg-base: #080c14 /* canvas background      */ --bg-surface: #0d1220
  /* toolbar / footer       */ --accent: #00d4aa /* primary teal accent    */
  --text-primary: #e8edf5 --text-secondary: #8a9bb8 --text-muted: #4a5568
  --font-display: "Syne" /* headings / badges     */
  --font-mono: "JetBrains Mono" /* all body / code text */;
```

Node accent colors are defined in `BaseNode.js` under the `PALETTE` object and can be changed there globally.

---

## Dependencies

| Package           | Version  | Purpose                        |
| ----------------- | -------- | ------------------------------ |
| `react`           | 18       | UI framework                   |
| `reactflow`       | 11       | Canvas, nodes, edges, handles  |
| `zustand`         | 4        | Global state management        |
| `zustand/shallow` | built-in | Shallow equality for selectors |

No other external UI libraries are required — all components are hand-built.
