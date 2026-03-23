import * as ts from "typescript";

export interface TranspileResult {
  success: boolean;
  output: string;
  sourceMap?: string;
  errors: Array<{
    message: string;
    line?: number;
    column?: number;
  }>;
}

export function transpileTypeScript(code: string): TranspileResult {
  try {
    const result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        strict: true,
        esModuleInterop: true,
        sourceMap: true,
        inlineSources: true,
      },
      reportDiagnostics: true,
    });

    const errors: TranspileResult["errors"] = [];

    if (result.diagnostics) {
      result.diagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start!
          );
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
          errors.push({
            message,
            line: line + 1,
            column: character + 1,
          });
        } else {
          errors.push({
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
          });
        }
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        output: "",
        errors,
      };
    }

    return {
      success: true,
      output: result.outputText,
      sourceMap: result.sourceMapText,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      errors: [
        {
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

// Parse original TypeScript code to find console.* line numbers
export function getConsoleLineNumbers(code: string): Map<number, number> {
  const lineMap = new Map<number, number>();
  
  const lines = code.split("\n");
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    // Match console.log(, console.error(, etc.
    if (/console\.\w+\s*\(/.test(line)) {
      lineMap.set(lineNumber, lineNumber);
    }
  });
  
  return lineMap;
}
