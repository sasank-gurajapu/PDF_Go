/**
 * PDF_Go - Compress Module
 * Client-side PDF compression with multi-level optimization presets.
 */

class CompressController {
  constructor() {
    this.currentFile = null;
    this.fileDetails = null;
    this.isProcessing = false;

    this.dropzone = document.getElementById('compress-dropzone');
    this.fileInput = document.getElementById('compress-file-input');
    this.filePreview = document.getElementById('compress-file-preview');
    this.compressBtn = document.getElementById('compress-submit-btn');
    this.clearBtn = document.getElementById('compress-clear-btn');
    this.presetSelect = document.getElementById('compress-preset');
    this.progressContainer = document.getElementById('compress-progress-container');
    this.progressBar = document.getElementById('compress-progress-bar');
    this.progressText = document.getElementById('compress-progress-text');
    this.resultContainer = document.getElementById('compress-result-container');
    this.resultStats = document.getElementById('compress-result-stats');
    this.downloadResultBtn = document.getElementById('compress-download-result-btn');

    this.lastResultBlob = null;
    this.lastResultFilename = '';

    this.initEvents();
  }

  initEvents() {
    ['dragenter', 'dragover'].forEach(evt => {
      this.dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      this.dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('drag-active');
      });
    });

    this.dropzone.addEventListener('drop', (e) => {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
      if (droppedFiles.length === 0) {
        Utils.showToast('Please drop a valid PDF file', 'error');
        return;
      }
      this.setFile(droppedFiles[0]);
    });

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.setFile(e.target.files[0]);
      }
      this.fileInput.value = '';
    });

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.clearFile();
      });
    }

    this.compressBtn.addEventListener('click', () => this.executeCompression());

    if (this.downloadResultBtn) {
      this.downloadResultBtn.addEventListener('click', () => {
        if (this.lastResultBlob) {
          Utils.downloadBlob(this.lastResultBlob, this.lastResultFilename);
        }
      });
    }
  }

  async setFile(file) {
    this.currentFile = file;
    this.compressBtn.disabled = true;
    this.resetResult();

    const details = await Utils.getPdfDetails(file);
    this.fileDetails = details;

    this.renderFilePreview();
    this.compressBtn.disabled = false;
  }

  clearFile() {
    this.currentFile = null;
    this.fileDetails = null;
    this.filePreview.innerHTML = '';
    this.dropzone.classList.remove('has-files');
    this.compressBtn.disabled = true;
    this.resetResult();
  }

  renderFilePreview() {
    if (!this.currentFile) return;

    this.dropzone.classList.add('has-files');
    this.filePreview.innerHTML = `
      <div class="file-item">
        <div class="file-item-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div class="file-item-info">
          <div class="file-item-name">${this.currentFile.name}</div>
          <div class="file-item-meta">
            Original Size: <strong>${Utils.formatBytes(this.currentFile.size)}</strong>
            ${this.fileDetails?.pageCount ? ` • ${this.fileDetails.pageCount} pages` : ''}
          </div>
        </div>
        <div class="file-item-actions">
          <button type="button" class="btn-icon btn-danger" title="Remove" onclick="compressController.clearFile()">
            ✕
          </button>
        </div>
      </div>
    `;
  }

  resetResult() {
    this.progressContainer.style.display = 'none';
    this.resultContainer.style.display = 'none';
    this.lastResultBlob = null;
  }

  async executeCompression() {
    if (!this.currentFile || this.isProcessing) return;

    this.isProcessing = true;
    this.compressBtn.disabled = true;
    this.progressContainer.style.display = 'block';
    this.resultContainer.style.display = 'none';
    this.progressBar.style.width = '5%';
    this.progressText.textContent = 'Preparing PDF optimization...';

    const preset = this.presetSelect.value;
    const startTime = performance.now();

    try {
      let compressedBytes;
      if (preset === 'lossless') {
        compressedBytes = await this.compressLossless();
      } else {
        compressedBytes = await this.compressVisualRaster(preset);
      }

      const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      const origSize = this.currentFile.size;
      const newSize = compressedBlob.size;
      const reductionPercent = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));

      this.progressBar.style.width = '100%';
      this.progressText.textContent = 'Optimization finished!';

      const baseName = this.currentFile.name.replace(/\.pdf$/i, '');
      const outputFilename = `${baseName}_compressed.pdf`;

      this.lastResultBlob = compressedBlob;
      this.lastResultFilename = outputFilename;

      // Automatically trigger download
      Utils.downloadBlob(compressedBlob, outputFilename);

      const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);

      this.resultContainer.style.display = 'block';
      this.resultStats.innerHTML = `
        <div class="stat-badge ${reductionPercent > 0 ? 'badge-success' : 'badge-neutral'}">
          ${reductionPercent > 0 ? `Reduced by <strong>-${reductionPercent}%</strong>` : `Optimized`}
        </div>
        <div class="stat-badge">Original: <strong>${Utils.formatBytes(origSize)}</strong></div>
        <div class="stat-badge">Compressed: <strong>${Utils.formatBytes(newSize)}</strong></div>
        <div class="stat-badge">Time: <strong>${durationSec}s</strong></div>
      `;

      if (reductionPercent > 0) {
        Utils.showToast(`Compressed! Saved ${Utils.formatBytes(origSize - newSize)} (${reductionPercent}% reduction)`, 'success');
      } else {
        Utils.showToast(`PDF streams compacted with object streams.`, 'info');
      }
    } catch (err) {
      console.error('Compression error:', err);
      Utils.showToast(`Compression error: ${err.message}`, 'error');
      this.progressText.textContent = `Error: ${err.message}`;
    } finally {
      this.isProcessing = false;
      this.compressBtn.disabled = !this.currentFile;
    }
  }

  /**
   * Lossless compression: keeps text & vectors 100% sharp, strips metadata & enables object streams
   */
  async compressLossless() {
    this.progressBar.style.width = '30%';
    this.progressText.textContent = 'Reading PDF structures...';

    const arrayBuffer = await Utils.readFileAsArrayBuffer(this.currentFile);
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    this.progressBar.style.width = '70%';
    this.progressText.textContent = 'Compacting streams and applying Flate compression...';

    // Strip document title/author metadata to shave bloat
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('PDF_Go Local');
    pdfDoc.setCreator('PDF_Go Local');

    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    return compressedBytes;
  }

  /**
   * Visual scan/image compression: renders pages to canvas and recompresses high-res scans & images
   */
  async compressVisualRaster(preset) {
    const settings = {
      extreme: { scale: 1.0, quality: 0.50 },    // ~72-96 DPI
      recommended: { scale: 1.4, quality: 0.70 },// ~120-140 DPI
      crisp: { scale: 1.8, quality: 0.85 }       // ~160-200 DPI
    }[preset] || { scale: 1.4, quality: 0.70 };

    this.progressBar.style.width = '10%';
    this.progressText.textContent = 'Reading PDF pages...';

    const arrayBuffer = await Utils.readFileAsArrayBuffer(this.currentFile);

    // Load with PDF.js
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdfJsDoc = await loadingTask.promise;
    const numPages = pdfJsDoc.numPages;

    // Create new PDF with pdf-lib
    const newPdfDoc = await PDFLib.PDFDocument.create();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const percent = Math.round(10 + ((pageNum / numPages) * 75));
      this.progressBar.style.width = `${percent}%`;
      this.progressText.textContent = `Optimizing page ${pageNum} of ${numPages} (${percent}%)...`;

      const page = await pdfJsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: settings.scale });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      // Convert canvas to JPEG data URL
      const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.quality);

      // Convert data URL to byte array
      const base64Data = jpegDataUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const jpegBytes = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        jpegBytes[j] = binaryString.charCodeAt(j);
      }

      // Embed into new document
      const embeddedJpg = await newPdfDoc.embedJpg(jpegBytes);
      
      // Keep original page aspect ratio dimensions
      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = newPdfDoc.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height
      });
    }

    this.progressBar.style.width = '90%';
    this.progressText.textContent = 'Finalizing compressed document...';

    const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
    return compressedBytes;
  }
}

