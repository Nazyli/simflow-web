# AGENTS.md

# SimFlow Web

SimFlow Web adalah aplikasi frontend untuk workflow engine dan AI simulation engine.

Aplikasi ini digunakan untuk mengelola workflow, node, edge, actor, persona, event, trigger, execution, dan berbagai kanal komunikasi.

---

## Technology stack

- TypeScript
- React 19
- Vite
- React Router
- TanStack Query
- Zustand
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Tailwind CSS v4 dengan `@tailwindcss/vite`
- Lucide React
- Radix UI primitives
- Sonner
- Framer Motion
- date-fns
- Recharts

---

## Architecture

Gunakan pendekatan berikut:

- Feature-based architecture
- Component-based architecture
- Atomic design
- Modular structure
- Domain-oriented development

---

## Directory structure

```text
simflow-web/
├── public/
│
├── src/
│   ├── api/
│   │   ├── client/
│   │   ├── endpoints/
│   │   └── hooks/
│   │
│   ├── app/
│   │   ├── layouts/
│   │   ├── providers/
│   │   ├── routes/
│   │   └── stores/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── dialogs/
│   │   └── charts/
│   │
│   ├── features/
│   │   ├── actors/
│   │   ├── channels/
│   │   ├── documents/
│   │   ├── events/
│   │   ├── executions/
│   │   ├── nodes/
│   │   ├── personas/
│   │   ├── simulations/
│   │   ├── timers/
│   │   ├── triggers/
│   │   └── workflows/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   └── assets/
│
├── tests/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Application modules

### Workflow

- workflow list
- workflow builder
- workflow versioning
- workflow execution
- workflow monitoring

---
## React Flow rules

Gunakan React Flow sebagai komponen utama untuk workflow builder.

### Gunakan

- ReactFlow;
- Background;
- Controls;
- MiniMap;
- Handle;
- NodeToolbar;
- NodeResizer;

---

### Node

- create node
- update node
- delete node
- duplicate node

---

### Edge

- connect node
- disconnect node
- validate connection

---

### Actor

- human actor
- AI actor
- system actor

---

### Persona

- profile
- behavior
- memory
- preferences

---

### Event

- event list
- event history
- event details

---

### Trigger

- timer trigger
- keyword trigger
- score trigger
- variable trigger

---

### Execution

- execution history
- execution logs
- execution metrics

---

### Channel

- email
- chat
- call
- document

---

## UI rules

### Use

- reusable components;
- responsive design;
- accessible elements;
- consistent spacing;
- loading state;
- skeleton component;
- optimistic update.

Gunakan Lucide React sebagai icon default. Jangan gunakan emoji sebagai icon UI
produksi. Gunakan Sonner untuk umpan balik sukses/gagal, dan gunakan dialog,
dropdown, select, tabs, serta tooltip dari shadcn/ui atau Radix UI.

---

### Avoid

- inline styles;
- duplicated components;
- direct API calls inside components;
- deeply nested components;
- unnecessary state management.

---

## State management

### Local state

Gunakan:

```ts
useState()
```

---

### Shared state

Gunakan:

```ts
Zustand
```

---

### Server state

Gunakan:

```ts
TanStack Query
```

---

## Routing

Gunakan struktur berikut:

```text
/workflows
/workflows/:id

/nodes
/nodes/:id

/actors
/actors/:id

/personas
/personas/:id

/executions
/executions/:id

/events
/events/:id

/settings
```

---

## API rules

Semua permintaan HTTP harus melewati:

```text
src/api/
```

Jangan lakukan hal berikut:

```ts
fetch(...)
axios(...)
```

langsung di dalam komponen.

---

## Component rules

### Good

```tsx
<WorkflowCard />
<ActorTable />
<NodeEditor />
```

---

### Bad

```tsx
<WorkflowCardComponent />
<ActorTableComponent />
```

---

## Naming convention

### File name

```text
workflow-card.tsx
node-editor.tsx
actor-table.tsx
```

---

### Hook name

```ts
useWorkflow();
useExecution();
useActor();
```

---

### Interface name

```ts
interface Workflow {
    id: string;
}
```

---

### Enum name

```ts
enum WorkflowStatus {
    ACTIVE,
    INACTIVE,
}
```

---

## Styling rules

Gunakan:

- Tailwind CSS;
- CSS variables;
- utility classes;
- design tokens.

Gunakan `clsx` dan `tailwind-merge` untuk menyusun conditional class. Gunakan
Framer Motion hanya untuk transisi yang membantu pemahaman state. Untuk tanggal,
durasi, dan timestamp gunakan date-fns; gunakan Recharts untuk grafik data.

Hindari:

- Bootstrap;
- jQuery;
- inline CSS;
- penggunaan `!important`.
- emoji sebagai icon UI;
- library UI tambahan yang menduplikasi Radix/shadcn.

---

## Form rules

Gunakan:

- React Hook Form;
- Zod.

Contoh:

```ts
const schema = z.object({
    name: z.string(),
});
```

---

## Table rules

Gunakan:

- pagination;
- filtering;
- sorting;
- column visibility;
- row selection.

---

## Workflow builder rules

Workflow builder harus mendukung:

- drag and drop;
- zoom;
- pan;
- minimap;
- custom node;
- custom edge;
- validation;
- undo;
- redo.

---

## Logging rules

Gunakan:

- error boundary;
- console logging untuk mode pengembangan;
- centralized logging.

---

## Testing

Gunakan:

- Vitest;
- React Testing Library;
- Playwright.

---

## AI instructions

Saat menghasilkan kode:

- gunakan TypeScript;
- hindari penggunaan `any`;
- gunakan komponen yang kecil;
- utamakan keterbacaan kode;
- gunakan type yang eksplisit;
- jangan menambahkan dependensi yang tidak diperlukan;
- gunakan prinsip SOLID;
- hindari duplikasi kode;
- pastikan seluruh kode mendukung mode gelap (dark mode).
