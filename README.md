# Tabsy v1.0.0

Your tabs. Your worlds. Zero chaos.

Tabsy is a minimalist, lightning-fast Chrome extension for managing workspaces in your side panel. It is built entirely with React, TypeScript, Vite, and Tailwind CSS.

## Features
- **Workspaces in your side panel**: Save, restore, edit, and organize tab collections natively alongside your browsing.
- **Lightning fast**: In-memory search filtering and optimistic UI updates make organization instantaneous.
- **100% Local**: No backend, no accounts, no sync delays. Everything stays on your machine in `chrome.storage.local`.
- **Duplicate Protection**: Intelligently skips duplicate tabs when restoring workspaces.
- **Customizable**: Color and icon metadata to visually identify your workspaces at a glance.
- **Context Menus**: Right-click anywhere on a webpage to save it to an existing workspace or seed a new one.
- **Keyboard Shortcuts**: Use `Ctrl+Shift+T` to open Tabsy and `Ctrl+Shift+S` to instantly save your current tabs.
- **Light & Dark Mode**: Beautiful, high-contrast dark mode that respects your OS settings, or force your preference via Settings.
- **Import & Export**: Backup your entire configuration to a local JSON file, and restore it anytime.

## Installation & Development

### Requirements
- Node.js >= 18

### Local Setup
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server** (with HMR support for Manifest V3):
   ```bash
   npm run dev
   ```
   *Note: Because Chrome extensions restrict loading from `localhost` for security, Vite handles HMR through a specialized CRX plugin.*

3. **Build the extension**:
   ```bash
   npm run build
   ```

### Loading in Chrome for Testing
1. Build the project: `npm run build`.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the `dist/` directory generated in your project folder.

## Chrome Web Store Submission
To prepare Tabsy for submission to the Chrome Web Store:
1. Ensure the final branded icon artwork is placed in `public/icons/` (replacing the placeholder 1x1 transparent PNGs).
2. Run a clean build: `npm run build`.
3. Compress the contents of the `dist/` folder into a `.zip` archive (do not include the outer `dist/` folder itself, zip the contents directly).
4. Upload the `.zip` archive to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
5. Submit along with your promotional images and the privacy policy (`PRIVACY.md`).

## Extension Permissions Justification
Tabsy requests the strict minimum permissions to function, per Chrome Web Store guidelines:
- **`tabs`**: Needed to read open tabs to save them into workspaces, and to create tabs when restoring workspaces.
- **`storage`**: Needed to persist workspaces, metadata, and user settings across browser sessions.
- **`sidePanel`**: Needed to render the core UI natively beside your active tabs.
- **`contextMenus`**: Needed to support the "Save page to Tabsy" right-click quick actions.
- **`commands`**: (Configuration) Needed to enable keyboard shortcuts (`Ctrl+Shift+T`, `Ctrl+Shift+S`).

*Note: The `sessions` permission was evaluated but deemed unnecessary for the V1 feature set, adhering to the principle of least privilege.*

## Architecture Notes
- Framework: React 19 + TypeScript
- Styling: Tailwind CSS v4
- Bundler: Vite 8 + `@crxjs/vite-plugin`
- Data Model: Simple JSON objects stored in `chrome.storage.local`. Workspaces and Tabs use UUIDs to prevent collision during imports.
