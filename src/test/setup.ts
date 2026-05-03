import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Tauri APIs
vi.mock("@tauri-apps/plugin-sql", () => {
  return {
    default: {
      load: vi.fn().mockResolvedValue({
        execute: vi.fn().mockResolvedValue(true),
        select: vi.fn().mockResolvedValue([]),
      }),
    },
  };
});

vi.mock("@tauri-apps/plugin-fs", () => {
  return {
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeFile: vi.fn().mockResolvedValue(true),
    exists: vi.fn().mockResolvedValue(true),
    mkdir: vi.fn().mockResolvedValue(true),
  };
});

vi.mock("@tauri-apps/api/path", () => {
  return {
    BaseDirectory: {
      AppLocalData: 1,
    },
  };
});
