# リキッド・デモクラシー シミュレーター Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only React app that lets an admin set up virtual people, topics, and per-topic direct-votes-or-delegations, then view the resolved liquid-democracy results as charts and a delegation network graph.

**Architecture:** A single-page React + TypeScript + Vite app with two routes (`/admin`, `/results`) sharing state via React Context + `useReducer`. All domain logic (delegation resolution) lives in a pure, independently-tested function. The liquid-democracy mechanism is isolated under `src/mechanisms/liquidDemocracy/` so future mechanisms (sortition, quadratic funding, etc.) can be added as sibling directories without touching this code.

**Tech Stack:** React 18, TypeScript, Vite, React Router v6, Vitest, @testing-library/react, @testing-library/jest-dom. No backend, no database, no external charting/graph libraries (all SVG is hand-rolled).

**Spec:** [docs/superpowers/specs/2026-09-13-liquid-democracy-simulator-design.md](../specs/2026-09-13-liquid-democracy-simulator-design.md)

## Global Constraints

- No backend/DB. State lives only in React Context (in-memory); it is lost on page reload — this is intentional per spec, not a bug to fix.
- No authentication/login. A single admin operates the whole app in one browser session.
- No external chart or graph libraries. All visualizations (bar chart, network graph) are hand-rolled SVG.
- Target scale: 5–20 people, an arbitrary number of topics. No special handling for larger scale is needed.
- Only the Liquid Democracy mechanism is in scope. Directory structure (`src/mechanisms/liquidDemocracy/`) must leave room for future mechanisms as sibling directories, without requiring changes to this code.
- All UI copy is in Japanese.
- Deviation from spec wording (both are functionally equivalent to what the spec asked for, chosen for simplicity/testability):
  - The delegation-matrix cell editor is an inline expanding panel under the clicked cell, not a floating/positioned popover.
  - The vote tally chart is a bar chart (not a pie chart).
  - The delegation network graph uses a deterministic circular layout, not an iterative force simulation.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/setupTests.ts`
- Create: `.gitignore`

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` / `npm test` toolchain that every later task relies on.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "decision-diversity-app",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
  },
});
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>決定の多様性を体験するアプリ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/main.tsx`, `src/App.tsx`, `src/setupTests.ts`**

`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.tsx` (placeholder — replaced in Task 11):
```tsx
export default function App() {
  return <div>決定の多様性を体験するアプリ</div>;
}
```

`src/setupTests.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 8: Verify the build works**

Run: `npm run build`
Expected: TypeScript compiles with no errors, Vite produces a `dist/` folder.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.tsx src/App.tsx src/setupTests.ts .gitignore
git commit -m "chore: scaffold Vite + React + TypeScript + Vitest project"
```

---

## Task 2: Core Types and Delegation Resolution Logic

**Files:**
- Create: `src/mechanisms/liquidDemocracy/types.ts`
- Create: `src/mechanisms/liquidDemocracy/resolveDelegation.ts`
- Create: `src/mechanisms/liquidDemocracy/resolveDelegation.test.ts`

**Interfaces:**
- Produces: `Stance`, `Person`, `Topic`, `Ballot`, `ResolvedStance` types; `resolveTopic(people: Person[], ballots: Ballot[], topicId: string): Map<string, ResolvedStance>`.

- [ ] **Step 1: Create `types.ts`**

```typescript
export type Stance = "agree" | "disagree" | "neutral";

export interface Person {
  id: string;
  name: string;
  expertiseTags: string[];
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
}

export interface Ballot {
  personId: string;
  topicId: string;
  mode: "direct" | "delegate";
  stance?: Stance;
  delegateTo?: string;
}

export type ResolvedStance = Stance | "circular" | "unresolved";
```

- [ ] **Step 2: Write the failing tests for `resolveTopic`**

```typescript
import { describe, it, expect } from "vitest";
import { resolveTopic } from "./resolveDelegation";
import type { Person, Ballot } from "./types";

const topicId = "t1";

function person(id: string): Person {
  return { id, name: id, expertiseTags: [] };
}

describe("resolveTopic", () => {
  it("resolves direct votes as-is", () => {
    const people = [person("a"), person("b")];
    const ballots: Ballot[] = [
      { personId: "a", topicId, mode: "direct", stance: "agree" },
      { personId: "b", topicId, mode: "direct", stance: "disagree" },
    ];
    const result = resolveTopic(people, ballots, topicId);
    expect(result.get("a")).toBe("agree");
    expect(result.get("b")).toBe("disagree");
  });

  it("resolves a single-hop delegation to the delegate's stance", () => {
    const people = [person("a"), person("b")];
    const ballots: Ballot[] = [
      { personId: "a", topicId, mode: "delegate", delegateTo: "b" },
      { personId: "b", topicId, mode: "direct", stance: "agree" },
    ];
    const result = resolveTopic(people, ballots, topicId);
    expect(result.get("a")).toBe("agree");
    expect(result.get("b")).toBe("agree");
  });

  it("resolves a multi-hop delegation chain (3+ people)", () => {
    const people = [person("a"), person("b"), person("c")];
    const ballots: Ballot[] = [
      { personId: "a", topicId, mode: "delegate", delegateTo: "b" },
      { personId: "b", topicId, mode: "delegate", delegateTo: "c" },
      { personId: "c", topicId, mode: "direct", stance: "neutral" },
    ];
    const result = resolveTopic(people, ballots, topicId);
    expect(result.get("a")).toBe("neutral");
    expect(result.get("b")).toBe("neutral");
    expect(result.get("c")).toBe("neutral");
  });

  it("detects a 2-person circular delegation", () => {
    const people = [person("a"), person("b")];
    const ballots: Ballot[] = [
      { personId: "a", topicId, mode: "delegate", delegateTo: "b" },
      { personId: "b", topicId, mode: "delegate", delegateTo: "a" },
    ];
    const result = resolveTopic(people, ballots, topicId);
    expect(result.get("a")).toBe("circular");
    expect(result.get("b")).toBe("circular");
  });

  it("detects a 3-person circular delegation", () => {
    const people = [person("a"), person("b"), person("c")];
    const ballots: Ballot[] = [
      { personId: "a", topicId, mode: "delegate", delegateTo: "b" },
      { personId: "b", topicId, mode: "delegate", delegateTo: "c" },
      { personId: "c", topicId, mode: "delegate", delegateTo: "a" },
    ];
    const result = resolveTopic(people, ballots, topicId);
    expect(result.get("a")).toBe("circular");
    expect(result.get("b")).toBe("circular");
    expect(result.get("c")).toBe("circular");
  });

  it("treats delegation to a nonexistent person as unresolved", () => {
    const people = [person("a")];
    const ballots: Ballot[] = [
      { personId: "a", topicId, mode: "delegate", delegateTo: "ghost" },
    ];
    const result = resolveTopic(people, ballots, topicId);
    expect(result.get("a")).toBe("unresolved");
  });

  it("treats a missing ballot as unresolved", () => {
    const people = [person("a"), person("b")];
    const ballots: Ballot[] = [
      { personId: "a", topicId, mode: "direct", stance: "agree" },
    ];
    const result = resolveTopic(people, ballots, topicId);
    expect(result.get("a")).toBe("agree");
    expect(result.get("b")).toBe("unresolved");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/mechanisms/liquidDemocracy/resolveDelegation.test.ts`
Expected: FAIL — `resolveDelegation.ts` does not exist yet / `resolveTopic` is not defined.

- [ ] **Step 4: Implement `resolveDelegation.ts`**

```typescript
import type { Person, Ballot, ResolvedStance } from "./types";

export function resolveTopic(
  people: Person[],
  ballots: Ballot[],
  topicId: string
): Map<string, ResolvedStance> {
  const personIds = new Set(people.map((p) => p.id));
  const ballotByPerson = new Map<string, Ballot>();
  for (const b of ballots) {
    if (b.topicId === topicId) ballotByPerson.set(b.personId, b);
  }

  const results = new Map<string, ResolvedStance>();

  function resolve(personId: string, path: string[]): ResolvedStance {
    if (results.has(personId)) return results.get(personId)!;

    const cycleStartIndex = path.indexOf(personId);
    if (cycleStartIndex !== -1) {
      for (const id of path.slice(cycleStartIndex)) {
        results.set(id, "circular");
      }
      return "circular";
    }

    const ballot = ballotByPerson.get(personId);
    if (!ballot) {
      results.set(personId, "unresolved");
      return "unresolved";
    }

    if (ballot.mode === "direct") {
      const stance = ballot.stance;
      const value: ResolvedStance = stance ?? "unresolved";
      results.set(personId, value);
      return value;
    }

    const target = ballot.delegateTo;
    if (!target || !personIds.has(target)) {
      results.set(personId, "unresolved");
      return "unresolved";
    }

    const resolved = resolve(target, [...path, personId]);
    if (!results.has(personId)) {
      results.set(personId, resolved);
    }
    return results.get(personId)!;
  }

  for (const person of people) {
    resolve(person.id, []);
  }

  return results;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/mechanisms/liquidDemocracy/resolveDelegation.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/mechanisms/liquidDemocracy/types.ts src/mechanisms/liquidDemocracy/resolveDelegation.ts src/mechanisms/liquidDemocracy/resolveDelegation.test.ts
git commit -m "feat: add liquid democracy types and delegation resolution logic"
```

---

## Task 3: State Reducer

**Files:**
- Create: `src/mechanisms/liquidDemocracy/state/reducer.ts`
- Create: `src/mechanisms/liquidDemocracy/state/reducer.test.ts`

**Interfaces:**
- Consumes: `Person`, `Topic`, `Ballot`, `Stance` from `../types`.
- Produces: `State { people: Person[]; topics: Topic[]; ballots: Ballot[] }`, `initialState`, `Action` (a discriminated union), `reducer(state: State, action: Action): State`.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { reducer, initialState, type State } from "./reducer";

describe("reducer", () => {
  it("adds a person", () => {
    const state = reducer(initialState, {
      type: "ADD_PERSON",
      id: "1",
      name: "山田",
      expertiseTags: ["教育"],
    });
    expect(state.people).toEqual([{ id: "1", name: "山田", expertiseTags: ["教育"] }]);
  });

  it("updates a person", () => {
    const withPerson: State = {
      ...initialState,
      people: [{ id: "1", name: "山田", expertiseTags: [] }],
    };
    const state = reducer(withPerson, {
      type: "UPDATE_PERSON",
      id: "1",
      name: "山田太郎",
      expertiseTags: ["AI"],
    });
    expect(state.people).toEqual([{ id: "1", name: "山田太郎", expertiseTags: ["AI"] }]);
  });

  it("removes a person and their ballots", () => {
    const seeded: State = {
      people: [
        { id: "1", name: "山田", expertiseTags: [] },
        { id: "2", name: "佐藤", expertiseTags: [] },
      ],
      topics: [{ id: "t1", title: "教育政策" }],
      ballots: [
        { personId: "1", topicId: "t1", mode: "direct", stance: "agree" },
        { personId: "2", topicId: "t1", mode: "delegate", delegateTo: "1" },
      ],
    };
    const state = reducer(seeded, { type: "REMOVE_PERSON", id: "1" });
    expect(state.people).toEqual([{ id: "2", name: "佐藤", expertiseTags: [] }]);
    expect(state.ballots).toEqual([
      { personId: "2", topicId: "t1", mode: "delegate", delegateTo: "1" },
    ]);
  });

  it("adds and removes a topic, cascading ballot removal", () => {
    const withBallot: State = {
      people: [{ id: "1", name: "山田", expertiseTags: [] }],
      topics: [{ id: "t1", title: "教育政策" }],
      ballots: [{ personId: "1", topicId: "t1", mode: "direct", stance: "agree" }],
    };
    const state = reducer(withBallot, { type: "REMOVE_TOPIC", id: "t1" });
    expect(state.topics).toEqual([]);
    expect(state.ballots).toEqual([]);
  });

  it("sets a direct ballot, then overwrites it", () => {
    let state = reducer(initialState, {
      type: "SET_DIRECT_BALLOT",
      personId: "1",
      topicId: "t1",
      stance: "agree",
    });
    expect(state.ballots).toEqual([
      { personId: "1", topicId: "t1", mode: "direct", stance: "agree" },
    ]);
    state = reducer(state, {
      type: "SET_DIRECT_BALLOT",
      personId: "1",
      topicId: "t1",
      stance: "disagree",
    });
    expect(state.ballots).toEqual([
      { personId: "1", topicId: "t1", mode: "direct", stance: "disagree" },
    ]);
  });

  it("sets a delegate ballot", () => {
    const state = reducer(initialState, {
      type: "SET_DELEGATE_BALLOT",
      personId: "1",
      topicId: "t1",
      delegateTo: "2",
    });
    expect(state.ballots).toEqual([
      { personId: "1", topicId: "t1", mode: "delegate", delegateTo: "2" },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/mechanisms/liquidDemocracy/state/reducer.test.ts`
Expected: FAIL — `reducer.ts` does not exist yet.

- [ ] **Step 3: Implement `reducer.ts`**

```typescript
import type { Person, Topic, Ballot, Stance } from "../types";

export interface State {
  people: Person[];
  topics: Topic[];
  ballots: Ballot[];
}

export const initialState: State = { people: [], topics: [], ballots: [] };

export type Action =
  | { type: "ADD_PERSON"; id: string; name: string; expertiseTags: string[] }
  | { type: "UPDATE_PERSON"; id: string; name: string; expertiseTags: string[] }
  | { type: "REMOVE_PERSON"; id: string }
  | { type: "ADD_TOPIC"; id: string; title: string; description?: string }
  | { type: "UPDATE_TOPIC"; id: string; title: string; description?: string }
  | { type: "REMOVE_TOPIC"; id: string }
  | { type: "SET_DIRECT_BALLOT"; personId: string; topicId: string; stance: Stance }
  | { type: "SET_DELEGATE_BALLOT"; personId: string; topicId: string; delegateTo: string };

function upsertBallot(ballots: Ballot[], next: Ballot): Ballot[] {
  const existingIndex = ballots.findIndex(
    (b) => b.personId === next.personId && b.topicId === next.topicId
  );
  if (existingIndex === -1) return [...ballots, next];
  const copy = [...ballots];
  copy[existingIndex] = next;
  return copy;
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_PERSON":
      return {
        ...state,
        people: [
          ...state.people,
          { id: action.id, name: action.name, expertiseTags: action.expertiseTags },
        ],
      };
    case "UPDATE_PERSON":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id
            ? { ...p, name: action.name, expertiseTags: action.expertiseTags }
            : p
        ),
      };
    case "REMOVE_PERSON":
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
        ballots: state.ballots.filter((b) => b.personId !== action.id),
      };
    case "ADD_TOPIC":
      return {
        ...state,
        topics: [
          ...state.topics,
          { id: action.id, title: action.title, description: action.description },
        ],
      };
    case "UPDATE_TOPIC":
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.id
            ? { ...t, title: action.title, description: action.description }
            : t
        ),
      };
    case "REMOVE_TOPIC":
      return {
        ...state,
        topics: state.topics.filter((t) => t.id !== action.id),
        ballots: state.ballots.filter((b) => b.topicId !== action.id),
      };
    case "SET_DIRECT_BALLOT":
      return {
        ...state,
        ballots: upsertBallot(state.ballots, {
          personId: action.personId,
          topicId: action.topicId,
          mode: "direct",
          stance: action.stance,
        }),
      };
    case "SET_DELEGATE_BALLOT":
      return {
        ...state,
        ballots: upsertBallot(state.ballots, {
          personId: action.personId,
          topicId: action.topicId,
          mode: "delegate",
          delegateTo: action.delegateTo,
        }),
      };
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/mechanisms/liquidDemocracy/state/reducer.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mechanisms/liquidDemocracy/state/reducer.ts src/mechanisms/liquidDemocracy/state/reducer.test.ts
git commit -m "feat: add liquid democracy state reducer"
```

---

## Task 4: React Context Wiring

**Files:**
- Create: `src/mechanisms/liquidDemocracy/state/context.tsx`
- Create: `src/mechanisms/liquidDemocracy/state/context.test.tsx`

**Interfaces:**
- Consumes: `reducer`, `initialState`, `State`, `Action` from `./reducer`.
- Produces: `LiquidDemocracyProvider({ children })`, `useLiquidDemocracy(): { state: State; dispatch: React.Dispatch<Action> }`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LiquidDemocracyProvider, useLiquidDemocracy } from "./context";

function Probe() {
  const { state, dispatch } = useLiquidDemocracy();
  return (
    <div>
      <div data-testid="count">{state.people.length}</div>
      <button
        onClick={() =>
          dispatch({ type: "ADD_PERSON", id: "1", name: "テスト", expertiseTags: [] })
        }
      >
        add
      </button>
    </div>
  );
}

describe("LiquidDemocracyProvider", () => {
  it("provides state and dispatch to consumers", () => {
    render(
      <LiquidDemocracyProvider>
        <Probe />
      </LiquidDemocracyProvider>
    );
    expect(screen.getByTestId("count").textContent).toBe("0");
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("throws when used outside the provider", () => {
    function BadProbe() {
      useLiquidDemocracy();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadProbe />)).toThrow();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/mechanisms/liquidDemocracy/state/context.test.tsx`
Expected: FAIL — `context.tsx` does not exist yet.

- [ ] **Step 3: Implement `context.tsx`**

```tsx
import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from "react";
import { reducer, initialState, type State, type Action } from "./reducer";

interface ContextValue {
  state: State;
  dispatch: Dispatch<Action>;
}

const LiquidDemocracyContext = createContext<ContextValue | null>(null);

export function LiquidDemocracyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <LiquidDemocracyContext.Provider value={{ state, dispatch }}>
      {children}
    </LiquidDemocracyContext.Provider>
  );
}

export function useLiquidDemocracy(): ContextValue {
  const ctx = useContext(LiquidDemocracyContext);
  if (!ctx) {
    throw new Error("useLiquidDemocracy must be used within LiquidDemocracyProvider");
  }
  return ctx;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/mechanisms/liquidDemocracy/state/context.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mechanisms/liquidDemocracy/state/context.tsx src/mechanisms/liquidDemocracy/state/context.test.tsx
git commit -m "feat: add React context wiring for liquid democracy state"
```

---

## Task 5: Person Manager Component

**Files:**
- Create: `src/mechanisms/liquidDemocracy/components/PersonManager.tsx`
- Create: `src/mechanisms/liquidDemocracy/components/PersonManager.test.tsx`

**Interfaces:**
- Consumes: `Person` from `../types`.
- Produces: `PersonManager({ people, onAdd, onUpdate, onRemove })` where `onAdd(name: string, expertiseTags: string[])`, `onUpdate(id: string, name: string, expertiseTags: string[])`, `onRemove(id: string)`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PersonManager } from "./PersonManager";

describe("PersonManager", () => {
  it("renders existing people", () => {
    render(
      <PersonManager
        people={[{ id: "1", name: "山田", expertiseTags: ["教育"] }]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText(/山田/)).toBeInTheDocument();
  });

  it("calls onAdd with parsed tags when the form is submitted", () => {
    const onAdd = vi.fn();
    render(<PersonManager people={[]} onAdd={onAdd} onUpdate={vi.fn()} onRemove={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("名前"), { target: { value: "鈴木" } });
    fireEvent.change(screen.getByLabelText("専門分野(カンマ区切り)"), {
      target: { value: "AI, 交通" },
    });
    fireEvent.click(screen.getByText("追加"));
    expect(onAdd).toHaveBeenCalledWith("鈴木", ["AI", "交通"]);
  });

  it("calls onRemove when delete is clicked", () => {
    const onRemove = vi.fn();
    render(
      <PersonManager
        people={[{ id: "1", name: "山田", expertiseTags: [] }]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByText("削除"));
    expect(onRemove).toHaveBeenCalledWith("1");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/PersonManager.test.tsx`
Expected: FAIL — `PersonManager.tsx` does not exist yet.

- [ ] **Step 3: Implement `PersonManager.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import type { Person } from "../types";

interface PersonManagerProps {
  people: Person[];
  onAdd: (name: string, expertiseTags: string[]) => void;
  onUpdate: (id: string, name: string, expertiseTags: string[]) => void;
  onRemove: (id: string) => void;
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function PersonManager({ people, onAdd, onUpdate, onRemove }: PersonManagerProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const expertiseTags = parseTags(tags);
    if (editingId) {
      onUpdate(editingId, name.trim(), expertiseTags);
    } else {
      onAdd(name.trim(), expertiseTags);
    }
    setName("");
    setTags("");
    setEditingId(null);
  }

  function startEdit(person: Person) {
    setEditingId(person.id);
    setName(person.name);
    setTags(person.expertiseTags.join(", "));
  }

  return (
    <section>
      <h2>人物</h2>
      <ul>
        {people.map((p) => (
          <li key={p.id}>
            {p.name} ({p.expertiseTags.join(", ") || "専門分野なし"})
            <button onClick={() => startEdit(p)}>編集</button>
            <button onClick={() => onRemove(p.id)}>削除</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <label>
          名前
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          専門分野(カンマ区切り)
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </label>
        <button type="submit">{editingId ? "更新" : "追加"}</button>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/PersonManager.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mechanisms/liquidDemocracy/components/PersonManager.tsx src/mechanisms/liquidDemocracy/components/PersonManager.test.tsx
git commit -m "feat: add PersonManager admin component"
```

---

## Task 6: Topic Manager Component

**Files:**
- Create: `src/mechanisms/liquidDemocracy/components/TopicManager.tsx`
- Create: `src/mechanisms/liquidDemocracy/components/TopicManager.test.tsx`

**Interfaces:**
- Consumes: `Topic` from `../types`.
- Produces: `TopicManager({ topics, onAdd, onUpdate, onRemove })` where `onAdd(title: string, description: string)`, `onUpdate(id: string, title: string, description: string)`, `onRemove(id: string)`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopicManager } from "./TopicManager";

describe("TopicManager", () => {
  it("renders existing topics", () => {
    render(
      <TopicManager
        topics={[{ id: "t1", title: "教育政策", description: "教育に関する議論" }]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText(/教育政策/)).toBeInTheDocument();
  });

  it("calls onAdd when the form is submitted", () => {
    const onAdd = vi.fn();
    render(<TopicManager topics={[]} onAdd={onAdd} onUpdate={vi.fn()} onRemove={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "AI政策" } });
    fireEvent.change(screen.getByLabelText("説明"), { target: { value: "AI活用の是非" } });
    fireEvent.click(screen.getByText("追加"));
    expect(onAdd).toHaveBeenCalledWith("AI政策", "AI活用の是非");
  });

  it("calls onRemove when delete is clicked", () => {
    const onRemove = vi.fn();
    render(
      <TopicManager
        topics={[{ id: "t1", title: "教育政策" }]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByText("削除"));
    expect(onRemove).toHaveBeenCalledWith("t1");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/TopicManager.test.tsx`
Expected: FAIL — `TopicManager.tsx` does not exist yet.

- [ ] **Step 3: Implement `TopicManager.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import type { Topic } from "../types";

interface TopicManagerProps {
  topics: Topic[];
  onAdd: (title: string, description: string) => void;
  onUpdate: (id: string, title: string, description: string) => void;
  onRemove: (id: string) => void;
}

export function TopicManager({ topics, onAdd, onUpdate, onRemove }: TopicManagerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingId) {
      onUpdate(editingId, title.trim(), description.trim());
    } else {
      onAdd(title.trim(), description.trim());
    }
    setTitle("");
    setDescription("");
    setEditingId(null);
  }

  function startEdit(topic: Topic) {
    setEditingId(topic.id);
    setTitle(topic.title);
    setDescription(topic.description ?? "");
  }

  return (
    <section>
      <h2>トピック</h2>
      <ul>
        {topics.map((t) => (
          <li key={t.id}>
            {t.title}
            {t.description ? `: ${t.description}` : ""}
            <button onClick={() => startEdit(t)}>編集</button>
            <button onClick={() => onRemove(t.id)}>削除</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <label>
          タイトル
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          説明
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit">{editingId ? "更新" : "追加"}</button>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/TopicManager.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mechanisms/liquidDemocracy/components/TopicManager.tsx src/mechanisms/liquidDemocracy/components/TopicManager.test.tsx
git commit -m "feat: add TopicManager admin component"
```

---

## Task 7: Delegation Matrix (Ballot Cell + Matrix Table)

**Files:**
- Create: `src/mechanisms/liquidDemocracy/components/BallotCell.tsx`
- Create: `src/mechanisms/liquidDemocracy/components/DelegationMatrix.tsx`
- Create: `src/mechanisms/liquidDemocracy/components/DelegationMatrix.test.tsx`

**Interfaces:**
- Consumes: `Person`, `Topic`, `Ballot`, `Stance` from `../types`.
- Produces: `DelegationMatrix({ people, topics, ballots, onSetDirect, onSetDelegate })` where `onSetDirect(personId: string, topicId: string, stance: Stance)`, `onSetDelegate(personId: string, topicId: string, delegateTo: string)`. `BallotCell` is an internal building block (not consumed outside this directory).

- [ ] **Step 1: Implement `BallotCell.tsx`**

(No standalone test file for this internal building block — it is exercised through `DelegationMatrix.test.tsx` in Step 3 below, which is the externally-visible behavior.)

```tsx
import { useState } from "react";
import type { Person, Topic, Ballot, Stance } from "../types";

const STANCE_LABELS: Record<Stance, string> = {
  agree: "賛成",
  disagree: "反対",
  neutral: "中立",
};

interface BallotCellProps {
  person: Person;
  topic: Topic;
  ballot: Ballot | undefined;
  otherPeople: Person[];
  onSetDirect: (stance: Stance) => void;
  onSetDelegate: (delegateTo: string) => void;
}

function cellLabel(ballot: Ballot | undefined, otherPeople: Person[]): string {
  if (!ballot) return "未設定";
  if (ballot.mode === "direct") {
    return ballot.stance ? STANCE_LABELS[ballot.stance] : "未設定";
  }
  const target = otherPeople.find((p) => p.id === ballot.delegateTo);
  return `→ ${target ? target.name : "?"}`;
}

export function BallotCell({
  person,
  topic,
  ballot,
  otherPeople,
  onSetDirect,
  onSetDelegate,
}: BallotCellProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"direct" | "delegate">(ballot?.mode ?? "direct");
  const [stance, setStance] = useState<Stance>(ballot?.stance ?? "agree");
  const [delegateTo, setDelegateTo] = useState<string>(
    ballot?.delegateTo ?? otherPeople[0]?.id ?? ""
  );

  function handleSave() {
    if (mode === "direct") {
      onSetDirect(stance);
    } else if (delegateTo) {
      onSetDelegate(delegateTo);
    }
    setOpen(false);
  }

  const cellId = `${person.id}-${topic.id}`;

  return (
    <td>
      <button onClick={() => setOpen((o) => !o)}>{cellLabel(ballot, otherPeople)}</button>
      {open && (
        <div role="dialog" aria-label={`${person.name} / ${topic.title} の投票設定`}>
          <label>
            <input
              type="radio"
              name={`mode-${cellId}`}
              checked={mode === "direct"}
              onChange={() => setMode("direct")}
            />
            直接投票
          </label>
          {mode === "direct" && (
            <select
              aria-label="stance"
              value={stance}
              onChange={(e) => setStance(e.target.value as Stance)}
            >
              <option value="agree">賛成</option>
              <option value="disagree">反対</option>
              <option value="neutral">中立</option>
            </select>
          )}
          {otherPeople.length > 0 && (
            <>
              <label>
                <input
                  type="radio"
                  name={`mode-${cellId}`}
                  checked={mode === "delegate"}
                  onChange={() => setMode("delegate")}
                />
                委任
              </label>
              {mode === "delegate" && (
                <select
                  aria-label="delegateTo"
                  value={delegateTo}
                  onChange={(e) => setDelegateTo(e.target.value)}
                >
                  {otherPeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
          <button onClick={handleSave}>保存</button>
          <button onClick={() => setOpen(false)}>閉じる</button>
        </div>
      )}
    </td>
  );
}
```

- [ ] **Step 2: Write the failing tests for `DelegationMatrix`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DelegationMatrix } from "./DelegationMatrix";
import type { Person, Topic } from "../types";

const people: Person[] = [
  { id: "1", name: "山田", expertiseTags: [] },
  { id: "2", name: "佐藤", expertiseTags: [] },
];
const topics: Topic[] = [{ id: "t1", title: "教育政策" }];

describe("DelegationMatrix", () => {
  it("shows 未設定 when no ballot exists", () => {
    render(
      <DelegationMatrix
        people={people}
        topics={topics}
        ballots={[]}
        onSetDirect={vi.fn()}
        onSetDelegate={vi.fn()}
      />
    );
    expect(screen.getAllByText("未設定")).toHaveLength(2);
  });

  it("calls onSetDirect with the selected stance", () => {
    const onSetDirect = vi.fn();
    render(
      <DelegationMatrix
        people={people}
        topics={topics}
        ballots={[]}
        onSetDirect={onSetDirect}
        onSetDelegate={vi.fn()}
      />
    );
    const row = screen.getByText("山田").closest("tr")!;
    fireEvent.click(within(row).getByText("未設定"));
    fireEvent.change(within(row).getByLabelText("stance"), { target: { value: "disagree" } });
    fireEvent.click(within(row).getByText("保存"));
    expect(onSetDirect).toHaveBeenCalledWith("1", "t1", "disagree");
  });

  it("calls onSetDelegate with the chosen delegate", () => {
    const onSetDelegate = vi.fn();
    render(
      <DelegationMatrix
        people={people}
        topics={topics}
        ballots={[]}
        onSetDirect={vi.fn()}
        onSetDelegate={onSetDelegate}
      />
    );
    const row = screen.getByText("山田").closest("tr")!;
    fireEvent.click(within(row).getByText("未設定"));
    fireEvent.click(within(row).getByLabelText("委任"));
    fireEvent.change(within(row).getByLabelText("delegateTo"), { target: { value: "2" } });
    fireEvent.click(within(row).getByText("保存"));
    expect(onSetDelegate).toHaveBeenCalledWith("1", "t1", "2");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/DelegationMatrix.test.tsx`
Expected: FAIL — `DelegationMatrix.tsx` does not exist yet.

- [ ] **Step 4: Implement `DelegationMatrix.tsx`**

```tsx
import type { Person, Topic, Ballot, Stance } from "../types";
import { BallotCell } from "./BallotCell";

interface DelegationMatrixProps {
  people: Person[];
  topics: Topic[];
  ballots: Ballot[];
  onSetDirect: (personId: string, topicId: string, stance: Stance) => void;
  onSetDelegate: (personId: string, topicId: string, delegateTo: string) => void;
}

export function DelegationMatrix({
  people,
  topics,
  ballots,
  onSetDirect,
  onSetDelegate,
}: DelegationMatrixProps) {
  if (people.length === 0 || topics.length === 0) {
    return <p>人物とトピックを1件以上登録してください。</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>人物 \ トピック</th>
          {topics.map((t) => (
            <th key={t.id}>{t.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {people.map((person) => (
          <tr key={person.id}>
            <th>{person.name}</th>
            {topics.map((topic) => {
              const ballot = ballots.find(
                (b) => b.personId === person.id && b.topicId === topic.id
              );
              return (
                <BallotCell
                  key={topic.id}
                  person={person}
                  topic={topic}
                  ballot={ballot}
                  otherPeople={people.filter((p) => p.id !== person.id)}
                  onSetDirect={(stance) => onSetDirect(person.id, topic.id, stance)}
                  onSetDelegate={(delegateTo) => onSetDelegate(person.id, topic.id, delegateTo)}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/DelegationMatrix.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/mechanisms/liquidDemocracy/components/BallotCell.tsx src/mechanisms/liquidDemocracy/components/DelegationMatrix.tsx src/mechanisms/liquidDemocracy/components/DelegationMatrix.test.tsx
git commit -m "feat: add delegation matrix admin UI"
```

---

## Task 8: Circular Layout + Delegation Network Graph

**Files:**
- Create: `src/mechanisms/liquidDemocracy/components/layout.ts`
- Create: `src/mechanisms/liquidDemocracy/components/layout.test.ts`
- Create: `src/mechanisms/liquidDemocracy/components/DelegationNetworkGraph.tsx`
- Create: `src/mechanisms/liquidDemocracy/components/DelegationNetworkGraph.test.tsx`

**Interfaces:**
- Consumes: `Person`, `Ballot`, `ResolvedStance` from `../types`.
- Produces: `computeCircularLayout(ids: string[], width: number, height: number): Map<string, {x: number; y: number}>`; `DelegationNetworkGraph({ people, ballots, topicId, resolved })` where `resolved: Map<string, ResolvedStance>`.

- [ ] **Step 1: Write the failing tests for `computeCircularLayout`**

```typescript
import { describe, it, expect } from "vitest";
import { computeCircularLayout } from "./layout";

describe("computeCircularLayout", () => {
  it("places a single node at the top of the circle", () => {
    const positions = computeCircularLayout(["a"], 400, 400);
    const p = positions.get("a")!;
    expect(p.x).toBeCloseTo(200);
    expect(p.y).toBeCloseTo(200 - (200 - 40));
  });

  it("returns one position per id", () => {
    const positions = computeCircularLayout(["a", "b", "c", "d"], 400, 400);
    expect(positions.size).toBe(4);
  });

  it("returns an empty map for no ids", () => {
    const positions = computeCircularLayout([], 400, 400);
    expect(positions.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/layout.test.ts`
Expected: FAIL — `layout.ts` does not exist yet.

- [ ] **Step 3: Implement `layout.ts`**

```typescript
export interface Point {
  x: number;
  y: number;
}

export function computeCircularLayout(
  ids: string[],
  width: number,
  height: number
): Map<string, Point> {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const positions = new Map<string, Point>();
  const n = ids.length;
  ids.forEach((id, i) => {
    const angle = n > 0 ? (2 * Math.PI * i) / n - Math.PI / 2 : 0;
    positions.set(id, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });
  return positions;
}
```

- [ ] **Step 4: Run the layout tests to verify they pass**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/layout.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for `DelegationNetworkGraph`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DelegationNetworkGraph } from "./DelegationNetworkGraph";
import type { Person, Ballot, ResolvedStance } from "../types";

describe("DelegationNetworkGraph", () => {
  it("renders one node label per person", () => {
    const people: Person[] = [
      { id: "1", name: "山田", expertiseTags: [] },
      { id: "2", name: "佐藤", expertiseTags: [] },
    ];
    const ballots: Ballot[] = [
      { personId: "1", topicId: "t1", mode: "delegate", delegateTo: "2" },
      { personId: "2", topicId: "t1", mode: "direct", stance: "agree" },
    ];
    const resolved = new Map<string, ResolvedStance>([
      ["1", "agree"],
      ["2", "agree"],
    ]);
    render(
      <DelegationNetworkGraph people={people} ballots={ballots} topicId="t1" resolved={resolved} />
    );
    expect(screen.getByText("山田")).toBeInTheDocument();
    expect(screen.getByText("佐藤")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "委任ネットワークグラフ" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/DelegationNetworkGraph.test.tsx`
Expected: FAIL — `DelegationNetworkGraph.tsx` does not exist yet.

- [ ] **Step 7: Implement `DelegationNetworkGraph.tsx`**

```tsx
import type { Person, Ballot, ResolvedStance } from "../types";
import { computeCircularLayout } from "./layout";

const STANCE_COLORS: Record<ResolvedStance, string> = {
  agree: "#16a34a",
  disagree: "#dc2626",
  neutral: "#6b7280",
  circular: "#f59e0b",
  unresolved: "#9ca3af",
};

const WIDTH = 480;
const HEIGHT = 480;

interface DelegationNetworkGraphProps {
  people: Person[];
  ballots: Ballot[];
  topicId: string;
  resolved: Map<string, ResolvedStance>;
}

export function DelegationNetworkGraph({
  people,
  ballots,
  topicId,
  resolved,
}: DelegationNetworkGraphProps) {
  const positions = computeCircularLayout(
    people.map((p) => p.id),
    WIDTH,
    HEIGHT
  );

  const delegationEdges = ballots.filter(
    (b) => b.topicId === topicId && b.mode === "delegate" && positions.has(b.delegateTo ?? "")
  );

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="委任ネットワークグラフ"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#9ca3af" />
        </marker>
      </defs>
      {delegationEdges.map((edge) => {
        const from = positions.get(edge.personId)!;
        const to = positions.get(edge.delegateTo!)!;
        const isCircular = resolved.get(edge.personId) === "circular";
        return (
          <line
            key={`${edge.personId}-${edge.delegateTo}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isCircular ? "#f59e0b" : "#9ca3af"}
            strokeWidth={isCircular ? 3 : 1.5}
            strokeDasharray={isCircular ? "4 2" : undefined}
            markerEnd="url(#arrow)"
          />
        );
      })}
      {people.map((person) => {
        const pos = positions.get(person.id)!;
        const stance = resolved.get(person.id) ?? "unresolved";
        return (
          <g key={person.id}>
            <circle cx={pos.x} cy={pos.y} r={18} fill={STANCE_COLORS[stance]} />
            <text x={pos.x} y={pos.y + 32} textAnchor="middle" fontSize={12}>
              {person.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/DelegationNetworkGraph.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 9: Commit**

```bash
git add src/mechanisms/liquidDemocracy/components/layout.ts src/mechanisms/liquidDemocracy/components/layout.test.ts src/mechanisms/liquidDemocracy/components/DelegationNetworkGraph.tsx src/mechanisms/liquidDemocracy/components/DelegationNetworkGraph.test.tsx
git commit -m "feat: add circular layout and delegation network graph"
```

---

## Task 9: Vote Tally Chart

**Files:**
- Create: `src/mechanisms/liquidDemocracy/components/VoteTallyChart.tsx`
- Create: `src/mechanisms/liquidDemocracy/components/VoteTallyChart.test.tsx`

**Interfaces:**
- Consumes: `ResolvedStance` from `../types`.
- Produces: `VoteTallyChart({ resolved })` where `resolved: Map<string, ResolvedStance>`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoteTallyChart } from "./VoteTallyChart";
import type { ResolvedStance } from "../types";

describe("VoteTallyChart", () => {
  it("renders counts per stance category", () => {
    const resolved = new Map<string, ResolvedStance>([
      ["1", "agree"],
      ["2", "agree"],
      ["3", "disagree"],
      ["4", "circular"],
    ]);
    render(<VoteTallyChart resolved={resolved} />);
    expect(screen.getByText("賛成")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("反対")).toBeInTheDocument();
    expect(screen.getByText("未確定")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/VoteTallyChart.test.tsx`
Expected: FAIL — `VoteTallyChart.tsx` does not exist yet.

- [ ] **Step 3: Implement `VoteTallyChart.tsx`**

```tsx
import type { ResolvedStance } from "../types";

interface VoteTallyChartProps {
  resolved: Map<string, ResolvedStance>;
}

const BAR_ORDER: { key: ResolvedStance[]; label: string; color: string }[] = [
  { key: ["agree"], label: "賛成", color: "#16a34a" },
  { key: ["disagree"], label: "反対", color: "#dc2626" },
  { key: ["neutral"], label: "中立", color: "#6b7280" },
  { key: ["circular", "unresolved"], label: "未確定", color: "#9ca3af" },
];

const WIDTH = 320;
const HEIGHT = 220;
const BAR_WIDTH = 50;
const GAP = 20;

export function VoteTallyChart({ resolved }: VoteTallyChartProps) {
  const values = Array.from(resolved.values());
  const counts = BAR_ORDER.map(({ key, label, color }) => ({
    label,
    color,
    count: values.filter((v) => key.includes(v)).length,
  }));
  const maxCount = Math.max(1, ...counts.map((c) => c.count));
  const chartHeight = HEIGHT - 40;

  return (
    <svg width={WIDTH} height={HEIGHT} role="img" aria-label="投票集計グラフ">
      {counts.map((c, i) => {
        const barHeight = (c.count / maxCount) * chartHeight;
        const x = i * (BAR_WIDTH + GAP) + GAP;
        const y = chartHeight - barHeight;
        return (
          <g key={c.label}>
            <rect x={x} y={y} width={BAR_WIDTH} height={barHeight} fill={c.color} />
            <text x={x + BAR_WIDTH / 2} y={chartHeight + 16} textAnchor="middle" fontSize={12}>
              {c.label}
            </text>
            <text x={x + BAR_WIDTH / 2} y={y - 4} textAnchor="middle" fontSize={12}>
              {c.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/VoteTallyChart.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/mechanisms/liquidDemocracy/components/VoteTallyChart.tsx src/mechanisms/liquidDemocracy/components/VoteTallyChart.test.tsx
git commit -m "feat: add vote tally bar chart"
```

---

## Task 10: Direct vs Delegate Summary

**Files:**
- Create: `src/mechanisms/liquidDemocracy/components/DirectVsDelegateSummary.tsx`
- Create: `src/mechanisms/liquidDemocracy/components/DirectVsDelegateSummary.test.tsx`

**Interfaces:**
- Consumes: `Ballot` from `../types`.
- Produces: `DirectVsDelegateSummary({ ballots, topicId, totalPeople })`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DirectVsDelegateSummary } from "./DirectVsDelegateSummary";
import type { Ballot } from "../types";

describe("DirectVsDelegateSummary", () => {
  it("counts direct votes, delegations, and unset ballots for a topic", () => {
    const ballots: Ballot[] = [
      { personId: "1", topicId: "t1", mode: "direct", stance: "agree" },
      { personId: "2", topicId: "t1", mode: "delegate", delegateTo: "1" },
      { personId: "3", topicId: "t2", mode: "direct", stance: "agree" },
    ];
    render(<DirectVsDelegateSummary ballots={ballots} topicId="t1" totalPeople={3} />);
    expect(screen.getByText("直接投票: 1人 / 委任: 1人 / 未設定: 1人")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/DirectVsDelegateSummary.test.tsx`
Expected: FAIL — `DirectVsDelegateSummary.tsx` does not exist yet.

- [ ] **Step 3: Implement `DirectVsDelegateSummary.tsx`**

```tsx
import type { Ballot } from "../types";

interface DirectVsDelegateSummaryProps {
  ballots: Ballot[];
  topicId: string;
  totalPeople: number;
}

export function DirectVsDelegateSummary({
  ballots,
  topicId,
  totalPeople,
}: DirectVsDelegateSummaryProps) {
  const topicBallots = ballots.filter((b) => b.topicId === topicId);
  const directCount = topicBallots.filter((b) => b.mode === "direct").length;
  const delegateCount = topicBallots.filter((b) => b.mode === "delegate").length;
  const unsetCount = totalPeople - directCount - delegateCount;

  return (
    <div>
      <p>
        直接投票: {directCount}人 / 委任: {delegateCount}人
        {unsetCount > 0 ? ` / 未設定: ${unsetCount}人` : ""}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/mechanisms/liquidDemocracy/components/DirectVsDelegateSummary.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/mechanisms/liquidDemocracy/components/DirectVsDelegateSummary.tsx src/mechanisms/liquidDemocracy/components/DirectVsDelegateSummary.test.tsx
git commit -m "feat: add direct-vs-delegate summary component"
```

---

## Task 11: Admin View, Results View, and App Routing

**Files:**
- Create: `src/mechanisms/liquidDemocracy/AdminView.tsx`
- Create: `src/mechanisms/liquidDemocracy/ResultsView.tsx`
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes: everything produced by Tasks 2–10 (`useLiquidDemocracy`, `resolveTopic`, `PersonManager`, `TopicManager`, `DelegationMatrix`, `VoteTallyChart`, `DelegationNetworkGraph`, `DirectVsDelegateSummary`).
- Produces: the final routed application (`/`, `/admin`, `/results`).

- [ ] **Step 1: Implement `AdminView.tsx`**

```tsx
import { Link } from "react-router-dom";
import { useLiquidDemocracy } from "./state/context";
import { PersonManager } from "./components/PersonManager";
import { TopicManager } from "./components/TopicManager";
import { DelegationMatrix } from "./components/DelegationMatrix";

export function AdminView() {
  const { state, dispatch } = useLiquidDemocracy();

  return (
    <div>
      <h1>管理画面: リキッド・デモクラシー</h1>
      <PersonManager
        people={state.people}
        onAdd={(name, expertiseTags) =>
          dispatch({ type: "ADD_PERSON", id: crypto.randomUUID(), name, expertiseTags })
        }
        onUpdate={(id, name, expertiseTags) =>
          dispatch({ type: "UPDATE_PERSON", id, name, expertiseTags })
        }
        onRemove={(id) => dispatch({ type: "REMOVE_PERSON", id })}
      />
      <TopicManager
        topics={state.topics}
        onAdd={(title, description) =>
          dispatch({ type: "ADD_TOPIC", id: crypto.randomUUID(), title, description })
        }
        onUpdate={(id, title, description) =>
          dispatch({ type: "UPDATE_TOPIC", id, title, description })
        }
        onRemove={(id) => dispatch({ type: "REMOVE_TOPIC", id })}
      />
      <DelegationMatrix
        people={state.people}
        topics={state.topics}
        ballots={state.ballots}
        onSetDirect={(personId, topicId, stance) =>
          dispatch({ type: "SET_DIRECT_BALLOT", personId, topicId, stance })
        }
        onSetDelegate={(personId, topicId, delegateTo) =>
          dispatch({ type: "SET_DELEGATE_BALLOT", personId, topicId, delegateTo })
        }
      />
      <Link to="/results">結果を見る</Link>
    </div>
  );
}
```

- [ ] **Step 2: Implement `ResultsView.tsx`**

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiquidDemocracy } from "./state/context";
import { resolveTopic } from "./resolveDelegation";
import { VoteTallyChart } from "./components/VoteTallyChart";
import { DelegationNetworkGraph } from "./components/DelegationNetworkGraph";
import { DirectVsDelegateSummary } from "./components/DirectVsDelegateSummary";

export function ResultsView() {
  const { state } = useLiquidDemocracy();
  const [selectedTopicId, setSelectedTopicId] = useState(state.topics[0]?.id ?? "");

  if (state.topics.length === 0) {
    return (
      <div>
        <p>トピックが登録されていません。</p>
        <Link to="/admin">管理画面に戻る</Link>
      </div>
    );
  }

  const topicId = selectedTopicId || state.topics[0].id;
  const resolved = resolveTopic(state.people, state.ballots, topicId);

  return (
    <div>
      <h1>結果: リキッド・デモクラシー</h1>
      <label>
        トピック
        <select value={topicId} onChange={(e) => setSelectedTopicId(e.target.value)}>
          {state.topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <VoteTallyChart resolved={resolved} />
      <DelegationNetworkGraph
        people={state.people}
        ballots={state.ballots}
        topicId={topicId}
        resolved={resolved}
      />
      <DirectVsDelegateSummary
        ballots={state.ballots}
        topicId={topicId}
        totalPeople={state.people.length}
      />
      <Link to="/admin">管理画面に戻る</Link>
    </div>
  );
}
```

- [ ] **Step 3: Write the failing App integration tests**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("redirects from / to /admin", () => {
    render(<App />);
    expect(screen.getByText("管理画面: リキッド・デモクラシー")).toBeInTheDocument();
  });

  it("navigates to results and shows the empty-topics message", () => {
    render(<App />);
    fireEvent.click(screen.getByText("結果を見る"));
    expect(screen.getByText("トピックが登録されていません。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the App tests to verify they fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `App.tsx` still renders the Task 1 placeholder, not the routed views.

- [ ] **Step 5: Replace `App.tsx` with the routed application**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LiquidDemocracyProvider } from "./mechanisms/liquidDemocracy/state/context";
import { AdminView } from "./mechanisms/liquidDemocracy/AdminView";
import { ResultsView } from "./mechanisms/liquidDemocracy/ResultsView";

export default function App() {
  return (
    <LiquidDemocracyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="/results" element={<ResultsView />} />
        </Routes>
      </BrowserRouter>
    </LiquidDemocracyProvider>
  );
}
```

- [ ] **Step 6: Run the App tests to verify they pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: All test files pass (Tasks 2–11 combined).

- [ ] **Step 8: Verify the production build still works**

Run: `npm run build`
Expected: TypeScript compiles with no errors, Vite produces a `dist/` folder.

- [ ] **Step 9: Manually verify in the browser**

Run: `npm run dev`, open the printed local URL. Confirm:
- `/` redirects to `/admin`.
- Adding 3+ people and 1+ topics lets you set direct votes and delegations in the matrix.
- Creating a delegation chain (A→B→C direct) and a circular delegation (A→B→A) and viewing `/results` shows correct tallies, the network graph with colored nodes/edges, and the direct-vs-delegate summary.

- [ ] **Step 10: Commit**

```bash
git add src/mechanisms/liquidDemocracy/AdminView.tsx src/mechanisms/liquidDemocracy/ResultsView.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: wire up admin/results views and app routing"
```

---

## Spec Coverage Check

- 人物・トピック管理画面 → Tasks 5, 6, 11 (AdminView)
- 委任マトリクス(直接投票 or 委任) → Task 7
- 委任チェーンの解決・循環検出 → Task 2
- 結果画面: 投票集計グラフ → Task 9
- 結果画面: 委任ネットワークグラフ → Task 8
- 結果画面: 直接投票 vs 委任の割合 → Task 10
- データはブラウザ内メモリのみ(永続化なし) → Task 3/4 (Context + useReducer, no storage/backend anywhere in the plan)
- 拡張可能なモジュール構成 → all files under `src/mechanisms/liquidDemocracy/`, `App.tsx` is the only file future mechanisms will add routes to
