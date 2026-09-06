import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gem, Landmark, Waves, Award, X, ChevronRight, BookOpen } from 'lucide-react';

/**
 * Pita Motif Sasirangan Khas Kalimantan Selatan
 * Menggabungkan pola Gigi Haruan (gerigi), Hiris Gagatas (belah ketupat intan),
 * dan jahitan jelujur tradisional suku Banjar.
 */
export const SasiranganRibbon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`} aria-hidden="true">
      {/* Latar Belakang Gradasi Kain Sasirangan Tradisional */}
      <div className="h-2.5 w-full bg-gradient-to-r from-[#142D26] via-[#2D5F52] via-[#C9862E] via-[#854D0E] to-[#142D26] flex items-center justify-between shadow-inner">
        <svg
          className="w-full h-full opacity-60 mix-blend-screen"
          viewBox="0 0 1200 20"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="sasiranganMiniPattern" width="60" height="20" patternUnits="userSpaceOnUse">
            {/* Gigi Haruan (Segitiga Gerigi) */}
            <polygon points="0,20 15,4 30,20" fill="#FBBF24" fillOpacity="0.4" />
            <polygon points="30,0 45,16 60,0" fill="#34D399" fillOpacity="0.35" />
            {/* Hiris Gagatas (Intan Berlian) */}
            <polygon points="30,5 38,10 30,15 22,10" fill="#FDE68A" fillOpacity="0.8" />
            {/* Jelujur Stitching dots */}
            <circle cx="15" cy="10" r="1.5" fill="#FFFFFF" fillOpacity="0.75" />
            <circle cx="45" cy="10" r="1.5" fill="#FFFFFF" fillOpacity="0.75" />
            <circle cx="30" cy="2" r="1" fill="#F59E0B" />
            <circle cx="30" cy="18" r="1" fill="#F59E0B" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#sasiranganMiniPattern)" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Ornamen Sudut Ukiran Khas Rumah Banjar (Tatah Surung Dayung & Daun Jaruju)
 */
export const KalselCornerOrnament: React.FC<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}> = ({ position = 'top-right', className = '' }) => {
  const rotation =
    position === 'top-left'
      ? 'rotate-0'
      : position === 'top-right'
      ? 'rotate-90'
      : position === 'bottom-right'
      ? 'rotate-180'
      : '-rotate-90';

  return (
    <div
      className={`pointer-events-none select-none ${rotation} ${className}`}
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Lengkungan Ukiran Banjar */}
        <path
          d="M2 2C16 2 28 8 36 20C40 26 44 36 46 46"
          stroke="#C9862E"
          strokeWidth="1.75"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
        <path
          d="M2 10C12 10 22 15 28 24C32 29 35 37 38 46"
          stroke="#2D5F52"
          strokeWidth="1.25"
          strokeOpacity="0.35"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        {/* Motif Hiris Gagatas di Sudut */}
        <polygon points="12,12 18,6 24,12 18,18" fill="#C9862E" fillOpacity="0.25" />
        <polygon points="12,12 18,6 24,12 18,18" stroke="#C9862E" strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="18" cy="12" r="1.75" fill="#F59E0B" />
        {/* Gigi Haruan Kecil */}
        <polygon points="4,2 8,6 12,2" fill="#2D5F52" fillOpacity="0.3" />
        <polygon points="2,4 6,8 2,12" fill="#2D5F52" fillOpacity="0.3" />
      </svg>
    </div>
  );
};

/**
 * Ilustrasi Vektor Artistik Rumah Adat Banjar "Bubungan Tinggi",
 * Sungai Martapura, dan Perahu Jukung Tradisional
 */
export const RumahBanjarGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 320 170"
        className="w-full max-w-[280px] drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="roofGrad" x1="160" y1="10" x2="160" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C9862E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="riverGrad" x1="0" y1="140" x2="320" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="intanGlow" x1="160" y1="0" x2="160" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Intan Martapura Berkilau di Puncak Bubungan */}
        <g className="animate-pulse">
          <polygon points="160,4 167,14 160,24 153,14" fill="url(#intanGlow)" />
          <circle cx="160" cy="14" r="2.5" fill="#FFFFFF" />
          {/* Sinar Cahaya Intan */}
          <line x1="160" y1="0" x2="160" y2="28" stroke="#FEF08A" strokeWidth="0.8" strokeOpacity="0.7" />
          <line x1="146" y1="14" x2="174" y2="14" stroke="#FEF08A" strokeWidth="0.8" strokeOpacity="0.7" />
        </g>

        {/* Sungkul / Puncak Atap Bubungan Tinggi Khas Banjar */}
        <path
          d="M160 14L136 50L184 50Z"
          fill="url(#roofGrad)"
          stroke="#FDE68A"
          strokeWidth="1.2"
        />
        {/* Sungkul Jamang Hiasan Tanduk Naga / Burung Enggang Banjar */}
        <path
          d="M136 50C130 46 122 46 118 52C122 55 128 53 134 52"
          stroke="#FCD34D"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M184 50C190 46 198 46 202 52C198 55 192 53 186 52"
          stroke="#FCD34D"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Atap Utama Rumah Adat Bubungan Tinggi */}
        <path
          d="M160 18L106 82H214L160 18Z"
          fill="url(#roofGrad)"
          stroke="#F59E0B"
          strokeWidth="1.4"
        />
        {/* Detail Bilah Sirap Kayu Ulin pada Atap */}
        <line x1="160" y1="26" x2="124" y2="80" stroke="#78350F" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="160" y1="26" x2="196" y2="80" stroke="#78350F" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="160" y1="40" x2="142" y2="80" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.35" />
        <line x1="160" y1="40" x2="178" y2="80" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.35" />

        {/* Anjung Kiri & Kanan (Sayap Rumah Banjar) */}
        <path
          d="M106 66L62 94H110L126 80"
          fill="#92400E"
          fillOpacity="0.75"
          stroke="#D97706"
          strokeWidth="1.2"
        />
        <path
          d="M214 66L258 94H210L194 80"
          fill="#92400E"
          fillOpacity="0.75"
          stroke="#D97706"
          strokeWidth="1.2"
        />

        {/* Tawing Halat & Dinding Kayu Ulin */}
        <rect x="94" y="82" width="132" height="36" fill="#451A03" fillOpacity="0.85" rx="2" />
        {/* Pintu Lawang Sambutan Khas Banjar */}
        <path
          d="M148 118V94C148 90 152 88 160 88C168 88 172 90 172 94V118H148Z"
          fill="#B45309"
          stroke="#FDE68A"
          strokeWidth="1"
        />
        {/* Jendela Berteralis Ukir Banjar */}
        <rect x="110" y="94" width="18" height="18" fill="#1E293B" stroke="#D97706" strokeWidth="1" rx="1" />
        <line x1="119" y1="94" x2="119" y2="112" stroke="#FDE68A" strokeWidth="0.8" />
        <line x1="110" y1="103" x2="128" y2="103" stroke="#FDE68A" strokeWidth="0.8" />

        <rect x="192" y="94" width="18" height="18" fill="#1E293B" stroke="#D97706" strokeWidth="1" rx="1" />
        <line x1="201" y1="94" x2="201" y2="112" stroke="#FDE68A" strokeWidth="0.8" />
        <line x1="192" y1="103" x2="210" y2="103" stroke="#FDE68A" strokeWidth="0.8" />

        {/* Tiang Pancang Ulin di Atas Rawa / Tepian Sungai */}
        <line x1="98" y1="118" x2="98" y2="136" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="126" y1="118" x2="126" y2="136" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="160" y1="118" x2="160" y2="136" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="194" y1="118" x2="194" y2="136" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="222" y1="118" x2="222" y2="136" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />

        {/* Gelombang Air Sungai Martapura / Barito */}
        <path
          d="M10 144C40 138 70 148 100 144C130 140 160 148 190 144C220 140 250 148 280 144C295 142 310 144 320 146"
          stroke="#34D399"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          fill="none"
        />
        <path
          d="M0 152C30 148 60 156 90 152C120 148 150 156 180 152C210 148 240 156 270 152C290 150 305 153 320 154"
          stroke="#60A5FA"
          strokeWidth="1.2"
          strokeOpacity="0.4"
          fill="none"
        />
        <rect x="0" y="146" width="320" height="24" fill="url(#riverGrad)" />

        {/* Jukung (Perahu Tradisional Banjar) Mengapung Santai */}
        <g transform="translate(42, 134)">
          <path
            d="M0 10C8 10 14 16 38 16C62 16 68 10 76 10C68 18 56 20 38 20C20 20 8 18 0 10Z"
            fill="#B45309"
            stroke="#FDE68A"
            strokeWidth="1"
          />
          {/* Dayung Jukung Banjar */}
          <line x1="22" y1="4" x2="48" y2="19" stroke="#FEF08A" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="50" cy="20" rx="3.5" ry="1.8" fill="#F59E0B" />
          {/* Buah/Bunga Pasar Terapung di Atas Jukung */}
          <circle cx="34" cy="13" r="2.5" fill="#EF4444" />
          <circle cx="39" cy="12" r="2.2" fill="#FBBF24" />
          <circle cx="43" cy="13" r="2" fill="#10B981" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Modal Interaktif: Mengenal Filosofi & Ciri Khas Kalimantan Selatan
 */
export const KalselHeritageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      title: 'Kain Sasirangan & Motif Adat',
      subtitle: 'Gigi Haruan & Hiris Gagatas',
      icon: Sparkles,
      color: 'from-amber-500 to-amber-700',
      badge: 'Warisan Budaya Takbenda',
      description:
        'Kain tradisional khas suku Banjar yang dibuat secara manual dengan teknik jelujur dan tusuk ikat rintang. Motif Gigi Haruan melambangkan ketajaman pemikiran dan adaptasi yang tangkas, sementara motif Hiris Gagatas melambangkan martabat luhur serta kecantikan batiniah.',
      penerapan: 'Membina siswa agar cerdas akal budinya serta teguh menjaga martabat diri.'
    },
    {
      title: 'Arsitektur Bubungan Tinggi',
      subtitle: 'Rumah Adat Klasik Banjar',
      icon: Landmark,
      color: 'from-emerald-600 to-teal-800',
      badge: 'Mahakarya Kayu Ulin',
      description:
        'Ikon arsitektur Banjar dengan atap curam menjulang tinggi (bubungan lancip) yang kokoh ditopang kayu Ulin (kayu besi khas hutan Kalsel). Memiliki anjung surambi sambutan yang ramah dan tawing halat berpahat ukiran tatah flora khas Banua.',
      penerapan: 'Simbol perlindungan, keteduhan, serta wadah bimbingan yang aman dan mengayomi bagi peserta didik.'
    },
    {
      title: 'Intan Martapura & Sungai Martapura',
      subtitle: 'Kota Cahaya Serambi Mekkah & Jukung',
      icon: Gem,
      color: 'from-cyan-500 to-blue-700',
      badge: 'Kemilau Bumi Antasari',
      description:
        'Martapura tersohor di dunia sebagai pusat pengasahan intan permata berkilau dengan ketahanan luar biasa. Bersanding dengan aliran Sungai Martapura dan Sungai Barito yang menghidupkan budaya Pasar Terapung (Lok Baintan & Muara Kuin) menggunakan perahu jukung tradisional.',
      penerapan: 'Setiap siswa diibaratkan intan mentah yang melalui proses asah bimbingan konseling agar berkilau cemerlang.'
    },
    {
      title: 'Semboyan Luhur Pangeran Antasari',
      subtitle: 'Waja Sampai Kaputing & Kayuh Baimbai',
      icon: Award,
      color: 'from-rose-600 to-amber-700',
      badge: 'Falsafah Kepemimpinan',
      description:
        '"Haram Manyarah Waja Sampai Kaputing" adalah ikrar pantang menyerah—berjuang gigih dengan keteguhan baja hingga titik akhir tercapai. Didukung prinsip "Kayuh Baimbai", yakni mendayung bersama secara serentak dalam gotong royong dan kebersamaan.',
      penerapan: 'Tekad pendidik BK untuk tidak pernah menyerah mendampingi setiap siswa mencapai masa depan terbaiknya.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#142621] rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Pita Sasirangan */}
        <SasiranganRibbon />

        {/* Modal Top Bar */}
        <div className="p-6 bg-gradient-to-br from-[#142D26] via-[#1D4137] to-[#12241F] text-white relative">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 tracking-wider uppercase">
                  <Sparkles className="w-3 h-3" /> Falsafah Budaya Banua
                </span>
                <h3 className="text-xl font-bold font-serif text-white">
                  Ciri Khas &amp; Filosofi Kalimantan Selatan
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-emerald-100/80 mt-2.5 leading-relaxed relative z-10">
            Aplikasi ini mengintegrasikan nilai-nilai luhur kearifan lokal Banjar dalam mendidik, membina kedisiplinan, dan mendampingi tumbuh kembang siswa.
          </p>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F7F9F6] dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] hover:border-amber-400/50 transition-all shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm text-[#1D4137] dark:text-[#6EE7B7]">
                        {item.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 font-semibold whitespace-nowrap">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mb-1.5">
                      {item.subtitle}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2.5">
                      {item.description}
                    </p>
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold">Relevansi Bimbingan:</strong> {item.penerapan}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#EFF2EA] dark:bg-[#0F1E19] border-t border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] italic">
            &ldquo;Haram Manyarah Waja Sampai Kaputing &bull; Kayuh Baimbai&rdquo;
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl transition-all shadow-sm"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
