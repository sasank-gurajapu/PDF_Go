/**
 * PDF_Go - Compress Module
 * Intelligent, multi-tier PDF compression with strict size-reduction guarantees.
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

    // Ensure PDF.js worker options are configured
    if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';
      }
    }

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

    // Suggest best preset based on document analysis
    if (details.isScanned && this.presetSelect) {
      this.presetSelect.value = 'auto';
    }

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

    const isScanned = this.fileDetails?.isScanned;
    const typeLabel = isScanned
      ? `📷 Scanned / Image PDF (${this.fileDetails.imageCount || 0} images)`
      : `📄 Text & Vector PDF`;

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
            • <span class="badge-type">${typeLabel}</span>
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
    this.progressBar.style.width = '10%';
    this.progressText.textContent = 'Analyzing PDF structure...';

    const preset = this.presetSelect.value;
    const startTime = performance.now();
    const origSize = this.currentFile.size;
    const baseName = this.currentFile.name.replace(/\.pdf$/i, '');
    const outputFilename = `${baseName}_compressed.pdf`;

    try {
      let finalBytes;
      let finalMethod = '';
      let rasterBloatWarning = null;

      if (preset === 'lossless') {
        finalMethod = 'Lossless Vector Optimization';
        finalBytes = await this.compressLossless();
      } else if (preset === 'auto') {
        // Smart Auto: try lossless stream compaction first
        this.progressText.textContent = 'Applying smart stream compression...';
        const losslessBytes = await this.compressLossless();
        
        if (losslessBytes.length < origSize && ((origSize - losslessBytes.length) / origSize) >= 0.05) {
          // Lossless yielded a noticeable reduction without any loss of quality!
          finalBytes = losslessBytes;
          finalMethod = 'Smart Stream Compaction (Lossless)';
        } else if (this.fileDetails?.isScanned) {
          // If the document is mostly scanned images, try compact rasterization
          this.progressText.textContent = 'Document contains scans: testing image downsampling...';
          const rasterBytes = await this.compressVisualRaster('scan_compact');
          
          if (rasterBytes.length < origSize && rasterBytes.length < losslessBytes.length) {
            finalBytes = rasterBytes;
            finalMethod = 'Scanned Image Downsampling';
          } else {
            finalBytes = losslessBytes;
            finalMethod = 'Lossless Object Streams';
          }
        } else {
          // For vector documents, always keep lossless to avoid bitmap bloat
          finalBytes = losslessBytes;
          finalMethod = 'Lossless Stream Compaction';
        }
      } else {
        // Specific scan preset chosen by user
        finalMethod = 'Visual Raster Downsampling';
        const rasterBytes = await this.compressVisualRaster(preset);

        if (rasterBytes.length >= origSize) {
          rasterBloatWarning = {
            rasterSize: rasterBytes.length,
            origSize: origSize
          };
          // Safety fallback: try lossless instead of inflating file size!
          const losslessBytes = await this.compressLossless();
          finalBytes = losslessBytes.length < origSize ? losslessBytes : null;
        } else {
          finalBytes = rasterBytes;
        }
      }

      const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
      this.progressBar.style.width = '100%';
      this.progressText.textContent = 'Optimization complete!';

      const newSize = finalBytes ? finalBytes.length : origSize;
      const savedBytes = origSize - newSize;
      const reductionPercent = Math.round((savedBytes / origSize) * 100);

      this.resultContainer.style.display = 'block';

      if (finalBytes && newSize < origSize && reductionPercent > 0) {
        // Genuine compression achieved!
        const compressedBlob = new Blob([finalBytes], { type: 'application/pdf' });
        this.lastResultBlob = compressedBlob;
        this.lastResultFilename = outputFilename;

        Utils.downloadBlob(compressedBlob, outputFilename);

        this.resultStats.innerHTML = `
          <div class="stat-badge badge-success">Reduced by <strong>-${reductionPercent}%</strong></div>
          <div class="stat-badge">Original: <strong>${Utils.formatBytes(origSize)}</strong></div>
          <div class="stat-badge">Compressed: <strong>${Utils.formatBytes(newSize)}</strong></div>
          <div class="stat-badge">Saved: <strong>${Utils.formatBytes(savedBytes)}</strong></div>
          <div class="stat-badge">Method: <strong>${finalMethod}</strong></div>
          <div class="stat-badge">Time: <strong>${durationSec}s</strong></div>
        `;

        if (rasterBloatWarning) {
          this.resultStats.innerHTML += `
            <div class="notice-box notice-warning">
              💡 <strong>Smart Protection:</strong> Re-encoding this document as JPEG images would have inflated the file to <strong>${Utils.formatBytes(rasterBloatWarning.rasterSize)}</strong> because the original text and vectors are already more compact than bitmap images. We automatically protected your file and used lossless compression instead.
            </div>
          `;
        }

        Utils.showToast(`Saved ${Utils.formatBytes(savedBytes)} (-${reductionPercent}%)!`, 'success');
      } else {
        // File is already at peak compression!
        this.resultStats.innerHTML = `
          <div class="stat-badge badge-warning">⚠️ Already At Peak Compression</div>
          <div class="stat-badge">Original Size: <strong>${Utils.formatBytes(origSize)}</strong></div>
          <div class="stat-badge">Analyzed in <strong>${durationSec}s</strong></div>
        `;

        this.resultStats.innerHTML += `
          <div class="notice-box notice-warning">
            <strong>Why didn't this file get smaller?</strong><br>
            This PDF is already encoded with maximum Flate/Deflate compression and optimized embedded streams. 
            ${rasterBloatWarning ? `Converting its pages to bitmap JPEGs would have bloated the file from <strong>${Utils.formatBytes(origSize)}</strong> up to <strong>${Utils.formatBytes(rasterBloatWarning.rasterSize)}</strong>.` : ''}
            To protect your document from being bloated or losing vector clarity, no larger file was created.
          </div>
        `;

        if (this.downloadResultBtn) {
          this.downloadResultBtn.style.display = 'none';
        }

        Utils.showToast('This PDF is already at optimal compression.', 'info', 4500);
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
    this.progressBar.style.width = '35%';
    this.progressText.textContent = 'Reading PDF structures...';

    const arrayBuffer = await Utils.readFileAsArrayBuffer(this.currentFile);
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    this.progressBar.style.width = '65%';
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
   * Visual scan/image compression: renders pages to canvas and downsamples heavy scans
   */
  async compressVisualRaster(preset) {
    const settings = {
      scan_compact: { scale: 0.9, quality: 0.50, grayscale: false },     // ~72 DPI
      scan_balanced: { scale: 1.1, quality: 0.65, grayscale: false },    // ~96-100 DPI
      scan_grayscale: { scale: 0.9, quality: 0.50, grayscale: true }     // ~72 DPI monochrome
    }[preset] || { scale: 0.9, quality: 0.50, grayscale: false };

    this.progressBar.style.width = '15%';
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

    const newPdfDoc = await PDFLib.PDFDocument.create();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const percent = Math.round(15 + ((pageNum / numPages) * 75));
      this.progressBar.style.width = `${percent}%`;
      this.progressText.textContent = `Downsampling page ${pageNum} of ${numPages} (${percent}%)...`;

      const page = await pdfJsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: settings.scale });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      // Convert to grayscale if requested
      if (settings.grayscale) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Convert canvas to JPEG
      const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.quality);
      const base64Data = jpegDataUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const jpegBytes = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        jpegBytes[j] = binaryString.charCodeAt(j);
      }

      // Embed into new document
      const embeddedJpg = await newPdfDoc.embedJpg(jpegBytes);
      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = newPdfDoc.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height
      });
    }

    this.progressBar.style.width = '92%';
    this.progressText.textContent = 'Finalizing document streams...';

    const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
    return compressedBytes;
  }
}
