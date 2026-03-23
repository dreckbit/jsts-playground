import { create } from "zustand";
import { transpileTypeScript } from "../utils/transpiler";
import { executeInSandbox } from "../utils/sandbox";

export type Language = "javascript" | "typescript";
export type ConsoleEntryType = "log" | "error" | "warn" | "info" | "result" | "time";
export type EditorTheme = "nord" | "nord-snow-storm" | "vs-dark";
export type LayoutOrientation = "horizontal" | "vertical";

export interface ConsoleEntry {
  type: ConsoleEntryType;
  content: string | number | object | null;
  timestamp?: number;
  line?: number; // Line number where console.* was called
}

export interface Settings {
  debounceDelay: number;
  executionTimeout: number; // in milliseconds
  showTimestamps: boolean;
  theme: EditorTheme;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  layoutOrientation: LayoutOrientation;
  editorRatio: number; // percentage 0-100
  showLineNumbers: boolean; // show line numbers in editor and console
  consoleLinked: boolean; // console follows editor scroll by default
}

export interface AppState {
  code: string;
  language: Language;
  consoleOutput: ConsoleEntry[];
  isExecuting: boolean;
  settings: Settings;
  showSettings: boolean;
  executionId: number; // Track execution to cancel stale runs
  tsErrors: Array<{
    line: number;
    column: number;
    message: string;
  }>;
  setCode: (code: string) => void;
  setLanguage: (lang: Language) => void;
  addConsoleEntry: (entry: ConsoleEntry) => void;
  clearConsole: () => void;
  setExecuting: (executing: boolean) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  toggleSettings: () => void;
  setTsErrors: (errors: AppState["tsErrors"]) => void;
  runCode: () => void;
}

const DEFAULT_CODE = `// Welcome to JS/TS Playground!
// Write TypeScript or JavaScript code here
// Code executes automatically in real-time

console.log("Hello, World!");
`;

const STORAGE_KEY = "js-ts-playground-state";
const VALID_THEMES: EditorTheme[] = ["nord", "nord-snow-storm", "vs-dark"];

// Read saved settings from localStorage synchronously at module load time
function getInitialSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const settings = parsed?.settings;
      if (settings) {
        return {
          theme: (settings.theme && VALID_THEMES.includes(settings.theme)) 
            ? settings.theme as EditorTheme 
            : "nord" as EditorTheme,
          editorRatio: typeof settings.editorRatio === "number" 
            ? settings.editorRatio 
            : 50,
        };
      }
    }
  } catch {
    // ignore parse errors
  }
  return { theme: "nord" as EditorTheme, editorRatio: 50 };
}

const INITIAL_SETTINGS = getInitialSettings();

export const useAppStore = create<AppState>((set, get) => ({
  code: DEFAULT_CODE,
  language: "javascript",
  consoleOutput: [],
  isExecuting: false,
  executionId: 0,
  showSettings: false,
  tsErrors: [],
  settings: {
    debounceDelay: 1000,
    executionTimeout: 10000,
    showTimestamps: true,
    theme: INITIAL_SETTINGS.theme,
    fontSize: 14,
    fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
    tabSize: 2,
    layoutOrientation: "horizontal",
    editorRatio: INITIAL_SETTINGS.editorRatio,
    showLineNumbers: true,
    consoleLinked: true,
  },

  setCode: (code) => set({ code }),

  setLanguage: (language) => set({ language }),

  addConsoleEntry: (entry) =>
    set((state) => ({
      consoleOutput: [...state.consoleOutput, entry],
    })),

  clearConsole: () => set({ consoleOutput: [] }),

  setExecuting: (isExecuting) => set({ isExecuting }),

  setTsErrors: (errors) => set({ tsErrors: errors }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

  runCode: async () => {
    const state = get();
    
    // Always increment execution ID to track this run
    const currentExecutionId = state.executionId + 1;
    set({ executionId: currentExecutionId });
    
    // Only clear console if nothing is currently executing
    // This prevents clearing when edits happen during execution
    if (!state.isExecuting) {
      state.clearConsole();
    }
    
    state.setExecuting(true);

    const startTime = performance.now();
    const originalSource = state.code;

    try {
      let codeToRun = state.code;

      // Check if this execution was cancelled by a newer edit
      if (get().executionId !== currentExecutionId) {
        return;
      }

      if (state.language === "typescript") {
        const transpileResult = transpileTypeScript(state.code);

        // Check if this execution was cancelled
        if (get().executionId !== currentExecutionId) {
          return;
        }

        if (!transpileResult.success) {
          transpileResult.errors.forEach((error) => {
            state.addConsoleEntry({
              type: "error",
              content: error.line
                ? `TypeScript Error (${error.line}:${error.column}): ${error.message}`
                : `TypeScript Error: ${error.message}`,
              timestamp: Date.now(),
              line: error.line,
            });
          });
          state.setExecuting(false);
          return;
        }

        codeToRun = transpileResult.output;
      }

      const result = await executeInSandbox(codeToRun, state.settings.executionTimeout, originalSource);

      // Check if this execution was cancelled
      if (get().executionId !== currentExecutionId) {
        return;
      }

      // Clear console before showing new results (only now we know it's the final run)
      state.clearConsole();
      
      result.consoleOutput.forEach((entry) => {
        state.addConsoleEntry(entry);
      });

      if (result.error) {
        state.addConsoleEntry({
          type: "error",
          content: result.error.message,
          timestamp: Date.now(),
          line: result.error.line,
        });
      }

      const executionTime = performance.now() - startTime;
      state.addConsoleEntry({
        type: "time",
        content: `Execution time: ${executionTime.toFixed(2)}ms`,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Check if this execution was cancelled
      if (get().executionId !== currentExecutionId) {
        return;
      }
      
      state.addConsoleEntry({
        type: "error",
        content: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    } finally {
      // Only reset if this is still the current execution
      if (get().executionId === currentExecutionId) {
        state.setExecuting(false);
      }
    }
  },
}));
