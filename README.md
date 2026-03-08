# JS/TS Playground Desktop

A desktop application for running JavaScript and TypeScript code, similar to RunJS. Built with Tauri 2.x, React 19, and Monaco Editor.

## Features

- Monaco Editor with TypeScript/JavaScript support
- Real-time code execution with sandboxed environment
- TypeScript transpilation with type error detection
- Nord theme for a cold, comfortable color palette
- Console output with log, error, warn, and info levels
- Auto-save code to localStorage
- Execution timeout protection (5 seconds)

## Prerequisites

- Node.js 18+
- Rust 1.77+ (for Tauri)
- npm or pnpm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run tauri:dev
   ```

3. Build for production:
   ```bash
   npm run tauri:build
   ```

## Project Structure

```
js-ts-playground/
├── src/
│   ├── components/       # React components
│   │   ├── Editor.tsx    # Monaco Editor wrapper
│   │   ├── Console.tsx   # Console output display
│   │   └── Toolbar.tsx   # Run button and controls
│   ├── hooks/            # Custom React hooks
│   │   ├── useCodeExecution.ts
│   │   └── usePersistence.ts
│   ├── stores/           # Zustand state management
│   │   └── appStore.ts
│   ├── styles/           # CSS Modules
│   │   ├── nord.css
│   │   ├── App.module.css
│   │   ├── Editor.module.css
│   │   ├── Console.module.css
│   │   └── Toolbar.module.css
│   ├── utils/            # Utility functions
│   │   ├── transpiler.ts # TypeScript to JS
│   │   └── sandbox.ts    # Code execution sandbox
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/            # Tauri backend
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Usage

1. Select JavaScript or TypeScript from the dropdown
2. Write code in the editor
3. Press Run or Ctrl+Enter to execute
4. View output in the console panel
5. Toggle auto-run for real-time execution

## Keyboard Shortcuts

- `Ctrl+Enter` - Run code

## License

MIT
