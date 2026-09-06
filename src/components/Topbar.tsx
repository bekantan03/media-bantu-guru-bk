import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Calendar as CalendarIcon,
  X,
  Star,
  ArrowRight,
  Sun,
  Moon,
  Database,
  RefreshCw,
  CheckCircle2,
  Copy,
  Palette,
  Sparkles,
  School,
  Clock,
  Layout,
  Sliders,
  Check,
  Image as ImageIcon,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { PageKey, Siswa, UserAccount, HeaderCustomConfig } from '../types';
import { todayISO, fmtDateFull } from '../lib/storage';
import { Modal } from './Modal';
import { HeaderCustomizerModal } from './HeaderCustomizerModal';
import { AnalogClock } from './AnalogClock';
import { useBranding } from '../lib/branding';
import {
  HEADER_PRESETS,
  getStoredHeaderConfig,
  saveStoredHeaderConfig,
  resetHeaderConfig,
  getPatternSvgDataUri,
} from '../lib/headerTheme';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  testGoogleSheetsConnection,
  isGoogleSheetsConfigured,
  getShareableSyncUrl,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../lib/googleSheets';

interface TopbarProps {
  page: PageKey;
  onOpenSidebar: () => void;
  siswaList?: Siswa[];
  onNavigate?: (page: PageKey, params?: Record<string, string>) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  onSyncPush?: () => Promise<{ success: boolean; message: string } | void>;
  onSyncPull?: () => Promise<{ success: boolean; message: string } | void>;
  isSyncing?: boolean;
  showToast?: (msg: string) => void;
  currentUser?: UserAccount | null;
  isCustomizerOpen?: boolean;
  onOpenCustomizer?: () => void;
  onCloseCustomizer?: () => void;
  isSheetsModalOpen?: boolean;
  onOpenSheetsModal?: () => void;
  onCloseSheetsModal?: () => void;
}

interface PageMetaItem {
  title: string;
  sub: string;
  category: string;
  roleLabel: string;
}

const PAGE_META: Record<PageKey, PageMetaItem> = {
  dashboard: { title: 'Dashboard Utama', sub: 'Ringkasan aktivitas bimbingan dan kedisiplinan siswa', category: 'Utama', roleLabel: 'Semua Pengguna' },
  siswa: { title: 'Data Siswa Aktif', sub: 'Kelola profil, riwayat poin, dan status siswa asuh', category: 'Kesiswaan', roleLabel: 'Wali Kelas & BK' },
  siswa_keluar: { title: 'Siswa Keluar / Pindah', sub: 'Daftar alumni, siswa berhenti, pindah, atau keluar', category: 'Kesiswaan', roleLabel: 'Kesiswaan' },
  absensi: { title: 'Absensi Kehadiran Harian', sub: 'Pencatatan kehadiran harian per kelas (Hadir, Sakit, Izin, Alpa)', category: 'Piket & Disiplin', roleLabel: 'Guru Piket' },
  kasus: { title: 'Kasus & Pelanggaran', sub: 'Catatan pelanggaran dan akumulasi poin kedisiplinan', category: 'Piket & Disiplin', roleLabel: 'Tim Tatib' },
  terlambat: { title: 'Keterlambatan Siswa', sub: 'Catatan keterlambatan harian dan rekap bulanan / semester', category: 'Piket & Disiplin', roleLabel: 'Guru Piket' },
  konseling: { title: 'Layanan Konseling BK', sub: 'Riwayat konseling individu, kelompok, dan bimbingan klasikal', category: 'Layanan BK', roleLabel: 'Guru BK' },
  jadwal: { title: 'Jadwal Kegiatan BK', sub: 'Agenda layanan BK, kunjungan rumah (home visit), dan kelas', category: 'Layanan BK', roleLabel: 'Guru BK' },
  print_piket: { title: 'Pusat Cetak Dokumen & Laporan BK', sub: 'Laporan Rekapitulasi, Surat Panggilan, Jurnal Piket, Formulir BK & Kartu Siswa', category: 'Dokumen & Laporan', roleLabel: 'Pelaporan Resmi' },
  laporan: { title: 'Pusat Cetak & Laporan Rekap', sub: 'Laporan Rekapitulasi, Surat Panggilan, Jurnal Piket, Formulir BK & Kartu Siswa', category: 'Dokumen & Laporan', roleLabel: 'Pelaporan Resmi' },
  users: { title: 'Kelola Pengguna', sub: 'Manajemen akun administrator dan guru BK', category: 'Pengaturan Sistem', roleLabel: 'Khusus Admin' },
  branding: { title: 'Profil & Identitas Sekolah', sub: 'Pengaturan logo aplikasi, logo sekolah resmi, dan kop surat', category: 'Pengaturan Sistem', roleLabel: 'Khusus Admin' },
};

export const Topbar: React.FC<TopbarProps> = ({
  page,
  onOpenSidebar,
  siswaList = [],
  onNavigate,
  isDark = false,
  onToggleDark,
  onSyncPush,
  onSyncPull,
  isSyncing,
  showToast,
  currentUser,
  isCustomizerOpen,
  onOpenCustomizer,
  onCloseCustomizer,
  isSheetsModalOpen,
  onOpenSheetsModal,
  onCloseSheetsModal,
}) => {
  const meta = PAGE_META[page] || { title: 'Media Bantu Guru', sub: 'Aplikasi Bimbingan Konseling' };
  const { branding } = useBranding();
  const isAdmin = currentUser?.role === 'admin';

  // Header Background State & Persistence
  const [headerConfig, setHeaderConfig] = useState<HeaderCustomConfig>(() => getStoredHeaderConfig());
  const [internalCustomizerOpen, setInternalCustomizerOpen] = useState(false);
  const [isQuickThemeOpen, setIsQuickThemeOpen] = useState(false);

  const effectiveCustomizerOpen = isCustomizerOpen !== undefined ? isCustomizerOpen : internalCustomizerOpen;

  const handleOpenCustomizer = () => {
    if (!isAdmin) {
      showToast?.('Kustomisasi tampilan header hanya untuk Administrator');
      return;
    }
    setInternalCustomizerOpen(true);
    onOpenCustomizer?.();
  };

  const handleCloseCustomizer = () => {
    setInternalCustomizerOpen(false);
    onCloseCustomizer?.();
  };

  // Sync & Menu State
  const [isSyncDropdownOpen, setIsSyncDropdownOpen] = useState(false);
  const [internalSheetsModalOpen, setInternalSheetsModalOpen] = useState(false);
  const effectiveSheetsModalOpen = isSheetsModalOpen !== undefined ? isSheetsModalOpen : internalSheetsModalOpen;

  const handleOpenSheetsModal = () => {
    if (!isAdmin) {
      showToast?.('Pengaturan koneksi Google Sheets hanya untuk Administrator');
      return;
    }
    setInternalSheetsModalOpen(true);
    onOpenSheetsModal?.();
  };

  const handleCloseSheetsModal = () => {
    setInternalSheetsModalOpen(false);
    onCloseSheetsModal?.();
  };

  const [gcfg, setGcfg] = useState(getGoogleSheetsConfig());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  const copyToClipboardSafe = async (text: string, onSuccess: () => void) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        onSuccess();
        return;
      }
    } catch {
      // fallback to textarea
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        onSuccess();
        return;
      }
    } catch {
      // ignore
    }
    showToast?.('Tidak dapat menyalin otomatis. Silakan salin secara manual.');
  };

  // Real-time Clock for Banner / Topbar
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const syncRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Global hotkey: ESC to close open popovers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSyncDropdownOpen(false);
        setIsQuickThemeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (syncRef.current && !syncRef.current.contains(e.target as Node)) {
        setIsSyncDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsQuickThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveHeaderConfig = (newConfig: HeaderCustomConfig) => {
    setHeaderConfig(newConfig);
    saveStoredHeaderConfig(newConfig);
  };

  const handleResetHeader = () => {
    const def = resetHeaderConfig();
    setHeaderConfig(def);
  };

  const handleQuickSelectPreset = (presetId: string) => {
    const preset = HEADER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const updated: HeaderCustomConfig = {
      ...headerConfig,
      type: 'preset',
      presetId: preset.id,
      pattern: preset.pattern || headerConfig.pattern || 'grid',
    };
    handleSaveHeaderConfig(updated);
    if (showToast) showToast(`Tema "${preset.name}" diterapkan`);
  };

  // Compute Header Background Styles
  const getHeaderContainerStyle = (): React.CSSProperties => {
    let bg = '';

    if (headerConfig.type === 'preset') {
      const currentPreset = HEADER_PRESETS.find((p) => p.id === headerConfig.presetId) || HEADER_PRESETS[0];
      bg = isDark ? currentPreset.bgDark : currentPreset.bgLight;
    } else if (headerConfig.type === 'custom_gradient' || headerConfig.type === 'custom_color') {
      const dir = headerConfig.gradientDirection === 'to-r' ? '90deg'
        : headerConfig.gradientDirection === 'to-b' ? '180deg'
        : headerConfig.gradientDirection === 'to-br' ? '135deg'
        : headerConfig.gradientDirection === 'to-tr' ? '45deg'
        : '270deg';
      bg = `linear-gradient(${dir}, ${headerConfig.customColor1} 0%, ${headerConfig.customColor2} 100%)`;
    } else if (headerConfig.type === 'image' && headerConfig.imageUrl) {
      bg = `url("${headerConfig.imageUrl}") center / cover no-repeat`;
    } else {
      bg = isDark
        ? 'linear-gradient(135deg, #0D201B 0%, #142E27 100%)'
        : 'linear-gradient(135deg, #1D4137 0%, #2D5F52 100%)';
    }

    return {
      background: bg,
    };
  };

  const isLightPreset = headerConfig.type === 'preset' && headerConfig.presetId === 'clean_light' && !isDark;
  const patternSvgUri = getPatternSvgDataUri(headerConfig.pattern);
  const activeSiswaCount = siswaList.filter((s) => (s.status || 'aktif') === 'aktif').length;
  const activeAsuhCount = siswaList.filter((s) => (s.status || 'aktif') === 'aktif' && s.asuh).length;

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 transition-all duration-300 shadow-md border-b border-black/10 dark:border-white/10 relative"
      style={getHeaderContainerStyle()}
    >
      {/* Background Overlays Container (Cleanly clipped inside header) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-none">
        {headerConfig.type === 'image' && headerConfig.imageUrl && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              backgroundColor: headerConfig.overlayColor || '#000000',
              opacity: headerConfig.overlayOpacity ?? 0.65,
            }}
          />
        )}

        {patternSvgUri && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              backgroundImage: patternSvgUri,
              opacity: headerConfig.patternOpacity ?? 0.12,
            }}
          />
        )}

        {headerConfig.glassmorphism && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Header Core Content */}
      <div className="relative z-10 px-3 sm:px-5 lg:px-8 py-2 sm:py-2.5 flex flex-col gap-2">
        {/* Main Bar (Top Row) */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Title & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onOpenSidebar}
              className={`md:hidden h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl transition-colors shrink-0 shadow-xs flex items-center justify-center cursor-pointer ${
                isLightPreset
                  ? 'bg-white/90 text-[#1D4137] border border-[#D9E0D4] hover:bg-white'
                  : 'bg-white/20 text-white border border-white/25 hover:bg-white/30'
              }`}
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {meta.category && (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9.5px] sm:text-[10px] font-bold uppercase tracking-tight shadow-2xs border shrink-0 ${
                        isLightPreset
                          ? 'bg-amber-100/90 text-amber-900 border-amber-300/80'
                          : 'bg-black/35 text-amber-300 border-amber-400/35'
                      }`}
                    >
                      <span>{meta.category}</span>
                      <span className="opacity-50">•</span>
                      <span className={isLightPreset ? 'text-emerald-900' : 'text-emerald-200'}>{meta.roleLabel}</span>
                    </span>
                  )}
                  <h1
                    className={`font-serif font-bold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl tracking-tight leading-tight drop-shadow-xs truncate ${
                      isLightPreset ? 'text-[#1D4137]' : 'text-white'
                    }`}
                  >
                    {meta.title}
                  </h1>
                </div>
                <p
                  className={`text-[11px] sm:text-xs mt-0.5 hidden md:block truncate drop-shadow-xs ${
                    isLightPreset ? 'text-[#647169]' : 'text-white/85'
                  }`}
                >
                  {meta.sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Action Controls: Sheets, Theme, Clock */}
          <div className="flex items-center gap-1 sm:gap-2 justify-end shrink-0">
            {/* Quick Logo & Branding Upload Menu (Admin only) - visible on tablet & desktop */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onNavigate?.('branding')}
                className={`hidden sm:flex h-8.5 sm:h-9 px-2 sm:px-2.5 rounded-xl border text-xs font-semibold items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer ${
                  page === 'branding'
                    ? 'bg-amber-500 text-gray-950 border-amber-400 font-extrabold shadow-sm'
                    : isLightPreset
                    ? 'bg-white/90 text-[#1D4137] border-[#D9E0D4] hover:bg-white'
                    : 'bg-white/20 text-white border-white/25 hover:bg-white/30'
                }`}
                title="Upload Logo Sekolah & Logo Aplikasi"
                aria-label="Upload Logo Sekolah & Aplikasi"
              >
                <ImageIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${page === 'branding' ? 'text-gray-950' : isLightPreset ? 'text-amber-600' : 'text-amber-300'}`} />
                <span className="hidden xl:inline">Upload Logo</span>
              </button>
            )}

            {/* Google Sheets Sync Menu */}
            <div ref={syncRef} className="relative shrink-0">
              <button
                onClick={() => {
                  setGcfg(getGoogleSheetsConfig());
                  setIsSyncDropdownOpen((prev) => !prev);
                }}
                className={`h-8.5 w-8.5 sm:h-9 sm:w-auto px-1.5 sm:px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                  isLightPreset
                    ? 'bg-white/90 text-[#1D4137] border-[#D9E0D4] hover:bg-white'
                    : 'bg-white/20 text-white border-white/25 hover:bg-white/30'
                }`}
                title="Status Cloud Database (Google Sheets)"
                aria-label="Google Sheets Sync Menu"
              >
                <Database className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLightPreset ? 'text-emerald-700' : 'text-emerald-300'}`} />
                <span className="hidden md:inline">Sheets</span>
                {isGoogleSheetsConfigured(gcfg) && gcfg.autoSync && (
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" title="Cloud Auto-Sync Aktif" />
                )}
              </button>

                {/* Sync Dropdown Popover */}
                <AnimatePresence>
                  {isSyncDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-32px)] bg-white dark:bg-[#1A2E27] rounded-2xl shadow-2xl border border-[#D9E0D4] dark:border-[#2D483F] overflow-hidden z-50 p-3.5 space-y-3 text-xs text-[#1D4137] dark:text-gray-100"
                    >
                      <div
                        className={`p-2.5 border rounded-xl flex items-center justify-between ${
                          isGoogleSheetsConfigured(gcfg)
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isGoogleSheetsConfigured(gcfg) ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          )}
                          <span className="font-bold text-[11px] text-[#1D4137] dark:text-[#6EE7B7]">
                            {isGoogleSheetsConfigured(gcfg) ? 'Google Sheets Terhubung' : 'Belum Dikonfigurasi'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            !isGoogleSheetsConfigured(gcfg)
                              ? 'bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200'
                              : gcfg.autoSync
                              ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {!isGoogleSheetsConfigured(gcfg) ? 'Offline' : gcfg.autoSync ? 'Auto ON' : 'Auto OFF'}
                        </span>
                      </div>

                      {!isGoogleSheetsConfigured(gcfg) ? (
                        <div className="pt-1">
                          {isAdmin ? (
                            <button
                              onClick={() => {
                                setIsSyncDropdownOpen(false);
                                setGcfg(getGoogleSheetsConfig());
                                setTestResult(null);
                                handleOpenSheetsModal();
                              }}
                              className="w-full py-2.5 px-3 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl text-center text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Database className="w-3.5 h-3.5" />
                              <span>Buka Pengaturan &amp; Hubungkan</span>
                            </button>
                          ) : (
                            <p className="text-center text-[11px] text-[#647169] dark:text-[#8AA399] py-1.5 px-2 bg-[#F2F5EE] dark:bg-black/25 rounded-lg border border-[#D9E0D4] dark:border-[#2D483F]">
                              Hubungi Administrator untuk menghubungkan integrasi Cloud Google Sheets.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {onSyncPush && (
                            <button
                              onClick={async () => {
                                setIsSyncDropdownOpen(false);
                                await onSyncPush();
                              }}
                              disabled={isSyncing}
                              className="w-full px-3 py-2 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl transition-colors flex items-center justify-between disabled:opacity-50 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span>Kirim Ke Sheets (Push)</span>
                              </div>
                              <span className="text-[10px] opacity-80">Upload</span>
                            </button>
                          )}
                          {onSyncPull && (
                            <button
                              onClick={async () => {
                                setIsSyncDropdownOpen(false);
                                await onSyncPull();
                              }}
                              disabled={isSyncing}
                              className="w-full px-3 py-2 bg-[#EFF2EA] dark:bg-[#12211C] hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[#1D4137] dark:text-[#6EE7B7] border border-[#D9E0D4] dark:border-[#2D483F] font-bold rounded-xl transition-colors flex items-center justify-between disabled:opacity-50 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span>Tarik Dari Sheets (Pull)</span>
                              </div>
                              <span className="text-[10px] opacity-80">Download</span>
                            </button>
                          )}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="pt-2 border-t border-[#D9E0D4] dark:border-[#2D483F] text-[11px]">
                          <button
                            onClick={() => {
                              setIsSyncDropdownOpen(false);
                              setGcfg(getGoogleSheetsConfig());
                              setTestResult(null);
                              handleOpenSheetsModal();
                            }}
                            className="w-full py-1.5 px-2 text-center text-[#2D5F52] dark:text-[#6EE7B7] hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Pengaturan Lengkap &amp; Code.gs</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            {/* Header Customizer Button (Khusus Admin) */}
            {isAdmin && (
              <button
                onClick={handleOpenCustomizer}
                className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl border text-xs font-bold flex items-center justify-center shadow-xs transition-all shrink-0 cursor-pointer ${
                  isLightPreset
                    ? 'bg-white/90 text-[#1D4137] border-[#D9E0D4] hover:bg-white'
                    : 'bg-white/20 text-white border-white/25 hover:bg-white/30'
                }`}
                title="Kustomisasi Latar & Tampilan Header (Khusus Admin)"
                aria-label="Kustomisasi Header"
              >
                <Palette className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLightPreset ? 'text-[#1D4137]' : 'text-amber-300'}`} />
              </button>
            )}

            {/* Dark Mode Theme Toggle */}
            {onToggleDark && (
              <button
                onClick={onToggleDark}
                className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl border text-xs font-bold flex items-center justify-center shadow-xs transition-all shrink-0 cursor-pointer ${
                  isLightPreset
                    ? 'bg-white/90 text-[#1D4137] border-[#D9E0D4] hover:bg-white'
                    : 'bg-white/20 text-white border-white/25 hover:bg-white/30'
                }`}
                title={isDark ? 'Mode Terang (Light Mode)' : 'Mode Gelap (Dark Mode)'}
                aria-label="Toggle Dark Mode"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300" />
                ) : (
                  <Moon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLightPreset ? 'text-[#1D4137]' : 'text-emerald-200'}`} />
                )}
              </button>
            )}

            {/* Single Combined Analog Clock & Full Date in Crisp Compact Capsule */}
            <div className="h-8.5 sm:h-9 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 rounded-xl bg-white/25 dark:bg-black/60 border border-white/30 dark:border-white/20 text-white shadow-xs shrink-0">
              <AnalogClock size={20} showDigitalText={true} showTimezone={true} />
              <div className="h-3.5 w-[1px] bg-white/30 hidden md:block" />
              <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono font-bold text-white tracking-wide">
                <CalendarIcon className="w-3.5 h-3.5 text-white/90" />
                <span>{fmtDateFull(todayISO())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Banner Mode Row (Proper, Compact & Identity-Driven) */}
        {headerConfig.layoutMode === 'banner' && (
          <div
            className={`pt-2 sm:pt-2.5 border-t flex items-center justify-between gap-3 flex-wrap ${
              isLightPreset ? 'border-[#1D4137]/15' : 'border-white/20'
            }`}
          >
            {/* School Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              {branding.schoolLogo && branding.schoolLogo !== branding.appLogo && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center">
                  <img
                    src={branding.schoolLogo}
                    alt={branding.schoolName || 'Logo Sekolah'}
                    className="w-full h-full object-contain drop-shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p
                  className={`font-bold text-xs sm:text-sm tracking-tight truncate drop-shadow-xs ${
                    isLightPreset ? 'text-[#1D4137]' : 'text-white'
                  }`}
                >
                  {branding.schoolName || headerConfig.schoolName || 'Media Bantu Guru'}
                </p>
                <p
                  className={`text-[11px] sm:text-xs truncate drop-shadow-xs ${
                    isLightPreset ? 'text-[#647169]' : 'text-white/80'
                  }`}
                >
                  {branding.schoolMotto || headerConfig.schoolMotto || 'Membimbing • Mencerdaskan • Menginspirasi'}
                </p>
              </div>
            </div>

            {/* Quick Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {headerConfig.showQuickStats && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      isLightPreset
                        ? 'bg-white/90 text-[#1D4137] border-[#D9E0D4]'
                        : 'bg-white/20 text-white border-white/25'
                    }`}
                  >
                    Siswa Aktif: <strong>{activeSiswaCount}</strong>
                  </span>
                  {activeAsuhCount > 0 && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                        isLightPreset
                          ? 'bg-purple-100 text-purple-900 border-purple-200'
                          : 'bg-purple-900/80 text-purple-200 border-purple-400/40'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                      <span>Asuh: <strong>{activeAsuhCount}</strong></span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header Customizer Modal */}
      <HeaderCustomizerModal
        isOpen={effectiveCustomizerOpen}
        onClose={handleCloseCustomizer}
        config={headerConfig}
        onSave={handleSaveHeaderConfig}
        onReset={handleResetHeader}
        showToast={showToast}
        isDark={isDark}
      />

      {/* Google Sheets Integration Modal */}
      <Modal
        isOpen={effectiveSheetsModalOpen}
        onClose={handleCloseSheetsModal}
        title="Integrasi Cloud Database (Google Sheets)"
        maxWidth="xl"
      >
        <div className="space-y-5 text-xs text-[#21322C] dark:text-gray-100">
          {/* Status Banner */}
          {testResult ? (
            <div
              className={`p-3.5 border rounded-xl flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p
                  className={`font-bold ${
                    testResult.success ? 'text-[#1D4137] dark:text-[#6EE7B7]' : 'text-rose-900 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? 'Koneksi Berhasil & Terverifikasi' : 'Uji Koneksi Gagal'}
                </p>
                <p
                  className={`text-[11px] whitespace-pre-line leading-relaxed ${
                    testResult.success
                      ? 'text-emerald-700/90 dark:text-emerald-300/90'
                      : 'text-rose-800/90 dark:text-rose-300/90'
                  }`}
                >
                  {testResult.message}
                </p>
              </div>
            </div>
          ) : isGoogleSheetsConfigured(gcfg) ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-[#1D4137] dark:text-[#6EE7B7]">Cloud Database Terhubung Baku</p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                    {gcfg.autoSync
                      ? 'Sinkronisasi cloud aktif otomatis untuk semua perangkat & user'
                      : 'Sinkronisasi manual siap digunakan'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-200">Belum Terhubung ke Google Sheets</p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Masukkan URL Web App Apps Script dari Google Spreadsheet Anda di bawah untuk mengaktifkan cloud database.
                </p>
              </div>
            </div>
          )}

          {/* Konfigurasi URL & Token */}
          <div className="p-4 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="font-bold text-[#1D4137] dark:text-gray-200">URL Google Apps Script (Web App)</label>
                {gcfg.appsScriptUrl.includes('docs.google.com/spreadsheets') && (
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                    ⚠️ Link Spreadsheet Terdeteksi
                  </span>
                )}
                {gcfg.appsScriptUrl.endsWith('/dev') && (
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                    ⚠️ URL /dev Terdeteksi
                  </span>
                )}
                {gcfg.appsScriptUrl.includes('/exec') && !gcfg.appsScriptUrl.includes('docs.google.com/spreadsheets') && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                    ✓ Format Valid (/exec)
                  </span>
                )}
              </div>
              <input
                type="text"
                value={gcfg.appsScriptUrl}
                onChange={(e) => {
                  const updated = { ...gcfg, appsScriptUrl: e.target.value };
                  setGcfg(updated);
                  saveGoogleSheetsConfig(updated);
                  setTestResult(null);
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2.5 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-[11px] text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />

              {gcfg.appsScriptUrl.includes('docs.google.com/spreadsheets') && (
                <p className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40 leading-relaxed">
                  <strong>Penting:</strong> Ini adalah link Google Spreadsheet, bukan Web App Apps Script. Buka menu{' '}
                  <em>Extensions &gt; Apps Script</em> pada Spreadsheet, klik <em>Deploy &gt; New deployment &gt; Web app</em>,
                  dan salin URL yang berakhiran <strong>/exec</strong>.
                </p>
              )}
              {gcfg.appsScriptUrl.endsWith('/dev') && (
                <p className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40 leading-relaxed">
                  <strong>Peringatan:</strong> URL berakhiran <code>/dev</code> hanya untuk mode debug akun pribadi.
                  Gunakan deployment resmi dengan URL berakhiran <strong>/exec</strong> agar dapat diakses oleh sistem.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1D4137] dark:text-gray-200">Token API (Keamanan Cloud Baku)</label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Tersedia token baku bawaan</span>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={gcfg.apiToken}
                  onChange={(e) => {
                    const updated = { ...gcfg, apiToken: e.target.value };
                    setGcfg(updated);
                    saveGoogleSheetsConfig(updated);
                    setTestResult(null);
                  }}
                  placeholder="Token API keamanan baku..."
                  className="w-full px-3 py-2.5 pr-10 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-[11px] text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title={showToken ? 'Sembunyikan token' : 'Tampilkan token'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#D9E0D4] dark:border-[#2D483F]">
              <div>
                <p className="font-bold text-[#1D4137] dark:text-gray-200">Sinkronisasi Otomatis (Auto-Sync)</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Otomatis push ke Sheets tiap ada data siswa, kasus, konseling, atau absensi yang diubah.
                </p>
              </div>
              <input
                type="checkbox"
                checked={gcfg.autoSync}
                onChange={(e) => {
                  const updated = { ...gcfg, autoSync: e.target.checked };
                  setGcfg(updated);
                  saveGoogleSheetsConfig(updated);
                  if (showToast) showToast(`Auto-sync ${e.target.checked ? 'diaktifkan' : 'dinonaktifkan'}`);
                }}
                className="w-4 h-4 accent-[#2D5F52] cursor-pointer"
              />
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2">
              {onSyncPull && gcfg.appsScriptUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    saveGoogleSheetsConfig(gcfg);
                    if (showToast) showToast('Menyimpan pengaturan & menarik data terdahulu dari Google Sheets...');
                    await onSyncPull();
                  }}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Simpan &amp; Tarik Data Terdahulu</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  saveGoogleSheetsConfig(gcfg);
                  if (showToast) showToast('Pengaturan Google Sheets berhasil disimpan!');
                }}
                className="px-4 py-2 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>

          {/* Bagian Buka di HP / Perangkat Lain (Auto-Connect) */}
          {gcfg.appsScriptUrl && gcfg.appsScriptUrl.includes('/exec') && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                    Buka di HP / Laptop Guru Lain (Auto-Konek)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const shareUrl = getShareableSyncUrl(gcfg.appsScriptUrl, gcfg.apiToken);
                    copyToClipboardSafe(shareUrl, () => {
                      setCopiedShareUrl(true);
                      if (showToast) showToast('Link auto-konek tersalin! Buka di HP untuk langsung terhubung.');
                      setTimeout(() => setCopiedShareUrl(false), 2500);
                    });
                  }}
                  className="px-3 py-1.5 bg-[#2D5F52] hover:bg-[#1D4137] text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copiedShareUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedShareUrl ? 'Link Tersalin!' : 'Salin Link Auto-Konek'}</span>
                </button>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Kirim link ini melalui WhatsApp atau buka di browser HP Anda. Semua data, akun guru, dan logo sekolah akan langsung otomatis termuat di HP tanpa perlu repot mengisi URL Apps Script lagi!
              </p>
            </div>
          )}

          {/* Aksi Sinkronisasi Manual & Test Koneksi */}
          <div className="p-4 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#1D4137] dark:text-gray-200">Aksi Sinkronisasi Manual</p>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Pulihkan atau perbarui data kapan saja</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onSyncPull && (
                <button
                  onClick={async () => {
                    await onSyncPull();
                  }}
                  disabled={isSyncing}
                  className="w-full px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
                  title="Tarik data siswa & catatan terdahulu dari Google Sheets ke aplikasi"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Tarik Data Terdahulu (Pull)</span>
                </button>
              )}
              {onSyncPush && (
                <button
                  onClick={async () => {
                    await onSyncPush();
                  }}
                  disabled={isSyncing}
                  className="w-full px-3.5 py-2.5 bg-[#EFF2EA] dark:bg-[#1A2E27] text-[#1D4137] dark:text-[#6EE7B7] border border-[#D9E0D4] dark:border-[#2D483F] font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Kirim perubahan data dari aplikasi ke Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Kirim Ke Sheets (Push)</span>
                </button>
              )}
            </div>

            <button
              onClick={async () => {
                setTesting(true);
                setTestResult(null);
                const res = await testGoogleSheetsConnection(gcfg.appsScriptUrl, gcfg.apiToken);
                setTesting(false);
                setTestResult(res);
              }}
              disabled={testing}
              className="w-full py-2.5 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-center text-[#2D5F52] dark:text-[#6EE7B7] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-[11px] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Menguji status koneksi...' : 'Uji Status Koneksi Web App'}</span>
            </button>
          </div>

          {/* Panduan Singkat Pemasangan Apps Script */}
          <div className="p-4 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl space-y-2.5 text-[11px]">
            <p className="font-bold text-[#1D4137] dark:text-gray-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Panduan Pemasangan Apps Script di Google Sheets:</span>
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-gray-600 dark:text-gray-300 leading-relaxed">
              <li>Buat <strong>Google Spreadsheet baru</strong> di Google Drive Anda.</li>
              <li>Buka menu <strong>Extensions &gt; Apps Script</strong> di spreadsheet tersebut.</li>
              <li>Hapus semua isi file <code>Code.gs</code>, lalu klik tombol <strong>Salin Code.gs</strong> di bawah dan tempelkan.</li>
              <li>
                Klik <strong>Deploy &gt; New deployment</strong>, pilih jenis <strong>Web app</strong>:
                <ul className="list-disc pl-4 mt-1 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <li>Execute as: <strong>Me (email Anda)</strong></li>
                  <li>Who has access: <strong>Anyone (Siapa saja, wajib!)</strong></li>
                </ul>
              </li>
              <li>Salin <strong>Web app URL</strong> (berakhiran <code>/exec</code>) lalu tempelkan ke kolom URL di atas.</li>
            </ol>
          </div>

          {/* Salin Code.gs */}
          <div className="pt-2 border-t border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-between">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Kode Apps Script Backend (Code.gs)</span>
            <button
              onClick={() => {
                copyToClipboardSafe(GOOGLE_APPS_SCRIPT_CODE, () => {
                  setCopiedCode(true);
                  if (showToast) showToast('Kode Code.gs berhasil disalin ke clipboard!');
                  setTimeout(() => setCopiedCode(false), 2500);
                });
              }}
              className="px-3.5 py-1.5 bg-[#2D5F52] hover:bg-[#1D4137] text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Code.gs'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
