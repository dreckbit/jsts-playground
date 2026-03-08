import { useMemo, useRef, useEffect, useState } from "react";
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
      lines[entry.line - 1] = prefix + String(entry.content);
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
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate content for the console editor
  const consoleContent = useMemo(() => {
    return generateConsoleContent(entries, lineCount);
  }, [entries, lineCount]);

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

  const handleEditorMount = (editor: unknown) => {
    editorRef.current = editor;
  };

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
