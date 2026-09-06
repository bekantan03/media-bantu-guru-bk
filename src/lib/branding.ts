import { useState, useEffect } from 'react';
import { AppBrandingConfig } from '../types/branding';
import appLogoGold from '../assets/images/app_logo_gold_1788534892947.jpg';

export const DEFAULT_APP_LOGO = appLogoGold;
export const DEFAULT_SCHOOL_LOGO = appLogoGold;

export const DEFAULT_BRANDING_CONFIG: AppBrandingConfig = {
  appLogo: DEFAULT_APP_LOGO,
  schoolLogo: DEFAULT_SCHOOL_LOGO,
  appName: 'Media Bantu Guru',
  appTagline: 'BK & Kedisiplinan Siswa',
  appMotto: 'Membimbing • Mencerdaskan • Menginspirasi',
  schoolName: 'SMA Negeri 1 Alalak',
  schoolMotto: 'Bimbingan Konseling & Kedisiplinan Siswa',
  npsn: '30301234',
  kepsekNama: 'H. Ahmad Subarjo, M.Pd',
  kepsekNip: '19750312 200212 1 004',
  guruNama: 'Hj. Siti Rahmah, S.Pd., Kons.',
  guruNip: '19820514 200604 2 018',
  kopInstansi: 'PEMERINTAH PROVINSI KALIMANTAN SELATAN\nDINAS PENDIDIKAN DAN KEBUDAYAAN',
  kopAlamat: 'Jl. Berangas Timur No. 12, Kec. Alalak, Kab. Barito Kuala',
  kopSubHeader: 'Bimbingan Konseling & Kedisiplinan Siswa',
  showLogoOnPrint: true, // Logo sekolah ditampilkan di atas nama sekolah pada surat
  showBothLogosOnPrint: false,
  customFavicon: true,
};

const STORAGE_KEY = 'mbg_branding_config';
const BRANDING_EVENT = 'mbg_branding_changed';

/**
 * Retrieves the current branding configuration from localStorage, merged with defaults.
 */
export function getStoredBrandingConfig(): AppBrandingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BRANDING_CONFIG };
    const parsed = JSON.parse(raw);
    const resolveLogo = (val: string | undefined, defaultVal: string) => {
      if (!val || typeof val !== 'string') return defaultVal;
      const trimmed = val.trim();
      if (!trimmed) return defaultVal;
      // Allow valid data URLs and external URLs
      if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      // Only fallback if pointing to old placeholder paths or previous default logos
      if (
        trimmed === '/logo.png' ||
        trimmed === '/logo.jpg' ||
        trimmed === 'logo.png' ||
        trimmed.includes('logo.png?v=') ||
        trimmed.includes('app_logo_1788316298258')
      ) {
        return defaultVal;
      }
      return trimmed;
    };

    return {
      ...DEFAULT_BRANDING_CONFIG,
      ...parsed,
      showLogoOnPrint: parsed.showLogoOnPrint ?? true,
      // Fallback if empty string or legacy logo.png
      appLogo: resolveLogo(parsed.appLogo, DEFAULT_APP_LOGO),
      schoolLogo: resolveLogo(parsed.schoolLogo, DEFAULT_SCHOOL_LOGO),
    };
  } catch (e) {
    console.error('Failed to parse branding config:', e);
    return { ...DEFAULT_BRANDING_CONFIG };
  }
}

/**
 * Saves the branding configuration and dispatches an event to notify all components.
 */
export function saveStoredBrandingConfig(config: AppBrandingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (config.kepsekNama) localStorage.setItem('mbg_kepsek_nama', config.kepsekNama);
    if (config.kepsekNip) localStorage.setItem('mbg_kepsek_nip', config.kepsekNip);
    if (config.guruNama) localStorage.setItem('mbg_guru_nama', config.guruNama);
    if (config.guruNip) localStorage.setItem('mbg_guru_nip', config.guruNip);
    notifyBrandingChanged();
    updateFavicon(config.appLogo);
  } catch (e) {
    console.error('Failed to save branding config:', e);
  }
}

/**
 * Resets the branding configuration to factory default.
 */
export function resetBrandingConfig(): AppBrandingConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyBrandingChanged();
    updateFavicon(DEFAULT_APP_LOGO);
  } catch (e) {
    console.error('Failed to reset branding config:', e);
  }
  return { ...DEFAULT_BRANDING_CONFIG };
}

/**
 * Dynamically updates the document favicon in browser tabs.
 */
export function updateFavicon(iconUrl: string): void {
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconUrl || DEFAULT_APP_LOGO;
  } catch (e) {
    console.warn('Could not update favicon:', e);
  }
}

/**
 * Dispatches a custom event so all active React hooks re-render automatically.
 */
export function notifyBrandingChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BRANDING_EVENT));
  }
}

/**
 * React Hook for consuming the active branding configuration across the app.
 */
export function useBranding(): {
  branding: AppBrandingConfig;
  updateBranding: (newConfig: Partial<AppBrandingConfig>) => void;
  resetBranding: () => void;
  saveFullBranding: (fullConfig: AppBrandingConfig) => void;
} {
  const [branding, setBranding] = useState<AppBrandingConfig>(() => getStoredBrandingConfig());

  useEffect(() => {
    const handler = () => {
      setBranding(getStoredBrandingConfig());
    };

    window.addEventListener(BRANDING_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(BRANDING_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const updateBranding = (newConfig: Partial<AppBrandingConfig>) => {
    const updated = { ...getStoredBrandingConfig(), ...newConfig };
    saveStoredBrandingConfig(updated);
    setBranding(updated);
  };

  const saveFullBranding = (fullConfig: AppBrandingConfig) => {
    saveStoredBrandingConfig(fullConfig);
    setBranding(fullConfig);
  };

  const resetBranding = () => {
    const def = resetBrandingConfig();
    setBranding(def);
  };

  return { branding, updateBranding, resetBranding, saveFullBranding };
}

/**
 * Removes white or near-white connected background from a canvas,
 * making it transparent with soft edges.
 */
export function removeWhiteBackgroundFromCanvas(canvas: HTMLCanvasElement, threshold = 230): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Flood-fill BFS starting from all 4 borders
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  const isNearWhite = (idx: number) => {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    const a = data[idx * 4 + 3];
    return a < 30 || (r >= threshold && g >= threshold && b >= threshold);
  };

  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    if (isNearWhite(idx)) {
      visited[idx] = 1;
      queue.push(idx);
    }
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);
    enqueue(cx - 1, cy);
    enqueue(cx + 1, cy);
    enqueue(cx, cy - 1);
    enqueue(cx, cy + 1);
  }

  // Clear outer white pixels to transparent
  for (let i = 0; i < w * h; i++) {
    if (visited[i]) {
      data[i * 4 + 3] = 0; // Alpha = 0 (transparent)
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Strips white or light background from any image source and returns a transparent PNG Data URL.
 */
export function removeWhiteBackgroundFromImage(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      removeWhiteBackgroundFromCanvas(canvas);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src = imageSrc;
  });
}

/**
 * Resizes and compresses uploaded logo files (PNG, JPG, SVG, WEBP).
 * Preserves transparency and automatically removes solid white backgrounds, exporting as PNG.
 */
export function processLogoImage(file: File, maxDim = 256, autoRemoveWhiteBg = true): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang diunggah harus berupa gambar (PNG, JPG, WEBP, atau SVG)'));
      return;
    }

    // Direct SVG handling if small enough
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgStr = (e.target?.result as string) || '';
        if (svgStr.length > 45000) {
          reject(new Error('File SVG terlalu besar untuk disinkronisasikan ke Google Sheets (maksimal 45KB).'));
          return;
        }
        resolve(svgStr);
      };
      reader.onerror = () => reject(new Error('Gagal membaca file SVG'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses kanvas gambar'));
          return;
        }

        // Clear canvas with transparency support
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        // Auto remove white background if corners are white or file is JPG
        if (autoRemoveWhiteBg) {
          removeWhiteBackgroundFromCanvas(canvas);
        }

        try {
          // Export as PNG for transparency
          let dataUrl = canvas.toDataURL('image/png');
          
          // Safety guard: if PNG is still > 42,000 characters, scale down slightly to ensure cell limit compatibility
          if (dataUrl.length > 42000) {
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = Math.round(canvas.width * 0.75);
            smallerCanvas.height = Math.round(canvas.height * 0.75);
            const sCtx = smallerCanvas.getContext('2d');
            if (sCtx) {
              sCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
              dataUrl = smallerCanvas.toDataURL('image/png');
            }
          }
          resolve(dataUrl);
        } catch (err) {
          reject(new Error('Gagal mengekspor data gambar'));
        }
      };
      img.onerror = () => reject(new Error('Format file gambar tidak didukung atau rusak'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membuka file'));
    reader.readAsDataURL(file);
  });
}
