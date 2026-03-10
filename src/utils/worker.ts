// Web Worker for sandboxed code execution
// Runs code in a separate thread so it can be terminated on timeout

const consoleOutput: Array<{
  type: string;
  content: string;
  timestamp: number;
  line: number;
}> = [];

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

const sandboxConsole = {
  log: (...args: unknown[]) => {
    consoleOutput.push({
      type: "log",
      content: args.map(formatValue).join(" "),
      timestamp: Date.now(),
      line: 0,
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
  table: (data: unknown) => {
    consoleOutput.push({
      type: "log",
      content: formatValue(data),
      timestamp: Date.now(),
      line: 0,
    });
  },
  dir: (data: unknown) => {
    consoleOutput.push({
      type: "log",
      content: formatValue(data),
      timestamp: Date.now(),
      line: 0,
    });
  },
  __log: (type: string, line: number, ...args: unknown[]) => {
    consoleOutput.push({
      type: type as string,
      content: args.map(formatValue).join(" "),
      timestamp: Date.now(),
      line,
    });
  },
};

self.onmessage = (e: MessageEvent) => {
  const { code } = e.data;
  
  try {
    const fn = new Function("console", `
      "use strict";
      ${code}
    `);
    fn(sandboxConsole);
    
    self.postMessage({
      success: true,
      consoleOutput,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    self.postMessage({
      success: false,
      consoleOutput,
      error: {
        message: errorMessage,
        stack: errorStack,
      },
    });
  }
};
