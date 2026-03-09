import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useRef, useEffect, useCallback } from "react";
import type { Language, Settings } from "../stores/appStore";
import styles from "../styles/Editor.module.css";

interface EditorProps {
  value: string;
  language: Language;
  onChange: (value: string | undefined) => void;
  settings: Settings;
  onScroll?: (scrollTop: number) => void;
  errors?: Array<{
    line: number;
    column: number;
    message: string;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonacoTheme = any;

const DEBUG_NORD_THEME = import.meta.env.DEV;
const tokenColor = (hex: string) => hex.replace("#", "");

function runNordDiagnostics(monaco: unknown, activeTheme: string, language: Language) {
  if (!DEBUG_NORD_THEME || activeTheme !== "nord") return;

  const monacoEditor = monaco as {
    editor: {
      tokenize: (text: string, languageId: string) => Array<Array<{ offset: number; type: string }>>;
    };
  };

  const samples = [
    "inventory.push({ name: \"naranja\", quantity: 10 });",
    "function findProductIndex() { return console.log(Math.max(1, 0, -1)); }",
    "const msg = `hola ${inventory[index].name}`;",
  ];

  const diagnostics = samples.map((line) => ({
    line,
    tokens: monacoEditor.editor.tokenize(line, language)[0] ?? [],
  }));

  console.group("[Nord theme diagnostics]");
  console.log("activeTheme", activeTheme);
  console.log("language", language);
  console.log("tokenization", diagnostics);
  console.groupEnd();
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

// Theme definitions for Monaco - EXACT MAPPING
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
      { token: "type", foreground: "8FBCBB" },
      { token: "class", foreground: "8FBCBB" },
    ],
    colors: {
      "editor.background": "#ECEFF4",
      "editor.foreground": "#2E3440",
      "editor.lineHighlightBackground": "#E5E9F0",
      "editor.selectionBackground": "#D8DEE9",
    },
  },
  "vs-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1E1E1E",
      "editor.foreground": "#D4D4D4",
      "editor.lineHighlightBackground": "#2D2D2D",
      "editor.selectionBackground": "#264F78",
    },
  },
};

export default function Editor({ value, language, onChange, settings, onScroll, errors = [] }: EditorProps) {
  const editorRef = useRef<unknown>(null);
  const monacoRef = useRef<unknown>(null);
  const themeDefinedRef = useRef(false);

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
      runNordDiagnostics(monaco, settings.theme, language);
    }
  }, [settings.theme, defineThemes, language]);

  // Update error markers when errors change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = editorRef.current as any;
    const model = editor.getModel?.();

    if (model && editor.deltaDecorations) {
      const newDecorations = errors.map((error) => ({
        range: {
          startLineNumber: error.line,
          startColumn: error.column,
          endLineNumber: error.line,
          endColumn: error.column + 1,
        },
        options: {
          className: styles.errorLine,
          hoverMessage: { value: `❌ ${error.message}` },
          glyphMarginClassName: styles.errorGlyph,
        },
      }));

      editor.deltaDecorations([], newDecorations);
    }
  }, [errors]);

  const handleScroll = useCallback((_e: unknown) => {
    if (onScroll && editorRef.current) {
      const editor = editorRef.current as {
        getScrollTop?: () => number;
      };
      if (editor && typeof editor.getScrollTop === "function") {
        onScroll(editor.getScrollTop());
      }
    }
  }, [onScroll]);

  // Define theme BEFORE mounting (critical for proper theme application)
  const handleEditorBeforeMount = (monaco: unknown) => {
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
    runNordDiagnostics(monaco, settings.theme, language);
  };

  const handleEditorDidMount = (editor: unknown) => {
    editorRef.current = editor;

    if (editor && typeof editor === "object" && "onDidScrollChange" in editor) {
      (editor as { onDidScrollChange: (cb: (e: unknown) => void) => void }).onDidScrollChange(handleScroll);
    }
  };

  return (
    <div className={styles.container}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        beforeMount={handleEditorBeforeMount}
        onMount={handleEditorDidMount}
        // Theme is defined in beforeMount to ensure it loads before render
        options={{
          minimap: { enabled: false },
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          lineNumbers: settings.showLineNumbers ? "on" : "off",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: settings.tabSize,
          wordWrap: "on",
          padding: { top: 10 },
          bracketPairColorization: { enabled: false },
        }}
      />
    </div>
  );
}
