# QR Forge — Implementation Tasks

## 1. Project Setup
- [ ] Scaffold project with electron-vite (react-ts template)
- [ ] Install all dependencies
- [ ] Configure project structure

## 2. Design System
- [ ] Create `variables.css` (design tokens)
- [ ] Create `global.css` (reset + base styles)

## 3. Common Components
- [ ] Button.tsx + styles
- [ ] IconButton.tsx + styles
- [ ] Card.tsx + styles
- [ ] Modal.tsx + styles
- [ ] Tabs.tsx + styles
- [ ] SplitLayout.tsx + styles
- [ ] Toolbar.tsx + styles

## 4. Types & Utilities
- [ ] Type definitions (qr.ts, project.ts, export.ts)
- [ ] qrGenerator.ts (qr-code-styling wrapper)
- [x] Type definitions (qr.ts, project.ts, export.ts)
- [x] qrGenerator.ts (qr-code-styling wrapper)
- [x] contrastChecker.ts (chroma-js)
- [x] qrScanner.ts (jsqr wrapper)
- [x] pdfUtils.ts (pdf-lib)

## 5. Hooks
- [x] useQrConfig.ts
- [x] **Wiring the settings:** The "Settings" button in `HomePage.tsx` and `EditorPage.tsx` is wired up.
- [x] **Persistence/Save:** The "Save" button in `EditorPage.tsx` saves JSON configuration via IPC.
- [x] **IPC Handlers:** Handlers are implemented and wired into the API.
- [x] **Project Loading:** The `HomePage` project loading supports opening from a JSON file.
- [x] **Testing the full flow:** Verify that all navigation, state persistence, and file exports work correctly.uns

## 6. Pages
- [x] HomePage.tsx
- [x] ActivityChoicePage.tsx
- [x] EditorPage.tsx (QR config + preview)
- [x] ScannerPage.tsx
- [x] ExportPage.tsx

## 7. Electron IPC
- [x] fileHandlers.ts
- [x] exportHandlers.ts
- [x] Preload script API

## 8. App Assembly
- [x] App.tsx (routing + state)
- [x] Wire all pages together
- [x] Test full flow

## 9. Verification
- [x] Build passes
- [x] Dev mode runs
- [x] QR generation works
- [x] Export works
