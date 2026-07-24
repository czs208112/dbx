import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TreeNode } from "@/types/database";

function installLocalStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => data.set(key, value)),
    removeItem: vi.fn((key: string) => data.delete(key)),
  });
}

function tableNode(): TreeNode {
  return {
    id: "conn:db:public:users",
    label: "users",
    type: "table",
    connectionId: "conn",
    database: "db",
    schema: "public",
    tableName: "users",
  };
}

describe("connectionStore pinned tree node removal", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    installLocalStorage();
    setActivePinia(createPinia());
  });

  it("does not pin a new table that reuses a deleted pinned table identity", async () => {
    vi.doMock("@/lib/backend/tauriRuntime", () => ({ isTauriRuntime: () => false }));

    const { useConnectionStore } = await import("@/stores/connectionStore");
    const store = useConnectionStore();
    const deletedTable = tableNode();
    store.treeNodes = [
      {
        id: "conn",
        label: "Connection",
        type: "connection",
        connectionId: "conn",
        children: [deletedTable],
      },
    ];

    store.toggleTreeNodePin(deletedTable);
    expect(store.isTreeNodePinned(deletedTable)).toBe(true);

    store.removeTreeNode(deletedTable.id);
    const replacement = tableNode();
    store.treeNodes[0].children = [replacement];

    expect(store.isTreeNodePinned(replacement)).toBe(false);
  });
});
