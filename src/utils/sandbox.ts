import type { ConsoleEntry } from "../stores/appStore";

export interface ExecutionResult {
  success: boolean;
  consoleOutput: ConsoleEntry[];
  error?: {
    message: string;
    stack?: string;
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
      });
    },
    error: (...args: unknown[]) => {
      consoleOutput.push({
        type: "error",
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
      });
    },
    warn: (...args: unknown[]) => {
      consoleOutput.push({
        type: "warn",
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
      });
    },
    info: (...args: unknown[]) => {
      consoleOutput.push({
        type: "info",
        content: args.map(formatValue).join(" "),
        timestamp: Date.now(),
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

export async function executeInSandbox(
  code: string,
  timeout = 5000
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const { consoleOutput, sandboxConsole } = createSandbox();

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        consoleOutput,
        error: {
          message: "Execution timed out (5 second limit)",
        },
        executionTime: timeout,
      });
    }, timeout);

    try {
      const fn = new Function("console", `
        "use strict";
        ${code}
      `);
      fn(sandboxConsole);

      clearTimeout(timeoutId);
      resolve({
        success: true,
        consoleOutput,
        executionTime: performance.now() - startTime,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        consoleOutput,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        executionTime: performance.now() - startTime,
      });
    }
  });
}
