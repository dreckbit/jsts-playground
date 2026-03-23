import { useEffect, useRef, useCallback } from "react";
import {
  useAppStore,
  type AppState,
  type Language,
  type Settings,
} from "../stores/appStore";

const STORAGE_KEY = "js-ts-playground-state";

interface SavedState {
  code: string;
  language: Language;
  settings: Settings;
}

type PersistedSnapshot = Pick<AppState, "code" | "language" | "settings">;

const DEFAULT_SETTINGS: Settings = {
  debounceDelay: 1000,
  executionTimeout: 10000,
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
  const previousThemeRef = useRef(settings.theme);
  const previousEditorRatioRef = useRef(settings.editorRatio);
  const latestSnapshotRef = useRef<PersistedSnapshot>({ code, language, settings });

  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        setCode(parsed.code);
        setLanguage(parsed.language);
        
        const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed.settings };

        // Keep user-selected theme if valid; default to nord otherwise
        const validThemes = ["nord", "nord-snow-storm", "vs-dark"] as const;
        if (!validThemes.includes(mergedSettings.theme)) {
          mergedSettings.theme = "nord";
        }

        updateSettings(mergedSettings);
      }
    } catch (error) {
      console.error("Failed to load saved state:", error);
    }
  }, [setCode, setLanguage, updateSettings]);

  const saveState = useCallback((snapshot: PersistedSnapshot = latestSnapshotRef.current) => {
    try {
      const state: SavedState = {
        code: snapshot.code,
        language: snapshot.language,
        settings: snapshot.settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }, []);

  useEffect(() => {
    loadState();
    isInitialLoad.current = false;
  }, []);

  useEffect(() => {
    latestSnapshotRef.current = { code, language, settings };
  }, [code, language, settings]);

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

  // IMMEDIATE save when theme changes - no debounce
  useEffect(() => {
    // Skip initial mount - loadState handles initial load
    if (isInitialLoad.current) {
      previousThemeRef.current = settings.theme;
      return;
    }

    // Only save if theme actually changed
    if (settings.theme !== previousThemeRef.current) {
      // Save IMMEDIATELY for theme changes - pass current state explicitly
      const currentState: SavedState = {
        code,
        language,
        settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
      previousThemeRef.current = settings.theme;
    }
  }, [settings.theme, code, language, settings]);

  // IMMEDIATE save when editorRatio changes - no debounce
  useEffect(() => {
    if (isInitialLoad.current) {
      previousEditorRatioRef.current = settings.editorRatio;
      return;
    }

    if (settings.editorRatio !== previousEditorRatioRef.current) {
      const currentState: SavedState = {
        code,
        language,
        settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
      previousEditorRatioRef.current = settings.editorRatio;
    }
  }, [settings.editorRatio, code, language, settings]);

  useEffect(() => {
    const forceSave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      saveState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        forceSave();
      }
    };

    window.addEventListener("beforeunload", forceSave);
    window.addEventListener("pagehide", forceSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", forceSave);
      window.removeEventListener("pagehide", forceSave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveState]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { clearSavedData };
}
