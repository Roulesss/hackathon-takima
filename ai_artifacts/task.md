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
- [ ] contrastChecker.ts (chroma-js)
- [ ] qrScanner.ts (jsqr wrapper)
- [ ] pdfUtils.ts (pdf-lib)

## 5. Hooks
- [ ] useQrConfig.ts
- [ ] useProjects.ts
- [ ] useExport.ts

## 6. Pages
- [ ] HomePage.tsx
- [ ] ActivityChoicePage.tsx
- [ ] EditorPage.tsx (QR config + preview)
- [ ] ScannerPage.tsx
- [ ] ExportPage.tsx

## 7. Electron IPC
- [ ] fileHandlers.ts
- [ ] exportHandlers.ts
- [ ] Preload script API

## 8. App Assembly
- [ ] App.tsx (routing + state)
- [ ] Wire all pages together
- [ ] Test full flow

## 9. Verification
- [ ] Build passes
- [ ] Dev mode runs
- [ ] QR generation works
- [ ] Export works
