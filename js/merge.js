/**
 * PDF_Go - Merge Module
 * Pure client-side PDF merging using pdf-lib
 */

class MergeController {
  constructor() {
    this.files = []; // [{ id, file, name, size, pageCount }]
    this.isProcessing = false;

    this.dropzone = document.getElementById('merge-dropzone');
    this.fileInput = document.getElementById('merge-file-input');
    this.fileListEl = document.getElementById('merge-file-list');
    this.mergeBtn = document.getElementById('merge-submit-btn');
    this.clearBtn = document.getElementById('merge-clear-btn');
    this.addMoreBtn = document.getElementById('merge-add-more-btn');
    this.outputNameInput = document.getElementById('merge-output-name');
    this.progressContainer = document.getElementById('merge-progress-container');
    this.progressBar = document.getElementById('merge-progress-bar');
    this.progressText = document.getElementById('merge-progress-text');
    this.resultContainer = document.getElementById('merge-result-container');
    this.resultStats = document.getElementById('merge-result-stats');
    this.downloadResultBtn = document.getElementById('merge-download-result-btn');

    this.lastResultBlob = null;
    this.lastResultFilename = '';

    this.initEvents();
  }

  initEvents() {
    // Dropzone drag & drop
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
        Utils.showToast('Please drop PDF files only', 'error');
        return;
      }
      this.addFiles(droppedFiles);
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 0) {
        this.addFiles(selectedFiles);
      }
      this.fileInput.value = '';
    });

    // Add more files button triggers file input
    if (this.addMoreBtn) {
      this.addMoreBtn.addEventListener('click', () => this.fileInput.click());
    }

    // Clear all
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.files = [];
        this.renderFileList();
        this.resetResult();
      });
    }

    // Merge button
    this.mergeBtn.addEventListener('click', () => this.executeMerge());

    // Download result button
    if (this.downloadResultBtn) {
      this.downloadResultBtn.addEventListener('click', () => {
        if (this.lastResultBlob) {
          Utils.downloadBlob(this.lastResultBlob, this.lastResultFilename);
        }
      });
    }
  }

  async addFiles(newFiles) {
    for (const file of newFiles) {
      const fileId = 'pdf_' + Math.random().toString(36).substring(2, 9);
      const details = await Utils.getPdfDetails(file);

      this.files.push({
        id: fileId,
        file: file,
        name: file.name,
        size: file.size,
        pageCount: details.pageCount
      });
    }

    this.renderFileList();
    this.resetResult();
  }

  removeFile(id) {
    this.files = this.files.filter(f => f.id !== id);
    this.renderFileList();
  }

  moveFile(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.files.length) return;
    const temp = this.files[index];
    this.files[index] = this.files[targetIndex];
    this.files[targetIndex] = temp;
    this.renderFileList();
  }

  renderFileList() {
    if (this.files.length === 0) {
      this.fileListEl.innerHTML = '';
      this.dropzone.classList.remove('has-files');
      this.mergeBtn.disabled = true;
      if (this.clearBtn) this.clearBtn.style.display = 'none';
      if (this.addMoreBtn) this.addMoreBtn.style.display = 'none';
      return;
    }

    this.dropzone.classList.add('has-files');
    this.mergeBtn.disabled = this.files.length < 2;
    if (this.clearBtn) this.clearBtn.style.display = 'inline-flex';
    if (this.addMoreBtn) this.addMoreBtn.style.display = 'inline-flex';

    this.fileListEl.innerHTML = this.files.map((item, idx) => `
      <div class="file-item" data-id="${item.id}">
        <div class="file-item-order">${idx + 1}</div>
        <div class="file-item-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div class="file-item-info">
          <div class="file-item-name" title="${item.name}">${item.name}</div>
          <div class="file-item-meta">
            ${Utils.formatBytes(item.size)}
            ${item.pageCount ? ` • ${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}` : ''}
          </div>
        </div>
        <div class="file-item-actions">
          <button type="button" class="btn-icon" title="Move Up" ${idx === 0 ? 'disabled' : ''} onclick="mergeController.moveFile(${idx}, -1)">
            ▲
          </button>
          <button type="button" class="btn-icon" title="Move Down" ${idx === this.files.length - 1 ? 'disabled' : ''} onclick="mergeController.moveFile(${idx}, 1)">
            ▼
          </button>
          <button type="button" class="btn-icon btn-danger" title="Remove" onclick="mergeController.removeFile('${item.id}')">
            ✕
          </button>
        </div>
      </div>
    `).join('');
  }

  resetResult() {
    this.progressContainer.style.display = 'none';
    this.resultContainer.style.display = 'none';
    this.lastResultBlob = null;
  }

  async executeMerge() {
    if (this.files.length < 2 || this.isProcessing) return;

    this.isProcessing = true;
    this.mergeBtn.disabled = true;
    this.progressContainer.style.display = 'block';
    this.resultContainer.style.display = 'none';
    this.progressBar.style.width = '5%';
    this.progressText.textContent = 'Initializing PDF engine...';

    const startTime = performance.now();

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      let totalPagesAdded = 0;
      let totalOriginalBytes = this.files.reduce((acc, f) => acc + f.size, 0);

      for (let i = 0; i < this.files.length; i++) {
        const item = this.files[i];
        const percent = Math.round(((i) / this.files.length) * 80) + 10;
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = `Merging file ${i + 1} of ${this.files.length}: ${item.name}...`;

        const arrayBuffer = await Utils.readFileAsArrayBuffer(item.file);
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => {
          mergedPdf.addPage(page);
          totalPagesAdded++;
        });
      }

      this.progressBar.style.width = '90%';
      this.progressText.textContent = 'Finalizing merged document...';

      // Save document with object streams enabled for maximum compression
      const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
      const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

      this.progressBar.style.width = '100%';
      this.progressText.textContent = 'Merge completed successfully!';

      const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
      const outputName = (this.outputNameInput.value.trim() || 'merged_document').replace(/\.pdf$/i, '') + '.pdf';

      this.lastResultBlob = mergedBlob;
      this.lastResultFilename = outputName;

      // Automatically trigger download
      Utils.downloadBlob(mergedBlob, outputName);

      // Display summary card
      this.resultContainer.style.display = 'block';
      this.resultStats.innerHTML = `
        <div class="stat-badge"><strong>${this.files.length}</strong> PDFs merged</div>
        <div class="stat-badge"><strong>${totalPagesAdded}</strong> total pages</div>
        <div class="stat-badge">Original: <strong>${Utils.formatBytes(totalOriginalBytes)}</strong></div>
        <div class="stat-badge">Output: <strong>${Utils.formatBytes(mergedBlob.size)}</strong></div>
        <div class="stat-badge">Time: <strong>${durationSec}s</strong></div>
      `;

      Utils.showToast(`Merged ${this.files.length} PDFs into ${outputName}!`, 'success');
    } catch (err) {
      console.error('Merge error:', err);
      Utils.showToast(`Error merging PDFs: ${err.message}`, 'error');
      this.progressText.textContent = `Error: ${err.message}`;
    } finally {
      this.isProcessing = false;
      this.mergeBtn.disabled = this.files.length < 2;
    }
  }
}
