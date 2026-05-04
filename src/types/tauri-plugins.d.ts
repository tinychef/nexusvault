// Type stubs for optional Tauri plugins not yet installed.
// Install with: npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process

declare module "@tauri-apps/plugin-updater" {
  export interface Update {
    available: boolean;
    version: string;
    downloadAndInstall(onEvent: (event: Record<string, unknown>) => void): Promise<void>;
  }
  export function check(): Promise<Update | null>;
}

declare module "@tauri-apps/plugin-process" {
  export function relaunch(): Promise<void>;
  export function exit(code?: number): Promise<void>;
}
