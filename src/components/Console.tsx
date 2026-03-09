import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import type { ConsoleEntry, Settings } from "../stores/appStore";
import styles from "../styles/Console.module.css";

interface ConsoleProps {
  entries: ConsoleEntry[];
  onClear: () => void;
  lineCount: number;
  settings: Settings;
  editorScrollTop?: number; // Scroll position from editor
}

// Exact Nord variant colors from user's VSCode - STRICT MAPPING
const COLORS = {
  background: "#292E39",
  foreground: "#D8DEE9",      // Texto base, variables, propiedades, TODA puntuación
  comment: "#4C566A",
  keyword: "#81A1C1",          // Palabras reservadas: let, const, function, if, return, for, etc.
  string: "#8FBCBB",          // Cadenas de texto: "texto", 'texto', `texto`
  function: "#88C0D0",         // Funciones/métodos: palabra seguida de (
  globalObject: "#88C0D0",     // Objetos globales: console, Math, Date, Promise
  number: "#B48EAD",          // Números: 1, 2, 100, -1
  type: "#8FBCBB",             // Tipos/Clases
};

const tokenColor = (hex: string) => hex.replace("#", "");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonacoTheme = any;

// Theme definitions for Monaco - EXACT MAPPING (same as Editor.tsx)
const MONACO_THEMES: Record<string, MonacoTheme> = {
  nord: {
    base: "vs-dark",
    inherit: false,
    rules: [
      // REGLA 0: Todo por defecto al color base
      { token: "", foreground: tokenColor(COLORS.foreground) },
      
      // ============================================
      // 1. TODA PUNTUACIÓN - Blanco Hueso #D8DEE9
      // ============================================
      { token: "delimiter", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.bracket", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.parenthesis", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.square", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.curly", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.angle", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.colon", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.comma", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.semicolon", foreground: tokenColor(COLORS.foreground) },
      { token: "delimiter.dot", foreground: tokenColor(COLORS.foreground) },
      { token: "operator", foreground: tokenColor(COLORS.foreground) },
      { token: "keyword.operator", foreground: tokenColor(COLORS.foreground) },
      { token: "punctuation", foreground: tokenColor(COLORS.foreground) },
      { token: "punctuation.definition.tag", foreground: tokenColor(COLORS.foreground) },
      { token: "punctuation.definition.block", foreground: tokenColor(COLORS.foreground) },
      { token: "punctuation.definition.parameters", foreground: tokenColor(COLORS.foreground) },
      { token: "punctuation.definition.array", foreground: tokenColor(COLORS.foreground) },
      { token: "punctuation.definition.object", foreground: tokenColor(COLORS.foreground) },
      { token: "punctuation.definition.string", foreground: tokenColor(COLORS.string) },
      { token: "punctuation.definition.template-expression", foreground: tokenColor(COLORS.keyword) },

      // ============================================
      // 2. VARIABLES Y PROPIEDADES - Blanco Hueso #D8DEE9
      // ============================================
      { token: "variable", foreground: tokenColor(COLORS.foreground) },
      { token: "variable.other", foreground: tokenColor(COLORS.foreground) },
      { token: "variable.other.readwrite", foreground: tokenColor(COLORS.foreground) },
      { token: "variable.other.object", foreground: tokenColor(COLORS.foreground) },
      { token: "variable.other.property", foreground: tokenColor(COLORS.foreground) },
      { token: "variable.language", foreground: tokenColor(COLORS.foreground) },
      { token: "variable.parameter", foreground: tokenColor(COLORS.foreground) },
      { token: "identifier", foreground: tokenColor(COLORS.foreground) },
      { token: "property", foreground: tokenColor(COLORS.foreground) },
      { token: "property.name", foreground: tokenColor(COLORS.foreground) },
      { token: "property.value", foreground: tokenColor(COLORS.foreground) },
      { token: "member", foreground: tokenColor(COLORS.foreground) },
      
      // ============================================
      // 3. PALABRAS RESERVADAS - Azul Acero #81A1C1
      // ============================================
      { token: "keyword", foreground: tokenColor(COLORS.keyword) },
      { token: "keyword.control", foreground: tokenColor(COLORS.keyword) },
      { token: "keyword.control.flow", foreground: tokenColor(COLORS.keyword) },
      { token: "keyword.control.conditional", foreground: tokenColor(COLORS.keyword) },
      { token: "keyword.control.loop", foreground: tokenColor(COLORS.keyword) },
      { token: "storage", foreground: tokenColor(COLORS.keyword) },
      { token: "storage.type", foreground: tokenColor(COLORS.keyword) },
      { token: "storage.modifier", foreground: tokenColor(COLORS.keyword) },
      { token: "constant.language", foreground: tokenColor(COLORS.keyword) },
      
      // ============================================
      // 4. CADENAS DE TEXTO - Verde Salvia #8FBCBB
      // ============================================
      { token: "string", foreground: tokenColor(COLORS.string) },
      { token: "string.quoted", foreground: tokenColor(COLORS.string) },
      { token: "string.quoted.single", foreground: tokenColor(COLORS.string) },
      { token: "string.quoted.double", foreground: tokenColor(COLORS.string) },
      { token: "string.template", foreground: tokenColor(COLORS.string) },
      { token: "string.quote", foreground: tokenColor(COLORS.string) },
      
      // ============================================
      // 5. NÚMEROS - Púrpura #B48EAD
      // ============================================
      { token: "number", foreground: tokenColor(COLORS.number) },
      { token: "number.decimal", foreground: tokenColor(COLORS.number) },
      { token: "number.hex", foreground: tokenColor(COLORS.number) },
      { token: "number.octal", foreground: tokenColor(COLORS.number) },
      { token: "number.binary", foreground: tokenColor(COLORS.number) },
      { token: "number.float", foreground: tokenColor(COLORS.number) },
      { token: "constant.numeric", foreground: tokenColor(COLORS.number) },
      
      // ============================================
      // 6. FUNCIONES Y MÉTODOS - Cian Claro #88C0D0
      // ============================================
      { token: "function", foreground: tokenColor(COLORS.function) },
      { token: "function.name", foreground: tokenColor(COLORS.function) },
      { token: "function.call", foreground: tokenColor(COLORS.function) },
      { token: "function.method", foreground: tokenColor(COLORS.function) },
      { token: "support.function", foreground: tokenColor(COLORS.function) },
      { token: "entity.name.function", foreground: tokenColor(COLORS.function) },
      { token: "meta.function-call", foreground: tokenColor(COLORS.function) },
      { token: "meta.method-call", foreground: tokenColor(COLORS.function) },
      
      // ============================================
      // 7. OBJETOS GLOBALES - Cian Claro #88C0D0
      // ============================================
      { token: "variable.predefined", foreground: tokenColor(COLORS.globalObject) },
      { token: "support.class", foreground: tokenColor(COLORS.globalObject) },
      { token: "support.variable", foreground: tokenColor(COLORS.globalObject) },
      { token: "support.constant", foreground: tokenColor(COLORS.globalObject) },
      { token: "support.type", foreground: tokenColor(COLORS.globalObject) },
      { token: "support.object", foreground: tokenColor(COLORS.globalObject) },
      { token: "support.module", foreground: tokenColor(COLORS.globalObject) },
      { token: "type.identifier", foreground: tokenColor(COLORS.type) },
      { token: "entity.name.type", foreground: tokenColor(COLORS.type) },
      { token: "entity.name.class", foreground: tokenColor(COLORS.globalObject) },
      
      // ============================================
      // 8. TEMPLATE LITERALS ${ } - Azul #81A1C1
      // ============================================
      { token: "punctuation.definition.template-expression.begin", foreground: tokenColor(COLORS.keyword) },
      { token: "punctuation.definition.template-expression.end", foreground: tokenColor(COLORS.keyword) },
      
      // ============================================
      // 9. COMENTARIOS - Gris Pizarra #4C566A
      // ============================================
      { token: "comment", foreground: tokenColor(COLORS.comment), fontStyle: "italic" },
      { token: "comment.line", foreground: tokenColor(COLORS.comment), fontStyle: "italic" },
      { token: "comment.block", foreground: tokenColor(COLORS.comment), fontStyle: "italic" },
    ],
    colors: {
      "editor.background": COLORS.background,
      "editor.foreground": COLORS.foreground,
      "editor.lineHighlightBackground": "#3B4252",
      "editor.selectionBackground": "#434C5E",
      "editorCursor.foreground": COLORS.function,
      "editorLineNumber.foreground": COLORS.comment,
      "editorLineNumber.activeForeground": COLORS.foreground,
      "editor.inactiveSelectionBackground": "#3B4252",
      "editorIndentGuide.background": "#434C5E",
      "editorIndentGuide.activeBackground": COLORS.comment,
      "editorGutter.background": COLORS.background,
      "editorBracketHighlight.foreground1": COLORS.foreground,
      "editorBracketHighlight.foreground2": COLORS.foreground,
      "editorBracketHighlight.foreground3": COLORS.foreground,
      "editorBracketHighlight.foreground4": COLORS.foreground,
      "editorBracketHighlight.foreground5": COLORS.foreground,
      "editorBracketHighlight.foreground6": COLORS.foreground,
      "editorBracketHighlight.unexpectedBracket.foreground": COLORS.foreground,
      "editorBracketPairGuide.background1": "#434C5E",
      "editorBracketPairGuide.background2": "#434C5E",
      "editorBracketPairGuide.background3": "#434C5E",
      "editorBracketPairGuide.background4": "#434C5E",
      "editorBracketPairGuide.background5": "#434C5E",
      "editorBracketPairGuide.background6": "#434C5E",
      "editorBracketPairGuide.activeBackground1": COLORS.comment,
      "editorBracketPairGuide.activeBackground2": COLORS.comment,
      "editorBracketPairGuide.activeBackground3": COLORS.comment,
      "editorBracketPairGuide.activeBackground4": COLORS.comment,
      "editorBracketPairGuide.activeBackground5": COLORS.comment,
      "editorBracketPairGuide.activeBackground6": COLORS.comment,
    },
    encodedTokensColors: [],
  },
  "nord-snow-storm": {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "2E3440" },
      { token: "comment", foreground: "8FBCBB", fontStyle: "italic" },
      { token: "keyword", foreground: "5E81AC" },
      { token: "string", foreground: "A3BE8C" },
      { token: "function", foreground: "5E81AC" },
      { token: "number", foreground: "B48EAD" },
    ],
    colors: {
      "editor.background": "#ECEFF4",
      "editor.foreground": "#2E3440",
    },
  },
  "vs-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1E1E1E",
      "editor.foreground": "#D4D4D4",
    },
  },
};

// Generate console output text with line-aligned entries
function generateConsoleContent(entries: ConsoleEntry[], lineCount: number): string {
  if (entries.length === 0) {
    return "// Run your code to see output here";
  }

  // Create an array of lines, starting empty
  const lines: string[] = Array(lineCount).fill("");

  // Fill in the lines with console output
  entries.forEach((entry) => {
    if (entry.line && entry.line > 0 && entry.line <= lineCount) {
      // Add prefix based on type
      let prefix = "";
      switch (entry.type) {
        case "error":
          prefix = "❌ ";
          break;
        case "warn":
          prefix = "⚠️  ";
          break;
        case "info":
          prefix = "ℹ️  ";
          break;
        case "time":
          prefix = "⏱️ ";
          break;
        default:
          prefix = "→ ";
      }
      // Use += to append if multiple console.log() on same line
      const existing = lines[entry.line - 1];
      const newline = "\n";
      const newContent = existing ? existing + newline + prefix + String(entry.content) : prefix + String(entry.content);
      lines[entry.line - 1] = newContent;
    } else {
      // For entries without line numbers (like execution time), add to the end
      let prefix = "";
      switch (entry.type) {
        case "error":
          prefix = "❌ ";
          break;
        case "warn":
          prefix = "⚠️  ";
          break;
        case "info":
          prefix = "ℹ️  ";
          break;
        case "time":
          prefix = "⏱️ ";
          break;
        default:
          prefix = "→ ";
      }
      lines.push(prefix + String(entry.content));
    }
  });

  return lines.join("\n");
}

export default function Console({ entries, onClear, lineCount, settings, editorScrollTop }: ConsoleProps) {
  const editorRef = useRef<unknown>(null);
  const monacoRef = useRef<unknown>(null);
  const themeDefinedRef = useRef(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate content for the console editor
  const consoleContent = useMemo(() => {
    return generateConsoleContent(entries, lineCount);
  }, [entries, lineCount]);

  // Define themes once when Monaco loads
  const defineThemes = useCallback((monaco: unknown) => {
    if (themeDefinedRef.current) return;
    
    const monacoEditor = monaco as {
      editor: {
        defineTheme: (name: string, theme: MonacoTheme) => void;
        setTheme: (name: string) => void;
      };
    };
    
    Object.entries(MONACO_THEMES).forEach(([name, theme]) => {
      monacoEditor.editor.defineTheme(name, theme);
    });
    
    themeDefinedRef.current = true;
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current as {
        editor: {
          defineTheme: (name: string, theme: MonacoTheme) => void;
          setTheme: (name: string) => void;
        };
      };
      defineThemes(monaco);
      monaco.editor.setTheme(settings.theme);
    }
  }, [settings.theme, defineThemes]);

  // Sync scroll with editor when linked and not user-scrolling
  useEffect(() => {
    if (!settings.consoleLinked || isUserScrolling || !editorScrollTop || !editorRef.current) return;

    const editor = editorRef.current as {
      setScrollTop?: (top: number) => void;
    };
    
    if (editor && typeof editor.setScrollTop === "function") {
      editor.setScrollTop(editorScrollTop);
    }
  }, [editorScrollTop, settings.consoleLinked, isUserScrolling]);

  // Reset user scrolling when leaving console
  useEffect(() => {
    if (!isHovered) {
      // Small delay to prevent immediate re-sync
      const timeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isHovered]);

  // Define theme BEFORE mounting (critical for proper theme application)
  const handleEditorBeforeMount = useCallback((monaco: unknown) => {
    monacoRef.current = monaco;

    const monacoEditor = monaco as {
      editor: {
        defineTheme: (name: string, theme: MonacoTheme) => void;
        setTheme: (name: string) => void;
      };
    };

    // Define all themes before editor mounts
    Object.entries(MONACO_THEMES).forEach(([name, theme]) => {
      monacoEditor.editor.defineTheme(name, theme);
    });

    // Set theme immediately
    monacoEditor.editor.setTheme(settings.theme);
  }, [settings.theme]);

  const handleEditorMount = useCallback((editor: unknown) => {
    editorRef.current = editor;
  }, []);

  return (
    <div 
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.editor}>
        <MonacoEditor
          height="100%"
          language="plaintext"
          value={consoleContent}
          theme={settings.theme}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            lineNumbers: settings.showLineNumbers ? "on" : "off",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "off",
            padding: { top: 10, bottom: 40 },
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
        <button 
          className={styles.clearButtonFloating} 
          onClick={onClear}
          title="Clear console"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
