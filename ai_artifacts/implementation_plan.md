# QR Code Desktop Application — Plan d'implémentation

Application desktop React/Electron/TypeScript pour la création, personnalisation et exportation de QR Codes, cartes de visite et intégration dans des documents.

## User Review Required

> [!IMPORTANT]
> **Stack technologique retenu :**
> - **Scaffolding** : `electron-vite` via `@quick-start/electron` (Vite HMR, React 18+, TypeScript, IPC ready)
> - **QR Code** : `qr-code-styling` (renderer process) + `chroma-js` (contraste)
> - **Images** : `jimp` (manipulation pure JS)
> - **PDF** : `pdf-lib` (création/modification)
> - **Scanner** : `jsqr` (décodage pixels)
> - **Icons** : `lucide-react` (l'équivalent React de Lucide, probablement ce qui est voulu par "lucidchart icon")
> - **Panels resizable** : `react-resizable-panels`

> [!WARNING]
> **Scope de cette implémentation initiale :** Ce plan crée une **base fonctionnelle et modulable** comme demandé. Certaines features avancées (batch export, intégration document PDF/image, carte de visite complète avec texte éditable) seront structurées mais auront des placeholders pour que l'équipe puisse les étendre. La fonctionnalité QR Code (création, personnalisation, preview, export PNG/SVG/PDF, scan) sera **entièrement fonctionnelle**.

## Open Questions

> [!IMPORTANT]
> 1. **Nom de l'application** — Le prompt mentionne "le titre de l'application" mais ne donne pas de nom. Je propose **"QR Forge"** — à confirmer ou modifier.
> 2. **Lucide vs Lucidchart** — Le prompt dit "lucidchart icon" mais Lucidchart est un outil de diagrammes, pas une bibliothèque d'icônes. Je pars sur **Lucide React** (icônes open source très populaires). OK ?
> 3. **Electron ou Web d'abord ?** — Le prompt mentionne Electron mais pour un hackathon, voulez-vous que je fasse d'abord tourner le tout en **mode web** (plus rapide à itérer) avec la structure Electron prête, ou directement en Electron pur ?

---

## Architecture du projet

```
hackathon-takima/
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # Main entry, window creation
│   │   └── ipc/                       # IPC handlers
│   │       ├── fileHandlers.ts        # Save/load configs, file dialogs
│   │       └── exportHandlers.ts      # Export QR/PDF/PNG/SVG
│   ├── preload/                       # Preload scripts
│   │   └── index.ts                   # Expose IPC API to renderer
│   └── renderer/                      # React app (renderer process)
│       ├── index.html
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Root component + routing
│       ├── styles/
│       │   ├── variables.css          # Design tokens (couleurs, typo, spacing)
│       │   ├── global.css             # Reset + styles globaux
│       │   └── components/            # Styles par composant (CSS modules)
│       ├── pages/
│       │   ├── HomePage.tsx           # Landing page
│       │   ├── ActivityChoicePage.tsx  # Choix du type d'activité
│       │   ├── EditorPage.tsx         # Configuration/personnalisation (QR, carte, doc)
│       │   ├── ScannerPage.tsx        # Scanner QR code
│       │   └── ExportPage.tsx         # Page d'exportation
│       ├── components/
│       │   ├── layout/
│       │   │   ├── SplitLayout.tsx    # Layout resizable preview/config
│       │   │   └── Toolbar.tsx        # Barre d'outils supérieure
│       │   ├── common/
│       │   │   ├── Button.tsx         # Bouton réutilisable
│       │   │   ├── IconButton.tsx     # Bouton icône
│       │   │   ├── Card.tsx           # Card réutilisable
│       │   │   ├── Modal.tsx          # Popup/dialog
│       │   │   └── Tabs.tsx           # Composant onglets
│       │   ├── qr/
│       │   │   ├── QrPreview.tsx      # Preview du QR code (utilise qr-code-styling)
│       │   │   ├── QrConfigPanel.tsx  # Panneau de configuration QR
│       │   │   └── QrStyleOptions.tsx # Options de style (couleur, forme, taille)
│       │   ├── businessCard/
│       │   │   ├── CardPreview.tsx    # Preview carte de visite
│       │   │   └── CardConfigPanel.tsx # Config carte de visite
│       │   ├── document/
│       │   │   ├── DocPreview.tsx     # Preview document avec QR
│       │   │   └── DocConfigPanel.tsx # Config intégration document
│       │   ├── scanner/
│       │   │   ├── ScanPreview.tsx    # Preview du site scanné
│       │   │   └── ScanResult.tsx     # Affichage lien + copie
│       │   └── export/
│       │       ├── ExportCard.tsx     # Card par type de fichier
│       │       └── BatchOptions.tsx   # Options d'export batch
│       ├── hooks/
│       │   ├── useQrConfig.ts         # State management config QR
│       │   ├── useProjects.ts         # Gestion des projets sauvegardés
│       │   └── useExport.ts           # Logique d'export
│       ├── types/
│       │   ├── qr.ts                  # Types QR config
│       │   ├── project.ts             # Types projet/sauvegarde
│       │   └── export.ts              # Types export
│       └── utils/
│           ├── qrGenerator.ts         # Wrapper qr-code-styling
│           ├── contrastChecker.ts     # Vérification contraste (chroma-js)
│           ├── qrScanner.ts           # Wrapper jsqr
│           └── pdfUtils.ts            # Utilitaires pdf-lib
```

---

## Proposed Changes

### 1. Scaffolding & Configuration

#### [NEW] Project scaffold via electron-vite

```bash
npm create @quick-start/electron@latest ./ -- --template react-ts
```

Puis installation des dépendances :

```bash
npm install qr-code-styling jimp pdf-lib chroma-js jsqr lucide-react react-resizable-panels
npm install -D @types/jsqr @types/chroma-js
```

---

### 2. Design System — Styles centraux

#### [NEW] [variables.css](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/styles/variables.css)

Fichier central de design tokens inspiré Notion :
- Palette de couleurs neutres avec un accent subtil
- Typographie : `Inter` (Google Fonts)
- Spacing scale harmonieux (4px base)
- Border radius, shadows, transitions
- Support dark mode via `prefers-color-scheme`

#### [NEW] [global.css](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/styles/global.css)

Reset CSS + styles de base appliqués globalement.

---

### 3. Composants communs (réutilisables)

#### [NEW] [Button.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/components/common/Button.tsx)

Bouton avec variantes : `primary`, `secondary`, `ghost`, `danger`. Support d'icône optionnel via Lucide.

#### [NEW] [IconButton.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/components/common/IconButton.tsx)

Bouton icône seul (settings, save, etc.).

#### [NEW] [Card.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/components/common/Card.tsx)

Card réutilisable avec hover effect subtil, pour la home page et les choix d'export.

#### [NEW] [Modal.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/components/common/Modal.tsx)

Popup modale pour les settings (overlay + contenu centré).

#### [NEW] [Tabs.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/components/common/Tabs.tsx)

Composant d'onglets pour la barre de switch QR/Carte/Document dans l'éditeur.

#### [NEW] [SplitLayout.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/components/layout/SplitLayout.tsx)

Wrapper autour de `react-resizable-panels` pour le layout preview/config resizable.

---

### 4. Pages

#### [NEW] [HomePage.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/pages/HomePage.tsx)

- Titre de l'application (centré, grande typo)
- Grille des projets sauvegardés (Card avec thumbnail de preview)
- Bouton "Créer nouveau" proéminent
- IconButton settings en bas à droite (position fixe)

#### [NEW] [ActivityChoicePage.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/pages/ActivityChoicePage.tsx)

- 4 grands boutons horizontaux avec icônes Lucide :
  - `QrCode` → Créer un QR Code
  - `CreditCard` → Carte de visite
  - `FileImage` → Intégrer à un document
  - `ScanLine` → Scanner un QR Code

#### [NEW] [EditorPage.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/pages/EditorPage.tsx)

- `SplitLayout` : preview à gauche, config à droite
- Barre supérieure avec `Tabs` (QR / Carte / Document) + IconButtons (settings, save)
- Preview : affichage temps réel du QR via `qr-code-styling`
- Config : options de taille, couleurs (foreground/background), forme des dots, forme des coins, marge
- Bouton "Raw Export" sous la preview
- Bouton "Export" en bas à gauche → navigation vers ExportPage
- Vérification contraste temps réel via `chroma-js`

#### [NEW] [ScannerPage.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/pages/ScannerPage.tsx)

- Même SplitLayout
- Zone d'import d'image (drag & drop ou file picker)
- Preview : iframe/aperçu du lien décodé
- Panneau droit : lien extrait + bouton copier

#### [NEW] [ExportPage.tsx](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/pages/ExportPage.tsx)

- Même SplitLayout (preview finale à gauche)
- 3 Cards pour les formats : PNG, PDF, SVG
- Section batch : naming pattern, export zip
- Bouton d'export final

---

### 5. Logique métier & utilitaires

#### [NEW] [qrGenerator.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/utils/qrGenerator.ts)

Wrapper autour de `qr-code-styling` :
- Création d'instance QR avec config
- Méthodes d'export (PNG blob, SVG string, canvas element)
- Application de styles (couleurs, dots shape, corners shape)

#### [NEW] [contrastChecker.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/utils/contrastChecker.ts)

Utilisation de `chroma.contrast()` pour vérifier que le QR reste lisible. Affichage d'un warning si le ratio est insuffisant.

#### [NEW] [qrScanner.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/utils/qrScanner.ts)

Wrapper autour de `jsqr` :
- Charge une image via `<canvas>`
- Extrait les données pixel (`getImageData`)
- Décode le QR et retourne le lien

#### [NEW] [pdfUtils.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/utils/pdfUtils.ts)

Utilitaires `pdf-lib` :
- Export QR en PDF
- Intégration QR dans un PDF existant (placeholder pour l'équipe)

---

### 6. State management & Hooks

#### [NEW] [useQrConfig.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/hooks/useQrConfig.ts)

Hook React gérant l'état de la configuration QR :
- URL, taille, couleurs, forme des dots/coins, marge
- La config est **partagée entre les onglets** (QR/Carte/Document) comme demandé
- Sérialisation/désérialisation JSON

#### [NEW] [useProjects.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/renderer/hooks/useProjects.ts)

Hook pour la gestion des projets sauvegardés :
- Liste des configs récentes (stockées dans un fichier JSON app-level)
- Save/Load via IPC (Electron file dialog)
- Thumbnail de preview (base64)

---

### 7. Electron IPC (Main process)

#### [NEW] [fileHandlers.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/main/ipc/fileHandlers.ts)

Handlers IPC pour :
- `dialog.showOpenDialog` / `dialog.showSaveDialog`
- Lecture/écriture de fichiers de config JSON
- Gestion du fichier de config app (chemins par défaut)

#### [NEW] [exportHandlers.ts](file:///Users/hexalo/Documents/applications/hackathon-takima/src/main/ipc/exportHandlers.ts)

Handlers IPC pour :
- Sauvegarde de fichiers exportés (PNG, SVG, PDF)
- Export batch (ZIP via `archiver` ou similaire — à ajouter ultérieurement)

---

### 8. Routing

Navigation entre pages via **React state** (pas de react-router, inutile dans Electron) :
- `home` → `activity-choice` → `editor` | `scanner`
- `editor` → `export`
- Retour possible à chaque étape

---

## Verification Plan

### Automated Tests
```bash
# Build vérifie la compilation TypeScript
npm run build

# Dev server pour test interactif
npm run dev
```

### Manual Verification
- L'application démarre en mode dev Electron
- Navigation entre toutes les pages fonctionne
- Création d'un QR code avec preview temps réel
- Personnalisation (couleurs, formes) se reflète dans la preview
- Vérification de contraste affiche un warning si nécessaire
- Export PNG/SVG/PDF génère un fichier valide
- Scanner décode un QR code à partir d'une image importée
- Save/Load d'une configuration JSON fonctionne
- Les panneaux sont redimensionnables
