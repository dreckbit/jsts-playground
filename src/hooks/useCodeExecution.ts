import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../stores/appStore";

export function useCodeExecution() {
  const { code, language, settings, runCode } = useAppStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningRef = useRef(false);

  const debouncedRun = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Always run in real-time (no autoRun toggle)
    timeoutRef.current = setTimeout(() => {
      if (!isRunningRef.current) {
        runCode();
      }
    }, settings.debounceDelay);
  }, [settings.debounceDelay, runCode]);

  useEffect(() => {
    debouncedRun();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [code, language, debouncedRun]);

  useEffect(() => {
    isRunningRef.current = useAppStore.getState().isExecuting;
  });

  return { runCode };
}
