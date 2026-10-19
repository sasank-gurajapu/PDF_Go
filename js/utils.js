/**
 * PDF_Go Utilities
 * Helper functions for formatting, file handling, and UI toasts.
 */

const Utils = {
  /**
   * Formats bytes into human-readable strings (e.g., "1.45 MB")
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Triggers an in-browser download of a Blob or Uint8Array
   */
  downloadBlob(data, filename, mimeType = 'application/pdf') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  /**
   * Reads a File as an ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Inspects a PDF file using pdf-lib to extract page count and basic details
   */
  async getPdfDetails(file) {
    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return {
        pageCount: pdfDoc.getPageCount(),
        isEncrypted: pdfDoc.isEncrypted,
        size: file.size,
        name: file.name
      };
    } catch (err) {
      console.warn('Could not inspect PDF with pdf-lib:', err);
      return {
        pageCount: null,
        isEncrypted: false,
        size: file.size,
        name: file.name
      };
    }
  },

  /**
   * Toast notification helper
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-msg">${message}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

