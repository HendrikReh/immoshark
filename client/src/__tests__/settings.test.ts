import { describe, it, expect, beforeEach } from "bun:test";
import { getProfiles, getDefaultProfile, saveProfile, deleteProfile } from "../lib/settings";
import type { CsvImportProfile } from "@immoshark/shared";

function makeProfile(overrides: Partial<CsvImportProfile> = {}): CsvImportProfile {
  return {
    id: crypto.randomUUID(),
    name: "Test",
    mapping: { Straße: "strasse", Ort: "ort" },
    aiEnabled: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Minimal localStorage polyfill for bun test
const store: Record<string, string> = {};
if (typeof globalThis.localStorage === "undefined") {
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("getProfiles", () => {
  it("returns empty array when no profiles saved", () => {
    expect(getProfiles()).toEqual([]);
  });

  it("returns saved profiles", () => {
    const p = makeProfile({ name: "A" });
    saveProfile(p);
    const result = getProfiles();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("A");
  });
});

describe("saveProfile", () => {
  it("adds a new profile", () => {
    saveProfile(makeProfile({ name: "First" }));
    saveProfile(makeProfile({ name: "Second" }));
    expect(getProfiles()).toHaveLength(2);
  });

  it("overwrites existing profile by id", () => {
    const p = makeProfile({ name: "Original" });
    saveProfile(p);
    saveProfile({ ...p, name: "Updated" });
    const result = getProfiles();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Updated");
  });

  it("clears isDefault on other profiles when saving a new default", () => {
    const a = makeProfile({ name: "A", isDefault: true });
    saveProfile(a);
    const b = makeProfile({ name: "B", isDefault: true });
    saveProfile(b);
    const result = getProfiles();
    expect(result.find((p) => p.id === a.id)!.isDefault).toBe(false);
    expect(result.find((p) => p.id === b.id)!.isDefault).toBe(true);
  });
});

describe("getDefaultProfile", () => {
  it("returns null when no default", () => {
    saveProfile(makeProfile({ isDefault: false }));
    expect(getDefaultProfile()).toBeNull();
  });

  it("returns the default profile", () => {
    saveProfile(makeProfile({ name: "Def", isDefault: true }));
    expect(getDefaultProfile()?.name).toBe("Def");
  });
});

describe("deleteProfile", () => {
  it("removes a profile", () => {
    const p = makeProfile();
    saveProfile(p);
    deleteProfile(p.id);
    expect(getProfiles()).toHaveLength(0);
  });

  it("does nothing for non-existent id", () => {
    saveProfile(makeProfile());
    deleteProfile("non-existent");
    expect(getProfiles()).toHaveLength(1);
  });
});
