/**
 * printHelper.ts
 * Utilitas cetak langsung ke printer fisik / dialog cetak browser
 * tanpa harus mengunduh (download) file terlebih dahulu.
 *
 * Menggunakan teknik isolated print frame yang menyalin seluruh styling
 * Tailwind & CSS lokal, sehingga tampilan cetak presisi, rapi, dan cepat.
 */

export interface PrintDirectOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
}

/**
 * Mencetak elemen dokumen tertentu secara langsung ke printer.
 * @param target Element atau ID elemen DOM yang ingin dicetak
 * @param options Opsi orientasi dan judul dokumen
 */
export function printDirectElement(
  target: HTMLElement | string,
  options?: PrintDirectOptions
): void {
  const element = typeof target === 'string' ? document.getElementById(target) : target;

  const { title = 'Dokumen Cetak Resmi', orientation = 'auto' } = options || {};

  if (!element) {
    console.warn(`[printHelper] Element "${target}" tidak ditemukan, beralih ke window.print()`);
    window.focus();
    window.print();
    return;
  }

  // Buat / bersihkan iframe khusus cetak
  const iframeId = '__app_direct_print_frame__';
  const existingIframe = document.getElementById(iframeId);
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = iframeId;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframeWin?.document;

  if (!iframeWin || !iframeDoc) {
    window.focus();
    window.print();
    return;
  }

  // Kumpulkan semua link stylesheet dan style tags dari dokumen utama
  let styleTags = '';
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    styleTags += node.outerHTML + '\n';
  });

  const pageCss = `
    @page {
      size: ${orientation === 'auto' ? 'A4' : `A4 ${orientation}`};
      margin: 10mm 12mm 12mm 12mm;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print\\:hidden,
      .no-print,
      button,
      [data-no-print] {
        display: none !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      th, td {
        border-color: #333333 !important;
      }
      tr {
        page-break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
    }
    body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 10px !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  `;

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${styleTags}
  <style>
    ${pageCss}
  </style>
</head>
<body>
  <div class="print-container">
    ${element.outerHTML}
  </div>
</body>
</html>`);
  iframeDoc.close();

  const executePrint = () => {
    try {
      iframeWin.focus();
      iframeWin.print();
    } catch (e) {
      console.warn('[printHelper] Eksekusi print iframe gagal, beralih ke window.print()', e);
      window.focus();
      window.print();
    } finally {
      // Hapus iframe setelah dialog selesai ditutup
      setTimeout(() => {
        const frame = document.getElementById(iframeId);
        if (frame) {
          frame.remove();
        }
      }, 3000);
    }
  };

  // Pastikan gambar di dalam elemen telah termuat sempurna sebelum dialog cetak dibuka
  const images = iframeDoc.getElementsByTagName('img');
  if (images.length === 0) {
    setTimeout(executePrint, 150);
  } else {
    let loaded = 0;
    const total = images.length;
    let hasExecuted = false;

    const handleImgDone = () => {
      loaded++;
      if (loaded >= total && !hasExecuted) {
        hasExecuted = true;
        setTimeout(executePrint, 150);
      }
    };

    for (let i = 0; i < total; i++) {
      const img = images[i];
      if (img.complete) {
        handleImgDone();
      } else {
        img.onload = handleImgDone;
        img.onerror = handleImgDone;
      }
    }

    // Batas pengaman waktu jika gambar lambat merespons
    setTimeout(() => {
      if (!hasExecuted) {
        hasExecuted = true;
        executePrint();
      }
    }, 800);
  }
}
