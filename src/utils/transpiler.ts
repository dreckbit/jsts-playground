import * as ts from "typescript";

export interface TranspileResult {
  success: boolean;
  output: string;
  errors: Array<{
    message: string;
    line?: number;
    column?: number;
  }>;
}

export function transpileTypeScript(code: string): TranspileResult {
  const errors: TranspileResult["errors"] = [];

  const compilerOptions: ts.CompilerOptions = {
    strict: true,
    noEmit: false,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    esModuleInterop: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram(["temp.ts"], compilerOptions, host);

  const diagnostics = ts.getPreEmitDiagnostics(program);

  diagnostics.forEach((diagnostic) => {
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

  if (errors.length > 0) {
    return {
      success: false,
      output: "",
      errors,
    };
  }

  try {
    const result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        strict: true,
        esModuleInterop: true,
      },
    });

    return {
      success: true,
      output: result.outputText,
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
