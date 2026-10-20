# 📑 PDF_Go

A lightweight, 100% client-side PDF utility for Google Chrome. Run everything locally with **zero server uploads**, zero tracking, and complete privacy.

Use it as a **Chrome Extension** (pinned to your toolbar for 1-click access) or as an **offline local bookmark**.

---

## ✨ Features

- **📑 Merge Multiple PDFs**:
  - Drag-and-drop or file picker for multiple PDFs.
  - Interactive file queue with visual reordering (Move Up / Move Down) and removal.
  - Custom output filename.
  - Client-side merge engine powered by `pdf-lib` directly inside Chrome memory.
  - Automatic download and detailed page/size breakdown.

- **🗜️ Intelligent PDF Compression**:
  - **Strict Size Guard**: Never bloats your files — if compression cannot beat the original size, PDF_Go keeps the smaller file and alerts you.
  - **Document Type Detection**: Distinguishes between vector/text documents and scanned image documents.
  - **Smart Auto-Optimize (Default)**: Automatically selects the best method to maximize size reduction without degrading quality.
  - **Lossless Vector Optimization**: Compresses PDF 1.5 object streams and eliminates dead metadata while preserving 100% sharp vector text.
  - **Scanned Document Presets**: Compact (~72–96 DPI), Balanced (~100–120 DPI), and Grayscale B&W for heavy paper scans and receipts.

- **🔒 100% Local & Private**:
  - All processing happens in your browser's isolated memory sandbox.
  - No network requests, no telemetry, no third-party APIs.
  - Works completely offline (airplanes, secure enterprise environments).

---

## 🚀 How to Install & Use

### Method 1: Chrome Extension (Recommended ⭐)

Turn PDF_Go into a permanent Chrome toolbar app:

1. In Google Chrome, go to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** toggle (top-right corner).
3. Click **Load unpacked** (top-left) and select this `PDF_Go` folder.
4. Click the **Extensions puzzle icon** in Chrome's toolbar and **pin PDF_Go**.
5. Click the PDF_Go icon anytime to open it in a clean browser tab!

---

### Method 2: Offline File Bookmark

You can also run PDF_Go directly from disk without installing an extension:

1. Open Chrome and press `Cmd + O` (or drag `index.html` into Chrome).
2. Press **`Cmd + D`** to bookmark the tab in Chrome's Bookmark Bar for 1-click access anytime!

---

### Method 3: Local HTTP Server (Optional)

If you prefer running a local server:

```bash
npm start
```

Runs a zero-dependency server at `http://localhost:3000`.

---

## 📦 Creating a Downloadable Release Package

To generate a distributable `.zip` file for yourself or other users:

```bash
npm run package
```

This creates `dist/PDF_Go.zip` containing all self-contained assets. Users can extract the zip and load it directly into `chrome://extensions` via "Load unpacked".

---

## 📁 Project Structure

```
PDF_Go/
├── manifest.json           # Chrome Extension Manifest V3 configuration
├── index.html              # Main UI interface
├── css/
│   └── styles.css          # Design system & Light/Dark themes
├── js/
│   ├── app.js              # Application lifecycle and tab router
│   ├── merge.js            # PDF merging controller (pdf-lib)
│   ├── compress.js         # Intelligent compression engine
│   ├── utils.js            # Formatters, file inspectors, and toasts
│   └── extension-background.js # Chrome extension service worker
├── icons/                  # High-res extension icons (16px, 48px, 128px)
├── vendor/                 # Self-contained local vendor bundles (pdf-lib, pdfjs)
├── scripts/
│   ├── build-vendor.js     # Bundles PDF engines into unified standalone scripts
│   ├── generate-icons.js   # Generates crisp PNG extension icons
│   └── package.js          # Packages distribution ZIP for releases
├── server.js               # Zero-dependency local server script
├── LICENSE                 # MIT License
└── package.json            # Scripts & metadata
```

---

## 🔒 Security Guarantee

Traditional online PDF tools upload sensitive documents (tax filings, bank statements, legal agreements) to external servers.

**PDF_Go processes everything locally in your browser sandbox.** Zero bytes are ever sent over the internet.
