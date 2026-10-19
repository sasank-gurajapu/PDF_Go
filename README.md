# 📑 PDF_Go

A lightweight, 100% client-side, in-browser PDF utility designed for Chrome. Run everything locally on your machine with **zero server uploads**, zero tracking, and complete privacy.

Designed to be kept as a permanent bookmark on Google Chrome.

---

## ✨ Features

- **Merge PDFs**:
  - Drag-and-drop or select multiple PDFs.
  - Interactive file queue with visual reordering (move up/down) and quick removal.
  - Custom output filename.
  - High-performance merge powered by `pdf-lib` directly inside the browser.
  - Automatic download and detailed compression/page statistics.

- **Compress PDFs**:
  - **Balanced (~120-140 DPI, 70% Quality)**: Recommended for documents, forms, scanned receipts, presentations.
  - **Maximum Compression (~72-96 DPI, 50% Quality)**: Smallest file size for strict upload limits (e.g. government/tax portals, < 2MB requirements).
  - **High Quality (~160-200 DPI, 85% Quality)**: Clear, crisp visuals with moderate size savings.
  - **Lossless Optimization**: Strips redundant metadata and applies PDF 1.5 Flate object streams while preserving 100% of original vector shapes and searchable text.

- **100% Local & Private**:
  - Files are processed entirely in browser memory.
  - No internet connection required.
  - Zero telemetry, zero cloud uploads.

- **Desktop-Grade UI**:
  - Light & Dark mode support (persists your preference).
  - Responsive layout with drag-and-drop support.
  - Live progress indicators and toast notifications.

---

## 🚀 How to Use & Bookmark in Chrome

### Option 1: Direct File Access (No Terminal Needed)
You can open `index.html` directly in Google Chrome:
```text
file:///Users/sasankgurajapu/Documents/PDF_Go/index.html
```
1. Open Google Chrome.
2. Press `Cmd + O` and select `index.html` from this folder (or drag `index.html` into Chrome).
3. Press **`Cmd + D`** to bookmark the page in Chrome's Bookmark Bar for 1-click access anytime!

### Option 2: Local HTTP Server (Optional)
If you prefer running a local localhost server:
```bash
npm start
```
This runs a zero-dependency local static server on `http://localhost:3000`. You can bookmark `http://localhost:3000` in Chrome.

---

## 📁 Project Structure

```
PDF_Go/
├── .gitignore              # Ignores node_modules, logs, and OS artifacts
├── README.md               # Documentation and setup instructions
├── package.json            # Scripts & dependencies
├── server.js               # Zero-dependency local server (node server.js)
├── index.html              # Main application UI
├── css/
│   └── styles.css          # Responsive design & Light/Dark themes
├── js/
│   ├── app.js              # Tab switcher, theme manager, UI routing
│   ├── merge.js            # PDF merging engine (pdf-lib)
│   ├── compress.js         # Multi-preset PDF compression engine
│   └── utils.js            # Byte formatters, file readers, toasts
└── vendor/
    ├── pdf-lib.min.js      # Bundled client-side PDF manipulation engine
    ├── pdf.min.js          # Bundled PDF.js engine for page rendering
    └── pdf.worker.min.js   # PDF.js worker module
```

---

## 🐙 Pushing to Git

This folder is already initialized as a standalone Git repository on the `main` branch.

To push this project to GitHub:

1. Create a new empty repository on [GitHub](https://github.com/new) (e.g. `PDF_Go`).
2. Run the following commands in this directory:
   ```bash
   git add .
   git commit -m "Initial commit: PDF_Go local PDF merge and compress tool"
   git remote add origin https://github.com/<your-username>/PDF_Go.git
   git push -u origin main
   ```

---

## 🔒 Security & Privacy

Traditional online PDF tools upload your sensitive documents (tax returns, bank statements, personal contracts) to third-party servers. 

**PDF_Go processes everything locally in your Chrome browser sandbox.** No files ever leave your computer.
