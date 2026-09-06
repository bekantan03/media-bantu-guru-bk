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
  subLabel?: string;
  icon: React.ReactNode;
  badge?: number | string;
  iconBox: string;
  activeGradient: string;
  hoverClass: string;
  bulletColor: string;
}

interface MenuGroup {
  id: string;
  title: string;
  roleBadge: string;
  headerColor: string;
  badgeColor: string;
  bulletColor: string;
  items: NavItem[];
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

  // Structured menu groups with vibrant color identities
  const menuGroups: MenuGroup[] = [
    {
      id: 'utama',
      title: 'Navigasi Utama',
      roleBadge: 'Semua Peran',
      headerColor: 'text-emerald-300',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      bulletColor: 'text-emerald-400',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          subLabel: 'Statistik & Ringkasan',
          icon: <LayoutDashboard className="w-4 h-4" />,
          iconBox: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 group-hover:bg-emerald-500/30 group-hover:text-emerald-200',
          activeGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 border border-emerald-300/60 shadow-lg shadow-emerald-950/40',
          hoverClass: 'hover:bg-emerald-900/40 hover:text-white',
          bulletColor: 'text-emerald-400',
        },
      ],
    },
    {
      id: 'kesiswaan',
      title: 'Kesiswaan & Data',
      roleBadge: 'Wali Kelas & BK',
      headerColor: 'text-blue-300',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      bulletColor: 'text-blue-400',
      items: [
        {
          key: 'siswa',
          label: 'Data Siswa Aktif',
          subLabel: 'Profil & Siswa Asuh',
          icon: <Users className="w-4 h-4" />,
          badge: siswaAsuhCount > 0 ? siswaAsuhCount : undefined,
          iconBox: 'bg-blue-500/20 text-blue-300 border-blue-500/40 group-hover:bg-blue-500/30 group-hover:text-blue-200',
          activeGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 border border-blue-300/60 shadow-lg shadow-blue-950/40',
          hoverClass: 'hover:bg-blue-900/40 hover:text-white',
          bulletColor: 'text-blue-400',
        },
        {
          key: 'siswa_keluar',
          label: 'Siswa Mutasi / Alumni',
          subLabel: 'Pindah, Keluar, Lulus',
          icon: <UserX className="w-4 h-4" />,
          iconBox: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 group-hover:bg-indigo-500/30 group-hover:text-indigo-200',
          activeGradient: 'bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 border border-indigo-300/60 shadow-lg shadow-indigo-950/40',
          hoverClass: 'hover:bg-indigo-900/40 hover:text-white',
          bulletColor: 'text-indigo-400',
        },
      ],
    },
    {
      id: 'piket_disiplin',
      title: 'Piket & Kedisiplinan',
      roleBadge: 'Guru Piket & Tatib',
      headerColor: 'text-amber-300',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      bulletColor: 'text-amber-400',
      items: [
        {
          key: 'absensi',
          label: 'Presensi Harian',
          subLabel: 'Absen Kelas Hari Ini',
          icon: <FileCheck2 className="w-4 h-4" />,
          iconBox: 'bg-teal-500/20 text-teal-300 border-teal-500/40 group-hover:bg-teal-500/30 group-hover:text-teal-200',
          activeGradient: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 border border-teal-300/60 shadow-lg shadow-teal-950/40',
          hoverClass: 'hover:bg-teal-900/40 hover:text-white',
          bulletColor: 'text-teal-400',
        },
        {
          key: 'terlambat',
          label: 'Keterlambatan Siswa',
          subLabel: 'Izin Masuk & Rekap',
          icon: <Clock className="w-4 h-4" />,
          iconBox: 'bg-amber-500/20 text-amber-300 border-amber-500/40 group-hover:bg-amber-500/30 group-hover:text-amber-200',
          activeGradient: 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 border border-amber-300/60 shadow-lg shadow-amber-950/40',
          hoverClass: 'hover:bg-amber-900/40 hover:text-white',
          bulletColor: 'text-amber-400',
        },
        {
          key: 'kasus',
          label: 'Kasus & Pelanggaran',
          subLabel: 'Catatan Poin Tata Tertib',
          icon: <AlertTriangle className="w-4 h-4" />,
          iconBox: 'bg-rose-500/20 text-rose-300 border-rose-500/40 group-hover:bg-rose-500/30 group-hover:text-rose-200',
          activeGradient: 'bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 border border-rose-300/60 shadow-lg shadow-rose-950/40',
          hoverClass: 'hover:bg-rose-900/40 hover:text-white',
          bulletColor: 'text-rose-400',
        },
      ],
    },
    {
      id: 'layanan_bk',
      title: 'Layanan Bimbingan (BK)',
      roleBadge: 'Guru BK',
      headerColor: 'text-purple-300',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      bulletColor: 'text-purple-400',
      items: [
        {
          key: 'konseling',
          label: 'Layanan Konseling',
          subLabel: 'Individu & Kelompok',
          icon: <MessageSquare className="w-4 h-4" />,
          iconBox: 'bg-purple-500/20 text-purple-300 border-purple-500/40 group-hover:bg-purple-500/30 group-hover:text-purple-200',
          activeGradient: 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 border border-purple-300/60 shadow-lg shadow-purple-950/40',
          hoverClass: 'hover:bg-purple-900/40 hover:text-white',
          bulletColor: 'text-purple-400',
        },
        {
          key: 'jadwal',
          label: 'Jadwal Kegiatan BK',
          subLabel: 'Home Visit & Pertemuan',
          icon: <Calendar className="w-4 h-4" />,
          iconBox: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 group-hover:bg-fuchsia-500/30 group-hover:text-fuchsia-200',
          activeGradient: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 border border-fuchsia-300/60 shadow-lg shadow-fuchsia-950/40',
          hoverClass: 'hover:bg-fuchsia-900/40 hover:text-white',
          bulletColor: 'text-fuchsia-400',
        },
      ],
    },
    {
      id: 'cetak_laporan',
      title: 'Dokumen & Laporan',
      roleBadge: 'Pelaporan Resmi',
      headerColor: 'text-sky-300',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
      bulletColor: 'text-sky-400',
      items: [
        {
          key: 'print_piket',
          label: 'Pusat Cetak Dokumen',
          subLabel: 'Surat, Jurnal, Form & Kartu',
          icon: <Printer className="w-4 h-4" />,
          iconBox: 'bg-sky-500/20 text-sky-300 border-sky-500/40 group-hover:bg-sky-500/30 group-hover:text-sky-200',
          activeGradient: 'bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 border border-sky-300/60 shadow-lg shadow-sky-950/40',
          hoverClass: 'hover:bg-sky-900/40 hover:text-white',
          bulletColor: 'text-sky-400',
        },
      ],
    },
  ];

  // Admin-only menu group with vibrant rose & emerald colors
  if (isAdmin) {
    menuGroups.push({
      id: 'pengaturan',
      title: 'Pengaturan Sistem',
      roleBadge: 'Khusus Admin',
      headerColor: 'text-rose-300',
      badgeColor: 'bg-rose-500/25 text-rose-300 border-rose-400/40',
      bulletColor: 'text-rose-400',
      items: [
        {
          key: 'branding',
          label: 'Profil & Identitas',
          subLabel: 'Kop Surat & Logo Sekolah',
          icon: <School className="w-4 h-4" />,
          iconBox: 'bg-amber-500/20 text-yellow-300 border-yellow-500/40 group-hover:bg-amber-500/30 group-hover:text-yellow-200',
          activeGradient: 'bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 border border-amber-300/60 shadow-lg shadow-amber-950/40',
          hoverClass: 'hover:bg-amber-900/40 hover:text-white',
          bulletColor: 'text-amber-400',
        },
        {
          key: 'users',
          label: 'Kelola Pengguna',
          subLabel: 'Akun Guru BK & Admin',
          icon: <UserCog className="w-4 h-4" />,
          iconBox: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 group-hover:bg-emerald-500/30 group-hover:text-emerald-200',
          activeGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border border-emerald-300/60 shadow-lg shadow-emerald-950/40',
          hoverClass: 'hover:bg-emerald-900/40 hover:text-white',
          bulletColor: 'text-emerald-400',
        },
      ],
    });
  }

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
        className={`fixed md:static top-0 left-0 h-screen h-[100dvh] max-h-[100dvh] w-72 sm:w-72 md:w-60 lg:w-64 max-w-[85vw] md:max-w-none bg-gradient-to-b from-[#0A1D17] via-[#0F2820] to-[#091512] text-slate-100 flex flex-col z-50 md:z-20 transition-transform duration-300 ease-in-out shrink-0 border-r border-emerald-800/40 shadow-2xl md:shadow-none overflow-hidden ${
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
        <div className="relative z-10 px-4 py-3.5 border-b border-emerald-800/60 bg-[#123027]/95 backdrop-blur-md flex items-center justify-between gap-2.5">
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
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-3 space-y-3.5 scrollbar-thin scrollbar-thumb-emerald-800/50">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              {/* Group Section Header with Role & Usage Badge */}
              <div className="pt-2 pb-0.5 px-2 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                <span className={`flex items-center gap-1.5 truncate ${group.headerColor}`}>
                  <span className={`${group.bulletColor} text-[10px] shrink-0 drop-shadow-xs`}>◆</span>
                  <span className="truncate">{group.title}</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border uppercase tracking-tight shrink-0 ml-1.5 shadow-2xs ${group.badgeColor}`}
                >
                  {group.roleBadge}
                </span>
              </div>

              {/* Group Menu Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activePage === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        if (window.innerWidth < 768) {
                          onClose();
                        }
                      }}
                      className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer border ${
                        isActive
                          ? 'text-white shadow-md font-bold border-transparent'
                          : `text-slate-200/90 border-transparent ${item.hoverClass}`
                      }`}
                    >
                      {/* Morphing active background pill with custom vibrant item gradient */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActivePill"
                          className={`absolute inset-0 rounded-xl ${item.activeGradient}`}
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}

                      <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                        <span
                          className={`p-1.5 rounded-lg transition-all duration-200 group-hover:scale-110 shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white border border-white/40 shadow-xs'
                              : item.iconBox
                          }`}
                        >
                          {item.icon}
                        </span>
                        <div className="flex flex-col text-left min-w-0">
                          <span className={`truncate leading-snug ${isActive ? 'text-white font-bold' : 'text-slate-100 group-hover:text-white'}`}>
                            {item.label}
                          </span>
                          {item.subLabel && (
                            <span
                              className={`text-[9.5px] truncate font-normal leading-tight ${
                                isActive ? 'text-white/85 font-medium' : 'text-slate-300/70 group-hover:text-slate-200'
                              }`}
                            >
                              {item.subLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Indicators (Badge & Diamond) */}
                      <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                        {item.badge !== undefined && !isActive && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 shadow-xs">
                            {item.badge}
                          </span>
                        )}

                        {/* Active Indicator: Martapura Diamond (Hiris Gagatas) */}
                        {isActive && (
                          <span className="text-white text-[12px] font-extrabold pr-0.5 drop-shadow-xs">
                            ◆
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

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

