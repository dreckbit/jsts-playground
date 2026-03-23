import type { ConsoleEntry } from "../stores/appStore";

export interface ExecutionResult {
  success: boolean;
  consoleOutput: ConsoleEntry[];
  error?: {
    message: string;
    stack?: string;
    line?: number;
  };
  executionTime: number;
}

export function createSandbox() {
  const consoleOutput: ConsoleEntry[] = [];

  const sandboxConsole = {
    log: (...args: unknown[]) => {
      consoleOutput.push({
        type: "log",
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
        line: 0, // Will be set by wrapper
      });
    },
    error: (...args: unknown[]) => {
      consoleOutput.push({
        type: "error",
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
        line: 0,
      });
    },
    warn: (...args: unknown[]) => {
      consoleOutput.push({
        type: "warn",
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
        line: 0,
      });
    },
    info: (...args: unknown[]) => {
      consoleOutput.push({
        type: "info",
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
        line: 0,
      });
    },
    clear: () => {
      consoleOutput.length = 0;
    },
    table: (data: unknown) => {
      consoleOutput.push({
        type: "log",
        content: formatValue(data),
        timestamp: Date.now(),
        line: 0,
      });
    },
    time: () => {},
    timeEnd: () => {},
    group: () => {},
    groupEnd: () => {},
    dir: (obj: unknown) => {
      consoleOutput.push({
        type: "log",
        content: formatValue(obj),
        timestamp: Date.now(),
        line: 0,
      });
    },
    // Internal method to capture line number
    __log: (type: string, line: number, ...args: unknown[]) => {
      consoleOutput.push({
        type: type as ConsoleEntry["type"],
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
        line,
      });
    },
  };

  return { consoleOutput, sandboxConsole };
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "symbol") return value.toString();

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// Extract console.* line numbers from source code (works for both JS and TS)
function extractConsoleLines(sourceCode: string): number[] {
  const lines = sourceCode.split("\n");
  const consoleLineNumbers: number[] = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    // Match console.log(, console.error(, etc.
    if (/console\.\w+\s*\(/.test(line)) {
      consoleLineNumbers.push(lineNumber);
    }
  });
  
  return consoleLineNumbers;
}

// Wrap code to capture line numbers for console.* calls
function wrapCodeWithLineTracking(code: string, originalLineNumbers: number[]): string {
  let lineNumQueue = [...originalLineNumbers];
  
  // Use simple string replace instead of regex to avoid escaping issues
  return code.replace(
    /console\.(log|error|warn|info|table|dir)\(/g,
    (_match: string, method: string) => {
      const lineNum = lineNumQueue.shift() || 0;
      return `console.__log('${method}', ${lineNum}, `;
    }
  );
}

export async function executeInSandbox(
  code: string,
  timeout = 10000,
  originalSourceCode?: string
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const { consoleOutput } = createSandbox();

  // Extract original line numbers from source code
  const sourceToUse = originalSourceCode || code;
  const originalLineNumbers = extractConsoleLines(sourceToUse);
  
  // Wrap code to track line numbers
  const wrappedCode = wrapCodeWithLineTracking(code, originalLineNumbers);

  return new Promise((resolve) => {
    // Create worker inline using Blob
    const workerCode = `
      const consoleOutput = [];
      
      function formatValue(value) {
        if (value === null) return "null";
        if (value === undefined) return "undefined";
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        if (typeof value === "function") return "[Function: " + (value.name || "anonymous") + "]";
        if (typeof value === "symbol") return value.toString();
        try {
          return JSON.stringify(value, null, 2);
        } catch {
          return String(value);
        }
      }
      
      const sandboxConsole = {
        log: (...args) => consoleOutput.push({ type: "log", content: args.map(formatValue).join(" "), timestamp: Date.now(), line: 0 }),
        error: (...args) => consoleOutput.push({ type: "error", content: args.map(formatValue).join(" "), timestamp: Date.now(), line: 0 }),
        warn: (...args) => consoleOutput.push({ type: "warn", content: args.map(formatValue).join(" "), timestamp: Date.now(), line: 0 }),
        info: (...args) => consoleOutput.push({ type: "info", content: args.map(formatValue).join(" "), timestamp: Date.now(), line: 0 }),
        table: (data) => consoleOutput.push({ type: "log", content: formatValue(data), timestamp: Date.now(), line: 0 }),
        dir: (data) => consoleOutput.push({ type: "log", content: formatValue(data), timestamp: Date.now(), line: 0 }),
        __log: (type, line, ...args) => consoleOutput.push({ type: type, content: args.map(formatValue).join(" "), timestamp: Date.now(), line: line })
      };
      
      self.onmessage = function(e) {
        const code = e.data;
        try {
          const fn = new Function("console", "\\"use strict\\";\\n" + code);
          fn(sandboxConsole);
          self.postMessage({ success: true, consoleOutput });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          self.postMessage({ success: false, consoleOutput, error: { message: errorMessage, stack: errorStack } });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    // Set timeout to terminate worker
    const timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        success: false,
        consoleOutput,
        error: {
          message: `Execution timed out (${timeout / 1000} second limit) - possible infinite loop detected`,
        },
        executionTime: timeout,
      });
    }, timeout);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(workerUrl);
      
      const { success, consoleOutput: workerOutput, error } = e.data;
      
      resolve({
        success,
        consoleOutput: workerOutput || consoleOutput,
        error,
        executionTime: performance.now() - startTime,
      });
    };

    worker.onerror = (e) => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(workerUrl);
      resolve({
        success: false,
        consoleOutput,
        error: {
          message: e.message || "Worker error",
          stack: e.message,
        },
        executionTime: performance.now() - startTime,
      });
    };

    worker.postMessage(wrappedCode);
  });
}
