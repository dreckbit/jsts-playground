import { useEffect, useRef } from "react";
import type { ConsoleEntry } from "../stores/appStore";
import styles from "../styles/Console.module.css";

interface ConsoleProps {
  entries: ConsoleEntry[];
  onClear: () => void;
  executionTime?: number;
}

export default function Console({ entries, onClear }: ConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  const getEntryClassName = (type: ConsoleEntry["type"]) => {
    switch (type) {
      case "error":
        return styles.error;
      case "warn":
        return styles.warn;
      case "info":
        return styles.info;
      case "time":
        return styles.time;
      default:
        return styles.log;
    }
  };

  const formatContent = (content: unknown): string => {
    if (content === null) return "null";
    if (content === undefined) return "undefined";
    if (typeof content === "object") {
      try {
        return JSON.stringify(content, null, 2);
      } catch {
        return String(content);
      }
    }
    return String(content);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Console</span>
        <button className={styles.clearButton} onClick={onClear}>
          Clear
        </button>
      </div>
      <div className={styles.output} ref={containerRef}>
        {entries.length === 0 ? (
          <div className={styles.empty}>Run your code to see output here</div>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className={`${styles.entry} ${getEntryClassName(entry.type)}`}>
              <span className={styles.timestamp}>
                {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ""}
              </span>
              <pre className={styles.content}>{formatContent(entry.content)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
