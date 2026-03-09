import { useEffect, useRef, useCallback } from "react";
import { useAppStore, type Language, type Settings } from "../stores/appStore";

const STORAGE_KEY = "js-ts-playground-state";

interface SavedState {
  code: string;
  language: Language;
  settings: Settings;
}

const DEFAULT_SETTINGS: Settings = {
  debounceDelay: 1000,
  showTimestamps: true,
  theme: "nord",
  fontSize: 14,
  fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
  tabSize: 2,
  layoutOrientation: "horizontal",
  editorRatio: 50,
  showLineNumbers: true,
  consoleLinked: true,
};

export function usePersistence() {
  const { code, language, settings, setCode, setLanguage, updateSettings } = useAppStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        setCode(parsed.code);
        setLanguage(parsed.language);
        
        const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed.settings };

        // Keep user-selected theme if valid; default to nord otherwise
        const validThemes = ["nord", "nord-polar-night", "nord-snow-storm", "vs-dark"] as const;
        if (!validThemes.includes(mergedSettings.theme)) {
          mergedSettings.theme = "nord";
        }

        updateSettings(mergedSettings);
      }
    } catch (error) {
      console.error("Failed to load saved state:", error);
    }
  }, [setCode, setLanguage, updateSettings]);

  const saveState = useCallback(() => {
    try {
      const state: SavedState = {
        code,
        language,
        settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }, [code, language, settings]);

  useEffect(() => {
    loadState();
    isInitialLoad.current = false;
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveState();
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [code, language, settings, saveState]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { clearSavedData };
}
