import { HeaderCustomConfig, HeaderPreset, HeaderPattern } from '../types/header';

export const HEADER_PRESETS: HeaderPreset[] = [
  {
    id: 'emerald',
    name: 'Zamrud Pendidikan (Default)',
    category: 'Khas Sekolah',
    bgLight: 'linear-gradient(135deg, #1D4137 0%, #2D5F52 60%, #3A7263 100%)',
    bgDark: 'linear-gradient(135deg, #0D201B 0%, #142E27 60%, #1B3F35 100%)',
    textColor: 'light',
    accentColor: '#F3E3C8',
    borderColor: 'rgba(243, 227, 200, 0.25)',
    description: 'Warna hijau zamrud khas aplikasi BK dengan nuansa ketenangan dan profesional.',
    pattern: 'grid',
  },
  {
    id: 'ocean',
    name: 'Samudra Disiplin',
    category: 'Khas Sekolah',
    bgLight: 'linear-gradient(135deg, #0F2B48 0%, #1E4976 50%, #2563EB 100%)',
    bgDark: 'linear-gradient(135deg, #071524 0%, #0C2138 50%, #153860 100%)',
    textColor: 'light',
    accentColor: '#93C5FD',
    borderColor: 'rgba(147, 197, 253, 0.25)',
    description: 'Biru samudra yang mencerminkan ketegasan, kejernihan berpikir, dan kepercayaan.',
    pattern: 'waves',
  },
  {
    id: 'sunset',
    name: 'Cahaya Senja & Kayu',
    category: 'Elegan & Tenang',
    bgLight: 'linear-gradient(135deg, #422006 0%, #854D0E 50%, #C2410C 100%)',
    bgDark: 'linear-gradient(135deg, #241203 0%, #452607 50%, #682305 100%)',
    textColor: 'light',
    accentColor: '#FDE68A',
    borderColor: 'rgba(253, 230, 138, 0.25)',
    description: 'Nuansa hangat keemasan dan terakota yang ramah, hangat, dan bersahabat.',
    pattern: 'diagonal',
  },
  {
    id: 'purple',
    name: 'Harmoni Konseling',
    category: 'Elegan & Tenang',
    bgLight: 'linear-gradient(135deg, #3B0764 0%, #581C87 50%, #7E22CE 100%)',
    bgDark: 'linear-gradient(135deg, #1E0433 0%, #2E0E46 50%, #471375 100%)',
    textColor: 'light',
    accentColor: '#E9D5FF',
    borderColor: 'rgba(233, 213, 255, 0.25)',
    description: 'Ungu aristokrat yang melambangkan empati bimbingan, kebijaksanaan, dan pemulihan.',
    pattern: 'sparkles',
  },
  {
    id: 'midnight',
    name: 'Malam Berbintang',
    category: 'Gradien Modern',
    bgLight: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F766E 100%)',
    bgDark: 'linear-gradient(135deg, #060A13 0%, #0E1420 60%, #063A36 100%)',
    textColor: 'light',
    accentColor: '#5EEAD4',
    borderColor: 'rgba(94, 234, 212, 0.25)',
    description: 'Slate gelap pekat dengan sentuhan pirus (teal) modern dengan kontras tinggi.',
    pattern: 'dots',
  },
  {
    id: 'mint',
    name: 'Kesegaran Alam',
    category: 'Khas Sekolah',
    bgLight: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #10B981 100%)',
    bgDark: 'linear-gradient(135deg, #02231A 0%, #033D2D 50%, #086043 100%)',
    textColor: 'light',
    accentColor: '#A7F3D0',
    borderColor: 'rgba(167, 243, 208, 0.25)',
    description: 'Hijau daun segar dan mint yang memberi energi positif dan ketenangan bagi siswa.',
    pattern: 'hexagons',
  },
  {
    id: 'batik',
    name: 'Batik & Nusantara',
    category: 'Khas Sekolah',
    bgLight: 'linear-gradient(135deg, #451A03 0%, #78350F 50%, #92400E 100%)',
    bgDark: 'linear-gradient(135deg, #230E01 0%, #3D1B07 50%, #4D2107 100%)',
    textColor: 'light',
    accentColor: '#FCD34D',
    borderColor: 'rgba(252, 211, 77, 0.3)',
    description: 'Kombinasi warna cokelat batik klasik Indonesia dengan ornamen geometris tradisional.',
    pattern: 'batik',
  },
  {
    id: 'sasirangan',
    name: 'Sasirangan Banjar Kalsel',
    category: 'Khas Sekolah',
    bgLight: 'linear-gradient(135deg, #122822 0%, #1D4137 40%, #2D5F52 70%, #9A6520 100%)',
    bgDark: 'linear-gradient(135deg, #0A1714 0%, #132721 40%, #1D3B33 70%, #683E08 100%)',
    textColor: 'light',
    accentColor: '#FDE68A',
    borderColor: 'rgba(253, 230, 138, 0.35)',
    description: 'Karakter khas budaya Kalimantan Selatan dengan motif Sasirangan Gigi Haruan, Hiris Gagatas, dan sentuhan emas Martapura.',
    pattern: 'sasirangan',
  },
  {
    id: 'aurora',
    name: 'Aurora Neo-Tech',
    category: 'Gradien Modern',
    bgLight: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #065F46 100%)',
    bgDark: 'linear-gradient(135deg, #0F0D27 0%, #191742 40%, #033023 100%)',
    textColor: 'light',
    accentColor: '#67E8F9',
    borderColor: 'rgba(103, 232, 249, 0.25)',
    description: 'Gradien multi-nada dinamis terinspirasi dari aurora borealis berestetika tinggi.',
    pattern: 'mesh',
  },
  {
    id: 'rose',
    name: 'Koral Semangat',
    category: 'Warna Berani',
    bgLight: 'linear-gradient(135deg, #881337 0%, #9F1239 50%, #E11D48 100%)',
    bgDark: 'linear-gradient(135deg, #44091B 0%, #51091C 50%, #700E24 100%)',
    textColor: 'light',
    accentColor: '#FECDD3',
    borderColor: 'rgba(254, 205, 211, 0.25)',
    description: 'Merah koral energik yang memotivasi kedisiplinan dan keberanian siswa.',
    pattern: 'diagonal',
  },
  {
    id: 'clean_light',
    name: 'Sage Elegan & Bersih',
    category: 'Elegan & Tenang',
    bgLight: 'linear-gradient(135deg, #EFF2EA 0%, #DCE8E1 50%, #E2EBE5 100%)',
    bgDark: 'linear-gradient(135deg, #13241F 0%, #1A2E27 50%, #203A32 100%)',
    textColor: 'auto',
    accentColor: '#1D4137',
    borderColor: 'rgba(29, 65, 55, 0.15)',
    description: 'Latar belakang netral lembut yang menyatu mulus dengan tema dasar aplikasi.',
    pattern: 'grid',
  },
];

export const PATTERNS_LIST: { id: HeaderPattern; label: string; preview: string }[] = [
  { id: 'none', label: 'Tanpa Motif (Polos)', preview: 'Polos' },
  { id: 'grid', label: 'Kotak Grid Presisi', preview: 'Grid' },
  { id: 'dots', label: 'Bintik Polkadot Rapi', preview: 'Dots' },
  { id: 'diagonal', label: 'Garis Diagonal Modern', preview: 'Diagonal' },
  { id: 'waves', label: 'Gelombang Lembut', preview: 'Waves' },
  { id: 'hexagons', label: 'Sarang Lebah (Heksagon)', preview: 'Hexagon' },
  { id: 'batik', label: 'Motif Etnik Nusantara', preview: 'Batik' },
  { id: 'sasirangan', label: 'Sasirangan Banjar (Kalsel)', preview: 'Sasirangan' },
  { id: 'sparkles', label: 'Kilau Bintang (Sparkles)', preview: 'Sparkles' },
  { id: 'mesh', label: 'Mesh Geometris Halus', preview: 'Mesh' },
];

export const CURATED_BANNER_IMAGES = [
  {
    name: 'Budaya & Arsitektur Banjar Kalsel',
    url: '/src/assets/images/kalsel_heritage_bg_1788531476330.jpg',
    desc: 'Sungai Martapura, Pasar Terapung & Rumah Banjar Bubungan Tinggi Kalimantan Selatan'
  },
  {
    name: 'Motif Sasirangan Gigi Haruan',
    url: '/src/assets/images/sasirangan_pattern_1788531504140.jpg',
    desc: 'Tekstur kain Sasirangan khas Kalimantan Selatan dengan ornamen emas Martapura'
  },
  {
    name: 'Gedung Sekolah Modern',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80',
    desc: 'Suasana arsitektur sekolah yang cerah dan modern'
  },
  {
    name: 'Perpustakaan & Buku',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80',
    desc: 'Deretan buku klasik dan ruang belajar penuh inspirasi'
  },
  {
    name: 'Pena & Catatan Guru',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80',
    desc: 'Meja kerja edukasi dengan catatan rapi dan laptop'
  },
  {
    name: 'Pemandangan Kampus Hijau',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80',
    desc: 'Taman sekolah hijau asri nan teduh dan tenang'
  },
  {
    name: 'Gradien Gelombang Halus',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    desc: 'Seni abstrak 3D modern dengan tekstur lembut'
  },
];

export const DEFAULT_HEADER_CONFIG: HeaderCustomConfig = {
  type: 'preset',
  presetId: 'emerald',
  customColor1: '#1D4137',
  customColor2: '#2D5F52',
  gradientDirection: 'to-r',
  pattern: 'grid',
  patternOpacity: 0.12,
  imageUrl: '',
  imageFit: 'cover',
  overlayOpacity: 0.65,
  overlayColor: '#1D4137',
  textColorMode: 'light',
  layoutMode: 'standard',
  schoolName: 'SMP / SMA Media Bantu Guru',
  schoolMotto: 'Bimbingan Konseling & Kedisiplinan Siswa',
  showSchoolName: true,
  showLiveClock: true,
  showQuickStats: true,
  blurEffect: false,
  glassmorphism: false,
};

const STORAGE_KEY = 'mbg_header_bg_config';

export function getStoredHeaderConfig(): HeaderCustomConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HEADER_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_HEADER_CONFIG, ...parsed };
  } catch (e) {
    console.error('Failed to parse header config from localStorage:', e);
    return DEFAULT_HEADER_CONFIG;
  }
}

export function saveStoredHeaderConfig(config: HeaderCustomConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save header config to localStorage:', e);
  }
}

export function resetHeaderConfig(): HeaderCustomConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset header config:', e);
  }
  return DEFAULT_HEADER_CONFIG;
}

/**
 * Generates an SVG Data URI string for clean CSS background patterns.
 */
export function getPatternSvgDataUri(pattern: HeaderPattern): string | null {
  if (pattern === 'none') return null;

  let svg = '';

  switch (pattern) {
    case 'dots':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="2" cy="2" r="1.5" fill="#FFFFFF"/></svg>`;
      break;
    case 'grid':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#FFFFFF" stroke-width="0.75"/></svg>`;
      break;
    case 'diagonal':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M-6,6 l12,-12 M0,24 l24,-24 M18,30 l12,-12" fill="none" stroke="#FFFFFF" stroke-width="1.2"/></svg>`;
      break;
    case 'waves':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M 0 10 Q 10 0 20 10 T 40 10" fill="none" stroke="#FFFFFF" stroke-width="1.2"/></svg>`;
      break;
    case 'hexagons':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="48.5" viewBox="0 0 28 48.5"><path d="M14 0 L28 8.08 L28 24.25 L14 32.33 L0 24.25 L0 8.08 Z M14 48.5 L28 40.42 L28 24.25 L14 16.17 L0 24.25 L0 40.42 Z" fill="none" stroke="#FFFFFF" stroke-width="0.8"/></svg>`;
      break;
    case 'batik':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M20 0 L40 20 L20 40 L0 20 Z M20 8 L32 20 L20 32 L8 20 Z" fill="none" stroke="#FFFFFF" stroke-width="0.9"/><circle cx="20" cy="20" r="3" fill="#FFFFFF"/></svg>`;
      break;
    case 'sasirangan':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><polygon points="24,8 40,24 24,40 8,24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="2,2"/><polygon points="24,14 34,24 24,34 14,24" fill="none" stroke="#FFFFFF" stroke-width="0.8"/><circle cx="24" cy="24" r="2" fill="#FFFFFF"/><circle cx="0" cy="0" r="2" fill="#FFFFFF"/><circle cx="48" cy="0" r="2" fill="#FFFFFF"/><circle cx="0" cy="48" r="2" fill="#FFFFFF"/><circle cx="48" cy="48" r="2" fill="#FFFFFF"/><path d="M10,14 L14,10 L18,14 L14,18 Z" fill="none" stroke="#FFFFFF" stroke-width="0.8"/><path d="M30,14 L34,10 L38,14 L34,18 Z" fill="none" stroke="#FFFFFF" stroke-width="0.8"/><path d="M10,34 L14,30 L18,34 L14,38 Z" fill="none" stroke="#FFFFFF" stroke-width="0.8"/><path d="M30,34 L34,30 L38,34 L34,38 Z" fill="none" stroke="#FFFFFF" stroke-width="0.8"/></svg>`;
      break;
    case 'sparkles':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M18 4 Q18 18 32 18 Q18 18 18 32 Q18 18 4 18 Q18 18 18 4" fill="none" stroke="#FFFFFF" stroke-width="0.9"/></svg>`;
      break;
    case 'mesh':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M0 0 L32 32 M32 0 L0 32 M16 0 L16 32 M0 16 L32 16" fill="none" stroke="#FFFFFF" stroke-width="0.5"/></svg>`;
      break;
    default:
      return null;
  }

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Resizes and compresses an uploaded image file as a lightweight data URL to store safely in localStorage.
 */
export function processUploadedImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang diunggah harus berupa gambar (JPG, PNG, WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 450;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses kanvas gambar'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.78 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal membaca format gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membuka file'));
    reader.readAsDataURL(file);
  });
}
