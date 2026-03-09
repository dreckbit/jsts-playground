import { useState } from "react";
import { useAppStore, type EditorTheme, type LayoutOrientation } from "../stores/appStore";
import styles from "../styles/Settings.module.css";

export default function Settings() {
  const { settings, updateSettings, showSettings } = useAppStore();
  const [customFont, setCustomFont] = useState("");

  if (!showSettings) return null;

  const themes: { id: EditorTheme; name: string; colors: string[] }[] = [
    { id: "nord", name: "Nord", colors: ["#292E39", "#3B4252", "#88C0D0"] },
    { id: "nord-snow-storm", name: "Snow Storm", colors: ["#ECEFF4", "#E5E9F0", "#D8DEE9"] },
    { id: "vs-dark", name: "VS Dark", colors: ["#1E1E1E", "#252526", "#569CD6"] },
  ];

  const presetFonts = [
    "JetBrains Mono",
    "Fira Code",
    "Consolas",
    "Source Code Pro",
    "Monaco",
    "Courier New",
    "Cascadia Code",
    "Ubuntu Mono",
  ];

  const orientations: { id: LayoutOrientation; name: string }[] = [
    { id: "horizontal", name: "Side by Side" },
    { id: "vertical", name: "Stacked" },
  ];

  const handleCustomFont = () => {
    if (customFont.trim()) {
      updateSettings({ fontFamily: customFont.trim() });
    }
  };

  return (
    <div className={styles.settingsPanel}>
      <h3>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
        Settings
      </h3>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Theme</div>
        <div className={styles.themePreview}>
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`${styles.themeOption} ${settings.theme === theme.id ? styles.active : ""}`}
              onClick={() => updateSettings({ theme: theme.id })}
            >
              <div
                className={styles.themeSwatch}
                style={{
                  background: `linear-gradient(135deg, ${theme.colors[0]} 50%, ${theme.colors[1]} 50%)`,
                }}
              />
              <div className={styles.themeName}>{theme.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Layout</div>
        <div className={styles.buttonGroup}>
          {orientations.map((orientation) => (
            <button
              key={orientation.id}
              className={`${styles.toggleButton} ${settings.layoutOrientation === orientation.id ? styles.active : ""}`}
              onClick={() => updateSettings({ layoutOrientation: orientation.id })}
            >
              {orientation.name}
            </button>
          ))}
        </div>
        <p className={styles.hint}>Drag the divider to resize</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Editor Font</div>
        <div className={styles.field}>
          <label className={styles.label}>Font Family</label>
          <select
            className={styles.select}
            value={presetFonts.includes(settings.fontFamily) ? settings.fontFamily : ""}
            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
          >
            <option value="" disabled>Select a font</option>
            {presetFonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Or enter custom font name</label>
          <div className={styles.customFontContainer}>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g., Cascadia Mono"
              value={customFont}
              onChange={(e) => setCustomFont(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomFont()}
            />
            <button className={styles.applyButton} onClick={handleCustomFont}>
              Apply
            </button>
          </div>
          <p className={styles.hint}>Use any font installed on your system</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Font Size: {settings.fontSize}px</label>
          <div className={styles.rangeContainer}>
            <input
              type="range"
              className={styles.range}
              min="10"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            />
            <span className={styles.rangeValue}>{settings.fontSize}px</span>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Tab Size</label>
          <select
            className={styles.select}
            value={settings.tabSize}
            onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Execution</div>
        <div className={styles.field}>
          <label className={styles.label}>Debounce Delay: {settings.debounceDelay}ms</label>
          <div className={styles.rangeContainer}>
            <input
              type="range"
              className={styles.range}
              min="100"
              max="3000"
              step="100"
              value={settings.debounceDelay}
              onChange={(e) => updateSettings({ debounceDelay: Number(e.target.value) })}
            />
            <span className={styles.rangeValue}>{settings.debounceDelay}ms</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Display</div>
        <div className={styles.field}>
          <label className={styles.toggleLabel}>
            <span>Show Line Numbers</span>
            <button
              className={`${styles.toggleSwitch} ${settings.showLineNumbers ? styles.toggleOn : ""}`}
              onClick={() => updateSettings({ showLineNumbers: !settings.showLineNumbers })}
              role="switch"
              aria-checked={settings.showLineNumbers}
            >
              <span className={styles.toggleThumb} />
            </button>
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.toggleLabel}>
            <span>Link Console to Editor</span>
            <button
              className={`${styles.toggleSwitch} ${settings.consoleLinked ? styles.toggleOn : ""}`}
              onClick={() => updateSettings({ consoleLinked: !settings.consoleLinked })}
              role="switch"
              aria-checked={settings.consoleLinked}
            >
              <span className={styles.toggleThumb} />
            </button>
          </label>
          <p className={styles.hint}>Console follows editor scroll</p>
        </div>
      </div>
    </div>
  );
}
