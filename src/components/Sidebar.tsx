import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  UserX,
  FileCheck2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Calendar,
  Printer,
  BarChart3,
  UserCog,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Palette,
  Sparkles,
  Image as ImageIcon,
  School,
  Database,
  X,
  Gem,
  Landmark,
  Eye,
} from 'lucide-react';
import { PageKey, UserAccount } from '../types';
import { initials } from '../lib/storage';
import { useBranding } from '../lib/branding';
import sasiranganPattern from '../assets/images/sasirangan_pattern_1788531504140.jpg';
import kalselBanuaPanorama from '../assets/images/kalsel_banua_panorama_1788537768915.jpg';
import { SasiranganRibbon, KalselHeritageModal } from './KalselAccents';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  siswaAsuhCount: number;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onOpenHeaderCustomizer?: () => void;
  onOpenSheetsModal?: () => void;
}

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  section: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  siswaAsuhCount,
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenHeaderCustomizer,
  onOpenSheetsModal,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const { branding } = useBranding();
  const [isHeritageModalOpen, setIsHeritageModalOpen] = useState(false);

  // Background image intensity in localStorage
  const [backdropIntensity, setBackdropIntensity] = useState<'subtle' | 'vibrant' | 'minimal'>(() => {
    try {
      const saved = localStorage.getItem('kalsel_backdrop_intensity');
      if (saved === 'vibrant' || saved === 'minimal' || saved === 'subtle') return saved;
    } catch {}
    return 'subtle';
  });

  const handleIntensityChange = (val: 'subtle' | 'vibrant' | 'minimal') => {
    setBackdropIntensity(val);
    try {
      localStorage.setItem('kalsel_backdrop_intensity', val);
      window.dispatchEvent(new CustomEvent('kalsel_intensity_change', { detail: val }));
    } catch {}
  };

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, section: 'Utama' },
    { key: 'siswa', label: 'Data Siswa', icon: <Users className="w-4 h-4" />, section: 'Utama' },
    { key: 'siswa_keluar', label: 'Siswa Keluar / Pindah', icon: <UserX className="w-4 h-4" />, section: 'Utama' },
    { key: 'absensi', label: 'Absensi Harian', icon: <FileCheck2 className="w-4 h-4" />, section: 'Kedisiplinan' },
    { key: 'kasus', label: 'Kasus & Pelanggaran', icon: <AlertTriangle className="w-4 h-4" />, section: 'Kedisiplinan' },
    { key: 'terlambat', label: 'Keterlambatan', icon: <Clock className="w-4 h-4" />, section: 'Kedisiplinan' },
    { key: 'konseling', label: 'Konseling BK', icon: <MessageSquare className="w-4 h-4" />, section: 'Layanan BK' },
    { key: 'jadwal', label: 'Jadwal Kegiatan', icon: <Calendar className="w-4 h-4" />, section: 'Layanan BK' },
    { key: 'print_piket', label: 'Cetak', icon: <Printer className="w-4 h-4" />, section: 'Pusat Cetak & Laporan' },
  ];

  // Admin-only menu items
  if (isAdmin) {
    navItems.push({
      key: 'users',
      label: 'Kelola Pengguna',
      icon: <UserCog className="w-4 h-4" />,
      section: 'Pengaturan System',
    });
    navItems.push({
      key: 'branding',
      label: 'Profil Sekolah',
      icon: <School className="w-4 h-4" />,
      section: 'Pengaturan System',
    });
  }

  let currentSection = '';

  return (
    <>
      {/* Modal Dialog Mengenal Filosofi Kalsel */}
      <KalselHeritageModal
        isOpen={isHeritageModalOpen}
        onClose={() => setIsHeritageModalOpen(false)}
      />

      {/* Mobile backdrop (only on mobile < 768px) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar-navigation"
        className={`fixed md:static top-0 left-0 h-screen h-[100dvh] max-h-[100dvh] w-72 sm:w-72 md:w-60 lg:w-64 max-w-[85vw] md:max-w-none bg-gradient-to-b from-[#0F241E] via-[#16382F] to-[#0D1E18] text-emerald-50 flex flex-col z-50 md:z-20 transition-transform duration-300 ease-in-out shrink-0 border-r border-[#2D5F52]/40 shadow-2xl md:shadow-none overflow-hidden ${
          isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full md:translate-x-0 pointer-events-none md:pointer-events-auto'
        }`}
      >
        {/* Subtle Sasirangan Motif Watermark on Sidebar Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-screen bg-repeat"
          style={{
            backgroundImage: `url(${sasiranganPattern})`,
            backgroundSize: '180px 180px',
          }}
          aria-hidden="true"
        />

        {/* Brand Header with Modern Glassmorphism & Banjar Gold Touch */}
        <div className="relative z-10 px-4 py-3.5 border-b border-emerald-800/60 bg-[#163B30]/90 backdrop-blur-md flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/95 p-0.5 border border-amber-400/80 flex items-center justify-center shrink-0 shadow-md ring-2 ring-amber-400/20">
              <img
                src={branding.appLogo}
                alt="Media Bantu Guru Logo"
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif font-bold text-sm sm:text-base leading-tight text-white tracking-tight truncate flex items-center gap-1.5">
                <span>{branding.appName || 'Media Bantu Guru'}</span>
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-400/30 px-1.5 py-0.2 rounded-md">
                  <Gem className="w-2.5 h-2.5 text-amber-400" />
                  Bumi Antasari
                </span>
              </div>
            </div>
          </div>

          {/* Close button for mobile (< 768px) */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors shrink-0"
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Sasirangan Accent Ribbon under Header */}
        <SasiranganRibbon className="relative z-10" />

        {/* Navigation List */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-emerald-800/50">
          {navItems.map((item) => {
            const showSectionLabel = item.section !== currentSection;
            if (showSectionLabel) {
              currentSection = item.section;
            }
            const isActive = activePage === item.key;

            return (
              <React.Fragment key={item.key}>
                {showSectionLabel && (
                  <div className="pt-3 pb-1 px-3 text-[10px] font-bold tracking-wider text-amber-300/80 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#C9862E] text-[10px]">◆</span>
                      <span>{item.section}</span>
                    </span>
                    {item.section === 'Pengaturan System' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/40 uppercase tracking-tight mr-1">
                        Khusus Admin
                      </span>
                    )}
                    <span className="h-px flex-1 bg-gradient-to-r from-[#C9862E]/30 to-transparent ml-2" />
                  </div>
                )}

                <button
                  onClick={() => {
                    onNavigate(item.key);
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? 'text-[#201504] shadow-md font-bold'
                      : 'text-emerald-100/85 hover:text-white hover:bg-emerald-800/40'
                  }`}
                >
                  {/* Morphing active background pill with Sasirangan Gold Ochre & Diamond Accent */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 bg-gradient-to-r from-[#E5A03A] via-[#C9862E] to-[#B87724] rounded-xl shadow-md border border-amber-300/50"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2.5">
                    <span
                      className={`p-1 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'bg-[#201504]/15 text-[#201504]'
                          : 'bg-emerald-950/40 text-emerald-300/90 group-hover:text-amber-300 border border-emerald-700/30'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {/* Active Indicator: Martapura Diamond (Hiris Gagatas) */}
                  {isActive && (
                    <span className="relative z-10 text-[#201504] text-[11px] font-extrabold pr-1">
                      ◆
                    </span>
                  )}

                  {item.key === 'siswa' && siswaAsuhCount > 0 && !isActive && (
                    <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-800 text-amber-300 border border-emerald-700">
                      {siswaAsuhCount}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}

          {/* Special Feature Card: Pesona Banua & Filosofi Kalsel */}
          <div className="pt-3 pb-1">
            <div className="rounded-2xl p-2.5 bg-gradient-to-b from-[#133027] to-[#0F241E] border border-amber-500/25 shadow-sm space-y-2 relative overflow-hidden group">
              {/* Thumbnail Panorama Kalsel */}
              <div className="relative h-16 w-full rounded-xl overflow-hidden border border-amber-400/30 shadow-xs">
                <img
                  src={kalselBanuaPanorama}
                  alt="Lanskap Banua Kalimantan Selatan"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-1.5">
                  <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 leading-none drop-shadow-xs">
                    <Landmark className="w-3 h-3 text-amber-400" />
                    Pasar Terapung &amp; Bubungan Tinggi
                  </span>
                  <span className="text-[9px] text-gray-200/90 leading-tight italic truncate">
                    Waja Sampai Kaputing
                  </span>
                </div>
              </div>

              {/* Action: Buka Filosofi Banua Modal */}
              <button
                type="button"
                onClick={() => setIsHeritageModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-amber-600/30 to-amber-700/40 hover:from-amber-600/50 hover:to-amber-700/60 border border-amber-400/40 rounded-lg text-[11px] font-bold text-amber-200 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Filosofi Bimbingan Banua</span>
              </button>

              {/* Quick Background Panorama Intensity Switcher */}
              <div className="pt-1 border-t border-emerald-800/50 flex items-center justify-between text-[10px]">
                <span className="text-emerald-300/80 font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  Latar Body:
                </span>
                <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-md border border-emerald-800/60">
                  <button
                    type="button"
                    onClick={() => handleIntensityChange('subtle')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                      backdropIntensity === 'subtle'
                        ? 'bg-[#C9862E] text-black shadow-xs'
                        : 'text-gray-300 hover:text-white'
                    }`}
                    title="Nuansa Lembut (Nyaman untuk membaca data)"
                  >
                    Subtil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIntensityChange('vibrant')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                      backdropIntensity === 'vibrant'
                        ? 'bg-[#C9862E] text-black shadow-xs'
                        : 'text-gray-300 hover:text-white'
                    }`}
                    title="Lanskap Jelas (Pemandangan lebih tampak)"
                  >
                    Lanskap
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIntensityChange('minimal')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                      backdropIntensity === 'minimal'
                        ? 'bg-[#C9862E] text-black shadow-xs'
                        : 'text-gray-300 hover:text-white'
                    }`}
                    title="Minimalis (Sangat tipis)"
                  >
                    Tipis
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Quick Action: Google Sheets & Edit Header */}
          {isAdmin && onOpenSheetsModal && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onOpenSheetsModal();
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-emerald-100 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/30 transition-all group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Google Sheets Sync</span>
                </div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                  Cloud
                </span>
              </button>
            </div>
          )}

          {/* Admin Quick Action: Edit Header */}
          {isAdmin && onOpenHeaderCustomizer && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onOpenHeaderCustomizer();
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 transition-all group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>Edit Latar Header</span>
                </div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                  <Sparkles className="w-2.5 h-2.5" />
                  Admin
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        {currentUser && (
          <div className="p-3 border-t border-emerald-800/60 bg-[#143127]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-200 text-amber-950 border border-amber-400'
                      : 'bg-emerald-200 text-emerald-950 border border-emerald-400'
                  }`}
                >
                  {initials(currentUser.nama)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {currentUser.nama}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {currentUser.role === 'admin' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[9px] font-bold">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[9px] font-bold">
                        <GraduationCap className="w-2.5 h-2.5" />
                        Guru BK
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-emerald-800/60 hover:bg-rose-900/80 text-emerald-200 hover:text-white transition-colors shrink-0 cursor-pointer"
                  title="Keluar (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Traditional Banjarese Slogan Footer */}
        <div className="px-3.5 py-2 bg-[#0E201B] border-t border-emerald-800/50 text-[10px] text-emerald-300/80 flex items-center justify-between">
          <span className="truncate text-amber-300/90 font-medium">
            Kayuh Baimbai &bull; Banua Bungas
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-1 shadow-xs" />
        </div>

        {/* Bottom Ribbon */}
        <SasiranganRibbon />
      </aside>
    </>
  );
};

