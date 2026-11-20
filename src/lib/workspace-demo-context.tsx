"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useActivePharmacyId } from "@/lib/workspace-context";
import {
  createDemoWorkspaceData,
  createEmptyDemoWorkspaceData,
  isDemoWorkspaceData,
  type DemoWorkspaceData,
} from "@/lib/workspace-demo";

const STORAGE_KEY = "medisync-demo-workspaces-v1";

type WorkspaceMap = Record<string, DemoWorkspaceData>;
type StoreSnapshot = {
  workspaces: WorkspaceMap;
  ready: boolean;
  todayISO: string;
  storageError: string | null;
};

type DemoWorkspaceContextValue = StoreSnapshot & {
  pharmacyId: string;
  data: DemoWorkspaceData | null;
  loadDemoData: () => void;
  updateData: (
    update: (current: DemoWorkspaceData) => DemoWorkspaceData,
  ) => void;
  clearAllDemoData: () => void;
};

const serverSnapshot: StoreSnapshot = {
  workspaces: {},
  ready: false,
  todayISO: "",
  storageError: null,
};

const DemoWorkspaceContext = createContext<DemoWorkspaceContextValue | null>(null);
let snapshot = serverSnapshot;
let hydrationStarted = false;
const listeners = new Set<() => void>();

function isWorkspaceMap(value: unknown): value is WorkspaceMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(isDemoWorkspaceData);
}

function getTodayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function publish(next: StoreSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function hydrateFromBrowser() {
  let workspaces: WorkspaceMap = {};
  let storageError: string | null = null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (!isWorkspaceMap(parsed)) {
        throw new Error("Saved demo data has an unsupported format.");
      }
      workspaces = parsed;
    }
  } catch {
    storageError =
      "Saved demo data could not be read. Load demo data again to replace it.";
  }
  publish({
    workspaces,
    ready: true,
    todayISO: getTodayInIndia(),
    storageError,
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!hydrationStarted && typeof window !== "undefined") {
    hydrationStarted = true;
    queueMicrotask(hydrateFromBrowser);
  }
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreSnapshot {
  return typeof window === "undefined" ? serverSnapshot : snapshot;
}

function getServerSnapshot(): StoreSnapshot {
  return serverSnapshot;
}

function persist(workspaces: WorkspaceMap) {
  const next = {
    ...snapshot,
    workspaces,
    ready: true,
    storageError: null,
  };
  try {
    if (Object.keys(workspaces).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
    }
    publish(next);
  } catch {
    publish({
      ...next,
      storageError:
        "Demo changes could not be saved in this browser. Check storage permissions.",
    });
  }
}

export function DemoWorkspaceProvider({ children }: { children: ReactNode }) {
  const pharmacyId = useActivePharmacyId();
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const data = current.workspaces[pharmacyId] ?? null;

  function loadDemoData() {
    const existing = current.workspaces[pharmacyId];
    const sample = createDemoWorkspaceData(pharmacyId, new Date());
    if (!existing) {
      persist({
        ...current.workspaces,
        [pharmacyId]: sample,
      });
      return;
    }

    const existingCustomerIds = new Set(
      existing.customers.map((customer) => customer.id),
    );
    const next: DemoWorkspaceData = {
      ...sample,
      ...existing,
      customers: [
        ...existing.customers,
        ...sample.customers.filter(
          (customer) => !existingCustomerIds.has(customer.id),
        ),
      ],
      sales: existing.sales.length > 0 ? existing.sales : sample.sales,
      inventoryQuantities:
        existing.sales.length > 0
          ? existing.inventoryQuantities
          : sample.inventoryQuantities,
    };
    persist({
      ...current.workspaces,
      [pharmacyId]: next,
    });
  }

  function updateData(
    update: (value: DemoWorkspaceData) => DemoWorkspaceData,
  ) {
    persist({
      ...current.workspaces,
      [pharmacyId]: update(
        data ?? createEmptyDemoWorkspaceData(pharmacyId),
      ),
    });
  }

  function clearAllDemoData() {
    persist({});
  }

  return (
    <DemoWorkspaceContext.Provider
      value={{
        ...current,
        pharmacyId,
        data,
        loadDemoData,
        updateData,
        clearAllDemoData,
      }}
    >
      {children}
    </DemoWorkspaceContext.Provider>
  );
}

export function useDemoWorkspace(): DemoWorkspaceContextValue {
  const context = useContext(DemoWorkspaceContext);
  if (!context) {
    throw new Error(
      "useDemoWorkspace must be used inside DemoWorkspaceProvider.",
    );
  }
  return context;
}
