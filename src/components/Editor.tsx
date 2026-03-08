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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonacoTheme = any;

const THEMES: Record<string, MonacoTheme> = {
  nord: {
    base: "vs-dark" as const,
    inherit: true,
    rules: [
      { token: "", foreground: "D8DEE9", background: "2E3440" },
      { token: "comment", foreground: "616E88", fontStyle: "italic" },
      { token: "keyword", foreground: "81A1C1" },
      { token: "string", foreground: "A3BE8C" },
      { token: "number", foreground: "B48EAD" },
      { token: "regexp", foreground: "B48EAD" },
      { token: "type", foreground: "8FBCBB" },
      { token: "class", foreground: "8FBCBB" },
      { token: "function", foreground: "88C0D0" },
      { token: "variable", foreground: "D8DEE9" },
      { token: "constant", foreground: "D8DEE9" },
      { token: "parameter", foreground: "D8DEE9" },
      { token: "punctuation", foreground: "ECEFF4" },
      { token: "operator", foreground: "81A1C1" },
    ],
    colors: {
      "editor.background": "#2E3440",
      "editor.foreground": "#D8DEE9",
      "editor.lineHighlightBackground": "#3B4252",
      "editor.selectionBackground": "#434C5E",
      "editorCursor.foreground": "#D8DEE9",
      "editorLineNumber.foreground": "#4C566A",
      "editorLineNumber.activeForeground": "#D8DEE9",
      "editor.inactiveSelectionBackground": "#3B4252",
    },
  },
  "nord-polar-night": {
    base: "vs-dark" as const,
    inherit: true,
    rules: [
      { token: "", foreground: "D8DEE9", background: "2E3440" },
      { token: "comment", foreground: "616E88", fontStyle: "italic" },
      { token: "keyword", foreground: "81A1C1" },
      { token: "string", foreground: "A3BE8C" },
      { token: "number", foreground: "B48EAD" },
      { token: "regexp", foreground: "B48EAD" },
      { token: "type", foreground: "8FBCBB" },
      { token: "class", foreground: "8FBCBB" },
      { token: "function", foreground: "88C0D0" },
      { token: "variable", foreground: "D8DEE9" },
      { token: "constant", foreground: "D8DEE9" },
      { token: "parameter", foreground: "D8DEE9" },
      { token: "punctuation", foreground: "ECEFF4" },
      { token: "operator", foreground: "81A1C1" },
    ],
    colors: {
      "editor.background": "#2E3440",
      "editor.foreground": "#D8DEE9",
      "editor.lineHighlightBackground": "#3B4252",
      "editor.selectionBackground": "#434C5E",
      "editorCursor.foreground": "#88C0D0",
      "editorLineNumber.foreground": "#4C566A",
      "editorLineNumber.activeForeground": "#E5E9F0",
      "editor.inactiveSelectionBackground": "#3B4252",
    },
  },
  "nord-snow-storm": {
    base: "vs" as const,
    inherit: true,
    rules: [
      { token: "", foreground: "2E3440", background: "ECEFF4" },
      { token: "comment", foreground: "8FBCBB", fontStyle: "italic" },
      { token: "keyword", foreground: "5E81AC" },
      { token: "string", foreground: "A3BE8C" },
      { token: "number", foreground: "B48EAD" },
      { token: "regexp", foreground: "B48EAD" },
      { token: "type", foreground: "8FBCBB" },
      { token: "class", foreground: "8FBCBB" },
      { token: "function", foreground: "5E81AC" },
      { token: "variable", foreground: "2E3440" },
      { token: "constant", foreground: "BF616A" },
      { token: "parameter", foreground: "2E3440" },
      { token: "punctuation", foreground: "4C566A" },
      { token: "operator", foreground: "5E81AC" },
    ],
    colors: {
      "editor.background": "#ECEFF4",
      "editor.foreground": "#2E3440",
      "editor.lineHighlightBackground": "#E5E9F0",
      "editor.selectionBackground": "#D8DEE9",
      "editorCursor.foreground": "#2E3440",
      "editorLineNumber.foreground": "#4C566A",
      "editorLineNumber.activeForeground": "#2E3440",
      "editor.inactiveSelectionBackground": "#E5E9F0",
    },
  },
  "vs-dark": {
    base: "vs-dark" as const,
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1E1E1E",
      "editor.foreground": "#D4D4D4",
      "editor.lineHighlightBackground": "#2D2D2D",
      "editor.selectionBackground": "#264F78",
      "editorCursor.foreground": "#FFFFFF",
      "editorLineNumber.foreground": "#858585",
      "editorLineNumber.activeForeground": "#C6C6C6",
    },
  },
};

export default function Editor({ value, language, onChange, settings, onScroll }: EditorProps) {
  const editorRef = useRef<unknown>(null);
  const monacoRef = useRef<unknown>(null);

  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current as {
        editor: {
          defineTheme: (name: string, theme: MonacoTheme) => void;
          setTheme: (name: string) => void;
        };
      };
      Object.entries(THEMES).forEach(([name, theme]) => {
        monaco.editor.defineTheme(name, theme);
      });
      monaco.editor.setTheme(settings.theme);
    }
  }, [settings.theme]);

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

  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add scroll listener
    if (editor && typeof editor === "object" && "onDidScrollChange" in editor) {
      (editor as { onDidScrollChange: (cb: (e: unknown) => void) => void }).onDidScrollChange(handleScroll);
    }

    if (monaco && typeof monaco === "object" && "editor" in monaco) {
      const monacoEditor = monaco as {
        editor: {
          defineTheme: (name: string, theme: MonacoTheme) => void;
          setTheme: (name: string) => void;
        };
      };
      Object.entries(THEMES).forEach(([name, theme]) => {
        monacoEditor.editor.defineTheme(name, theme);
      });
      monacoEditor.editor.setTheme(settings.theme);
    }
  };

  return (
    <div className={styles.container}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={settings.theme}
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
        }}
      />
    </div>
  );
}
