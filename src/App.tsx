import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Editor from "./components/Editor";
import Console from "./components/Console";
import Toolbar from "./components/Toolbar";
import Settings from "./components/Settings";
import { useAppStore } from "./stores/appStore";
import { useCodeExecution } from "./hooks/useCodeExecution";
import { usePersistence } from "./hooks/usePersistence";
import styles from "./styles/App.module.css";

function App() {
  const { code, language, consoleOutput, setCode, clearConsole, settings, updateSettings } = useAppStore();

  useCodeExecution();
  usePersistence();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // Calculate line count from code
  const codeLineCount = useMemo(() => {
    return Math.max(code.split("\n").length, 10);
  }, [code]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      setCode(value || "");
    },
    [setCode]
  );

  const handleClear = useCallback(() => {
    clearConsole();
  }, [clearConsole]);

  // Editor scroll position for linking with console
  const [editorScrollTop, setEditorScrollTop] = useState(0);

  const handleEditorScroll = useCallback((scrollTop: number) => {
    setEditorScrollTop(scrollTop);
  }, []);

  // Resizable divider logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isVertical = settings.layoutOrientation === "vertical";

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      let newRatio: number;

      if (isVertical) {
        newRatio = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      }

      // Clamp between 20% and 80%
      newRatio = Math.max(20, Math.min(80, newRatio));
      updateSettings({ editorRatio: newRatio });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isVertical, updateSettings]);

  const editorStyle = {
    flex: isVertical ? "none" : `0 0 ${settings.editorRatio}%`,
    height: isVertical ? `${settings.editorRatio}%` : "auto",
    width: isVertical ? "100%" : "auto",
  } as const;

  const consoleStyle = {
    flex: isVertical ? "none" : `0 0 ${100 - settings.editorRatio}%`,
    height: isVertical ? `${100 - settings.editorRatio}%` : "auto",
    width: isVertical ? "100%" : "auto",
  } as const;

  return (
    <div className={styles.container}>
      <Toolbar />
      <Settings />
      <div
        ref={containerRef}
        className={styles.main}
        style={{
          flexDirection: isVertical ? "column" : "row",
          cursor: isDragging ? (isVertical ? "ns-resize" : "ew-resize") : "default",
        }}
      >
        <div className={styles.editorPanel} style={editorStyle}>
          <Editor
            value={code}
            language={language}
            onChange={handleCodeChange}
            onScroll={handleEditorScroll}
            settings={settings}
          />
        </div>
        
        <div
          className={`${styles.divider} ${isDragging ? styles.dividerActive : ""}`}
          onMouseDown={handleMouseDown}
          style={{
            cursor: isVertical ? "ns-resize" : "ew-resize",
          }}
        >
          <div className={styles.dividerHandle} />
        </div>
        
        <div className={styles.consolePanel} style={consoleStyle}>
          <Console 
            entries={consoleOutput} 
            onClear={handleClear} 
            lineCount={codeLineCount}
            settings={settings}
            editorScrollTop={editorScrollTop}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
