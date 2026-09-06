import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  School,
  CheckCircle2,
  RotateCcw,
  Save,
  Eye,
  Trash2,
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Link,
  Layers,
  Building,
  GraduationCap,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { UserAccount, PageKey } from '../types';
import { AppBrandingConfig } from '../types/branding';
import {
  useBranding,
  DEFAULT_APP_LOGO,
  DEFAULT_SCHOOL_LOGO,
  processLogoImage,
  removeWhiteBackgroundFromImage,
  DEFAULT_BRANDING_CONFIG
} from '../lib/branding';

interface BrandingViewProps {
  currentUser: UserAccount | null;
  onNavigate: (page: PageKey) => void;
  showToast?: (message: string) => void;
  onSyncPush?: () => Promise<any> | void;
}

export const BrandingView: React.FC<BrandingViewProps> = ({
  currentUser,
  onNavigate,
  showToast,
  onSyncPush,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const { branding, saveFullBranding, resetBranding } = useBranding();

  const [draft, setDraft] = useState<AppBrandingConfig>(() => ({
    ...branding,
    npsn: branding.npsn || '30301234',
    kepsekNama: branding.kepsekNama || localStorage.getItem('mbg_kepsek_nama') || 'H. Ahmad Subarjo, M.Pd',
    kepsekNip: branding.kepsekNip || localStorage.getItem('mbg_kepsek_nip') || '19750312 200212 1 004',
    guruNama: branding.guruNama || localStorage.getItem('mbg_guru_nama') || currentUser?.nama || 'Hj. Siti Rahmah, S.Pd., Kons.',
    guruNip: branding.guruNip || localStorage.getItem('mbg_guru_nip') || currentUser?.nip || '19820514 200604 2 018',
  }));
  const [activeTab, setActiveTab] = useState<'school_profile' | 'school_logo' | 'app_logo' | 'kop_surat' | 'preview'>('school_profile');
  const [isUploadingApp, setIsUploadingApp] = useState(false);
  const [isUploadingSchool, setIsUploadingSchool] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const appFileInputRef = useRef<HTMLInputElement>(null);
  const schoolFileInputRef = useRef<HTMLInputElement>(null);

  // Sync draft when branding updates externally
  React.useEffect(() => {
    setDraft({
      ...branding,
      npsn: branding.npsn || '30301234',
      kepsekNama: branding.kepsekNama || localStorage.getItem('mbg_kepsek_nama') || 'H. Ahmad Subarjo, M.Pd',
      kepsekNip: branding.kepsekNip || localStorage.getItem('mbg_kepsek_nip') || '19750312 200212 1 004',
      guruNama: branding.guruNama || localStorage.getItem('mbg_guru_nama') || currentUser?.nama || 'Hj. Siti Rahmah, S.Pd., Kons.',
      guruNip: branding.guruNip || localStorage.getItem('mbg_guru_nip') || currentUser?.nip || '19820514 200604 2 018',
    });
    setHasChanges(false);
  }, [branding, currentUser]);

  if (!isAdmin) {
    return (
      <div className="p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1D4137] dark:text-gray-100">
            Akses Dibatasi
          </h2>
          <p className="text-sm text-[#4E5E55] dark:text-gray-300">
            Menu <strong>Pengaturan System (Upload Logo & Identitas)</strong> hanya dapat diakses oleh akun dengan peran <strong>Administrator</strong>.
          </p>
        </div>
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D5F52] text-white text-xs font-bold hover:bg-[#1D4137] transition-colors shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const updateDraft = (patch: Partial<AppBrandingConfig>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      setHasChanges(true);
      return next;
    });
  };

  const handleAppLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingApp(true);
      const base64 = await processLogoImage(file, 256);
      updateDraft({ appLogo: base64 });
      showToast?.('Logo aplikasi berhasil dimuat, silakan simpan perubahan.');
    } catch (err: any) {
      showToast?.(err.message || 'Gagal memproses file logo aplikasi');
    } finally {
      setIsUploadingApp(false);
      if (appFileInputRef.current) appFileInputRef.current.value = '';
    }
  };

  const handleSchoolLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingSchool(true);
      const base64 = await processLogoImage(file, 256);
      updateDraft({ schoolLogo: base64 });
      showToast?.('Logo sekolah berhasil dimuat, silakan simpan perubahan.');
    } catch (err: any) {
      showToast?.(err.message || 'Gagal memproses file logo sekolah');
    } finally {
      setIsUploadingSchool(false);
      if (schoolFileInputRef.current) schoolFileInputRef.current.value = '';
    }
  };

  const handleCleanAppLogo = async () => {
    try {
      setIsUploadingApp(true);
      const cleaned = await removeWhiteBackgroundFromImage(draft.appLogo);
      updateDraft({ appLogo: cleaned });
      showToast?.('Background putih logo berhasil dihapus (transparan).');
    } catch (err: any) {
      showToast?.(err.message || 'Gagal menghapus background putih');
    } finally {
      setIsUploadingApp(false);
    }
  };

  const handleCleanSchoolLogo = async () => {
    try {
      setIsUploadingSchool(true);
      const cleaned = await removeWhiteBackgroundFromImage(draft.schoolLogo);
      updateDraft({ schoolLogo: cleaned });
      showToast?.('Background putih logo sekolah berhasil dihapus (transparan).');
    } catch (err: any) {
      showToast?.(err.message || 'Gagal menghapus background putih');
    } finally {
      setIsUploadingSchool(false);
    }
  };

  const handleSave = () => {
    saveFullBranding(draft);
    setHasChanges(false);
    showToast?.('Identitas dan logo berhasil diperbarui di seluruh aplikasi!');
    if (onSyncPush) {
      onSyncPush();
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan semua logo dan identitas ke pengaturan awal default?')) {
      resetBranding();
      setDraft({ ...DEFAULT_BRANDING_CONFIG });
      setHasChanges(false);
      showToast?.('Logo dan identitas telah direset ke default.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Akses Terbatas: Administrator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Menu Pengaturan dan Upload Logo hanya dapat diakses oleh akun dengan peran Administrator.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12201B] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 dark:text-white">
                Profil Sekolah &amp; Identitas Aplikasi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Khusus Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pengaturan nama resmi sekolah, NPSN, pejabat penandatangan (Kepala Sekolah &amp; Guru BK), logo sekolah, logo aplikasi, dan format kop surat secara terpusat.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <span>Reset Bawaan</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 ring-2 ring-emerald-500/50 animate-pulse'
                : 'bg-emerald-600/60 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{hasChanges ? 'Simpan Perubahan' : 'Tersimpan'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-emerald-900/40 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('school_profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'school_profile'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          }`}
        >
          <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>1. Profil &amp; Nama Sekolah</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('school_logo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'school_logo'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>2. Logo Sekolah</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('app_logo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'app_logo'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>3. Logo &amp; Nama Aplikasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kop_surat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'kop_surat'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>4. Identitas &amp; Kop Surat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'preview'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>5. Pratinjau Seluruh Aplikasi</span>
        </button>
      </div>

      {/* TAB 1: PROFIL & NAMA SEKOLAH */}
      {activeTab === 'school_profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Nama & Identitas Utama Sekolah */}
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <School className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Profil &amp; Nama Resmi Sekolah
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                    Wajib &amp; Utama
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Atur nama resmi sekolah yang akan digunakan pada seluruh lembar cetak, kop surat resmi, rekapitulasi piket, absensi &amp; pelanggaran siswa.
                </p>
              </div>

              {/* INPUT NAMA SEKOLAH (Prominent & Clear) */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-500/60 dark:border-emerald-600/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Input Nama Sekolah / Madrasah :</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                    Otomatis Di Semua Cetak
                  </span>
                </div>
                <div className="relative">
                  <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={draft.schoolName}
                    onChange={(e) => updateDraft({ schoolName: e.target.value })}
                    placeholder="Contoh: SMA Negeri 1 Alalak"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                  />
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-tight">
                  Nama ini akan dicetak besar pada judul kop surat dinas dan laporan resmi (contoh: <strong>{draft.schoolName || 'SMA NEGERI 1 ALALAK'}</strong>).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    NPSN (Nomor Pokok Sekolah Nasional):
                  </label>
                  <input
                    type="text"
                    value={draft.npsn || ''}
                    onChange={(e) => updateDraft({ npsn: e.target.value })}
                    placeholder="Contoh: 30301234"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Motto / Slogan Sekolah:
                  </label>
                  <input
                    type="text"
                    value={draft.schoolMotto || ''}
                    onChange={(e) => updateDraft({ schoolMotto: e.target.value })}
                    placeholder="Contoh: Unggul dalam Prestasi, Santun dalam Budi Pekerti"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Instansi Pembina / Dinas Pendidikan (Baris 1 &amp; 2 Kop):
                </label>
                <textarea
                  rows={2}
                  value={draft.kopInstansi}
                  onChange={(e) => updateDraft({ kopInstansi: e.target.value })}
                  placeholder="Contoh: PEMERINTAH PROVINSI KALIMANTAN SELATAN&#10;DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Alamat Lengkap &amp; Kontak Sekolah:
                </label>
                <input
                  type="text"
                  value={draft.kopAlamat}
                  onChange={(e) => updateDraft({ kopAlamat: e.target.value })}
                  placeholder="Contoh: Jl. Trans Kalimantan No. 12, Kec. Alalak, Kab. Barito Kuala"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Card 2: Pejabat Penandatangan Resmi (Kepala Sekolah & Guru BK) */}
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Pejabat Penandatangan Dokumen Resmi
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Data ini otomatis tercetak pada kolom tanda tangan dokumen &amp; laporan resmi (Jurnal Piket, Rekap Terlambat, Rekap Presensi, Laporan BK).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 space-y-3">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block border-b pb-1.5 border-gray-200 dark:border-gray-700">
                    Kepala Sekolah
                  </span>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Nama Kepala Sekolah:
                    </label>
                    <input
                      type="text"
                      value={draft.kepsekNama || ''}
                      onChange={(e) => updateDraft({ kepsekNama: e.target.value })}
                      placeholder="Contoh: H. Ahmad Subarjo, M.Pd"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      NIP Kepala Sekolah:
                    </label>
                    <input
                      type="text"
                      value={draft.kepsekNip || ''}
                      onChange={(e) => updateDraft({ kepsekNip: e.target.value })}
                      placeholder="Contoh: 19750312 200212 1 004"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 space-y-3">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block border-b pb-1.5 border-gray-200 dark:border-gray-700">
                    Guru BK (Bimbingan Konseling)
                  </span>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Nama Guru BK:
                    </label>
                    <input
                      type="text"
                      value={draft.guruNama || ''}
                      onChange={(e) => updateDraft({ guruNama: e.target.value })}
                      placeholder="Contoh: Hj. Siti Rahmah, S.Pd., Kons."
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      NIP Guru BK:
                    </label>
                    <input
                      type="text"
                      value={draft.guruNip || ''}
                      onChange={(e) => updateDraft({ guruNip: e.target.value })}
                      placeholder="Contoh: 19820514 200604 2 018"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Identitas Sekolah */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Kartu Identitas Sekolah
              </h3>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#162B24] dark:to-[#0F1E19] border border-emerald-200 dark:border-emerald-800/60 shadow-xs text-center space-y-3">
                <div className="w-20 h-20 mx-auto p-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xs flex items-center justify-center">
                  <img
                    src={draft.schoolLogo}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-serif font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-wide">
                    {draft.schoolName || 'Nama Sekolah Belum Diisi'}
                  </h4>
                  {draft.npsn && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">
                      NPSN: {draft.npsn}
                    </span>
                  )}
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium italic">
                    "{draft.schoolMotto || 'Bimbingan Konseling & Kedisiplinan Siswa'}"
                  </p>
                </div>
                <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed text-left space-y-1">
                  <p className="line-clamp-2">📍 {draft.kopAlamat || 'Alamat sekolah belum diatur'}</p>
                  <p>🏛️ {draft.kopInstansi ? draft.kopInstansi.split('\n')[0] : 'Dinas Pendidikan'}</p>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('school_logo')}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Ganti / Upload Logo Sekolah
                  </span>
                  <span>&rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('kop_surat')}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Atur Kop Surat &amp; Format Cetak
                  </span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: UPLOAD LOGO APLIKASI */}
      {activeTab === 'app_logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Unggah Logo Aplikasi Baru
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Logo ini ditampilkan di bilah navigasi samping (Sidebar), layar masuk (Login), tab peramban (Favicon), dan dokumen resmi.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => appFileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 transition-all group"
              >
                <input
                  ref={appFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleAppLogoFile}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isUploadingApp ? 'Memproses gambar...' : 'Klik untuk Pilih File atau Seret ke Sini'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mendukung format PNG (transparan direkomendasikan), JPG, WebP, atau SVG (Maks. 5 MB)
                </p>
              </div>

              {/* URL Input Alternative */}
              <div className="pt-2 border-t border-gray-100 dark:border-emerald-900/30">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-emerald-600" />
                  Atau masukkan URL gambar logo:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={draft.appLogo.startsWith('data:') ? '' : draft.appLogo}
                    placeholder="https://example.com/logo-aplikasi.png"
                    onChange={(e) => updateDraft({ appLogo: e.target.value || DEFAULT_APP_LOGO })}
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  {draft.appLogo !== DEFAULT_APP_LOGO && (
                    <button
                      type="button"
                      onClick={() => updateDraft({ appLogo: DEFAULT_APP_LOGO })}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1"
                      title="Kembalikan ke logo bawaan"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Default
                    </button>
                  )}
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-emerald-900/30">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nama Aplikasi:
                  </label>
                  <input
                    type="text"
                    value={draft.appName}
                    onChange={(e) => updateDraft({ appName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tagline / Subtitle:
                  </label>
                  <input
                    type="text"
                    value={draft.appTagline}
                    onChange={(e) => updateDraft({ appTagline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Pratinjau Logo Aplikasi
              </h3>

              {/* Large Display */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-gray-50/60 to-gray-100/60 dark:from-gray-900/60 dark:to-gray-950/60 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 flex items-center justify-center mb-3">
                  <img
                    src={draft.appLogo}
                    alt="Pratinjau Logo Aplikasi"
                    className="w-full h-full object-contain drop-shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="font-serif font-bold text-base text-gray-900 dark:text-white">
                  {draft.appName || 'Media Bantu Guru'}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {draft.appMotto || 'Membimbing • Mencerdaskan • Menginspirasi'}
                </p>
                <button
                  type="button"
                  onClick={handleCleanAppLogo}
                  disabled={isUploadingApp}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
                  title="Hapus background putih pada logo sehingga menjadi transparan"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {isUploadingApp ? 'Memproses...' : 'Hapus Background Putih (Transparan)'}
                </button>
              </div>

              {/* Sidebar Miniature Simulation */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-emerald-900/30">
                <p className="text-xs font-semibold text-gray-500 mb-2">Simulasi pada Sidebar Navigasi:</p>
                <div className="p-3 rounded-xl bg-[#1D4137] text-white flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center shrink-0">
                    <img
                      src={draft.appLogo}
                      alt="Logo"
                      className="w-full h-full object-contain drop-shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-xs text-white leading-tight">
                      {draft.appName}
                    </p>
                    <p className="text-[10px] text-emerald-300/80">
                      {draft.appTagline}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD LOGO SEKOLAH */}
      {activeTab === 'school_logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-600" />
                  Unggah Logo Sekolah / Instansi
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Logo ini ditampilkan di banner atas (Topbar), kartu identitas sekolah, dan kop surat cetak dokumen piket serta laporan BK.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => schoolFileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 dark:border-teal-700/60 hover:border-teal-500 rounded-2xl p-8 text-center cursor-pointer bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/80 transition-all group"
              >
                <input
                  ref={schoolFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleSchoolLogoFile}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <School className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isUploadingSchool ? 'Memproses gambar...' : 'Klik untuk Pilih Logo Sekolah'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mendukung PNG (transparan sangat disarankan), JPG, WebP, atau SVG
                </p>
              </div>

              {/* URL Input Alternative */}
              <div className="pt-2 border-t border-gray-100 dark:border-emerald-900/30">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-teal-600" />
                  Atau masukkan URL logo sekolah:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={draft.schoolLogo.startsWith('data:') ? '' : draft.schoolLogo}
                    placeholder="https://example.com/logo-sekolah.png"
                    onChange={(e) => updateDraft({ schoolLogo: e.target.value || DEFAULT_SCHOOL_LOGO })}
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                  {draft.schoolLogo !== DEFAULT_SCHOOL_LOGO && (
                    <button
                      type="button"
                      onClick={() => updateDraft({ schoolLogo: DEFAULT_SCHOOL_LOGO })}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1"
                      title="Kembalikan ke logo bawaan"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Default
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Sync with App Logo button */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs">
                <span className="text-gray-700 dark:text-gray-300">
                  Gunakan logo yang sama persis dengan Logo Aplikasi?
                </span>
                <button
                  type="button"
                  onClick={() => updateDraft({ schoolLogo: draft.appLogo })}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-200 transition-colors"
                >
                  Samakan Logo
                </button>
              </div>

              {/* School Details */}
              <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-emerald-900/30">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nama Sekolah / Madrasah:
                  </label>
                  <input
                    type="text"
                    value={draft.schoolName}
                    onChange={(e) => updateDraft({ schoolName: e.target.value })}
                    placeholder="Contoh: SMA Negeri 1 Alalak"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Motto / Visi Sekolah:
                  </label>
                  <input
                    type="text"
                    value={draft.schoolMotto}
                    onChange={(e) => updateDraft({ schoolMotto: e.target.value })}
                    placeholder="Contoh: Bimbingan Konseling & Kedisiplinan Siswa"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                Pratinjau Logo Sekolah
              </h3>

              {/* Large Display */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-teal-50/50 to-emerald-50/50 dark:from-gray-900 dark:to-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 p-1 flex items-center justify-center mb-3">
                  <img
                    src={draft.schoolLogo}
                    alt="Pratinjau Logo Sekolah"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="font-serif font-bold text-base text-gray-900 dark:text-white">
                  {draft.schoolName || 'Nama Sekolah'}
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                  {draft.schoolMotto || 'Bimbingan Konseling & Kedisiplinan Siswa'}
                </p>
                <button
                  type="button"
                  onClick={handleCleanSchoolLogo}
                  disabled={isUploadingSchool}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-colors shadow-2xs"
                  title="Hapus background putih pada logo sekolah sehingga menjadi transparan"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  {isUploadingSchool ? 'Memproses...' : 'Hapus Background Putih (Transparan)'}
                </button>
              </div>

              {/* Topbar Simulation */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-emerald-900/30">
                <p className="text-xs font-semibold text-gray-500 mb-2">Simulasi pada Header Topbar:</p>
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#1D4137] to-[#2D5F52] text-white flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center shrink-0">
                    <img
                      src={draft.schoolLogo}
                      alt="Logo Sekolah"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white leading-tight">
                      {draft.schoolName}
                    </p>
                    <p className="text-[10px] text-white/80">
                      {draft.schoolMotto}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IDENTITAS & KOP SURAT */}
      {activeTab === 'kop_surat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Format Kop Surat Resmi Dokumen
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Atur teks resmi instansi pembina, dinas pendidikan, alamat sekolah, dan preferensi penempatan logo pada dokumen cetak / PDF.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Instansi Induk / Dinas Pendidikan (Baris 1 &amp; 2 Kop):
                  </label>
                  <textarea
                    rows={2}
                    value={draft.kopInstansi}
                    onChange={(e) => updateDraft({ kopInstansi: e.target.value })}
                    placeholder="Contoh: PEMERINTAH PROVINSI KALIMANTAN SELATAN&#10;DINAS PENDIDIKAN DAN KEBUDAYAAN"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Alamat Lengkap &amp; Kontak Sekolah (Baris Bawah Kop):
                  </label>
                  <input
                    type="text"
                    value={draft.kopAlamat}
                    onChange={(e) => updateDraft({ kopAlamat: e.target.value })}
                    placeholder="Contoh: Jl. Trans Kalimantan No. 12, Barito Kuala • Email: sman1alalak@sch.id"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-emerald-900/30 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draft.showLogoOnPrint}
                      onChange={(e) => updateDraft({ showLogoOnPrint: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Tampilkan Logo pada Dokumen Cetak / Kop Surat
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {draft.showLogoOnPrint
                          ? 'Aktif: Logo ditampilkan di kop surat cetak.'
                          : 'Nonaktif: Logo dihapus dari surat. Kop surat dicetak bersih tanpa gambar logo.'}
                      </p>
                    </div>
                  </label>

                  {draft.showLogoOnPrint && (
                    <label className="flex items-center gap-3 cursor-pointer select-none pl-7">
                      <input
                        type="checkbox"
                        checked={draft.showBothLogosOnPrint}
                        onChange={(e) => updateDraft({ showBothLogosOnPrint: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Tampilkan Kedua Logo (Logo Sekolah di Kiri &amp; Logo Aplikasi di Kanan)
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Jika dinonaktifkan, hanya logo sekolah yang akan ditampilkan di sebelah kiri kop surat.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Kop Surat Mockup */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Simulasi Kop Surat Resmi
              </h3>

              {/* Paper Sheet Preview */}
              <div className="bg-white text-gray-900 p-5 rounded-xl border border-gray-300 shadow-sm font-serif">
                <div className="flex flex-col items-center justify-center border-b-2 border-black pb-3 mb-3 text-center">
                  <p className="text-[9px] font-bold uppercase leading-tight tracking-wider text-gray-800 whitespace-pre-line mb-1">
                    {draft.kopInstansi}
                  </p>

                  {/* Logo Sekolah di atas Nama Sekolah */}
                  {draft.showLogoOnPrint && (
                    <div className="w-12 h-12 my-1 p-0.5 flex items-center justify-center">
                      <img
                        src={draft.schoolLogo}
                        alt="Logo Sekolah"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-black mt-0.5">
                    {draft.schoolName}
                  </h4>
                  <p className="text-[8px] text-gray-700 italic mt-0.5">
                    {draft.kopAlamat}
                  </p>
                </div>

                {/* Dummy Document Title */}
                <div className="text-center my-3">
                  <p className="text-[10px] font-bold underline uppercase">
                    LAPORAN REKAPITULASI BIMBINGAN DAN KONSELING
                  </p>
                  <p className="text-[8px] text-gray-600">Semester Ganjil • Tahun Ajaran 2026/2027</p>
                </div>

                <div className="space-y-1.5 opacity-60">
                  <div className="h-2 bg-gray-200 rounded-sm w-full" />
                  <div className="h-2 bg-gray-200 rounded-sm w-5/6" />
                  <div className="h-2 bg-gray-200 rounded-sm w-4/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRATINJAU SELURUH APLIKASI */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#12201B] p-6 rounded-2xl border border-gray-200 dark:border-emerald-900/40 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              Pratinjau Sinkronisasi Visual Aplikasi
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
              Berikut adalah simulasi bagaimana kedua logo baru Anda akan terlihat di seluruh titik kontak aplikasi saat disimpan.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Sidebar Nav */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">1. Bilah Samping (Sidebar)</span>
                <div className="bg-[#1D4137] p-4 rounded-xl text-white flex items-center gap-3">
                  <div className="w-11 h-11 flex items-center justify-center shrink-0">
                    <img
                      src={draft.appLogo}
                      alt="Logo"
                      className="w-full h-full object-contain drop-shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white">{draft.appName}</h4>
                    <p className="text-xs text-emerald-300/80">{draft.appTagline}</p>
                  </div>
                </div>
              </div>

              {/* 2. Topbar Banner */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">2. Banner Header Topbar</span>
                <div className="bg-gradient-to-r from-[#1D4137] via-[#2D5F52] to-[#3A7263] p-4 rounded-xl text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <img
                        src={draft.schoolLogo}
                        alt="Logo Sekolah"
                        className="w-full h-full object-contain drop-shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{draft.schoolName}</h4>
                      <p className="text-[10px] text-emerald-200/90 truncate">{draft.schoolMotto}</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-black/30 text-white font-mono text-[10px] shrink-0 font-semibold">
                    12:30:00 WIB
                  </div>
                </div>
              </div>

              {/* 3. Login Card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">3. Layar Masuk (Login Card)</span>
                <div className="bg-gradient-to-br from-[#122A23] to-[#1D4137] p-5 rounded-xl text-white flex items-center gap-3.5 border border-emerald-800/40">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <img
                      src={draft.appLogo}
                      alt="Logo Login"
                      className="w-full h-full object-contain drop-shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-amber-100">{draft.appName}</h4>
                    <p className="text-[11px] text-emerald-300/80">{draft.appMotto}</p>
                  </div>
                </div>
              </div>

              {/* 4. Kop Surat PDF */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">4. Kop Dokumen Resmi (Cetak / PDF)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    draft.showLogoOnPrint
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {draft.showLogoOnPrint ? 'Dengan Logo' : 'Tanpa Logo (Bersih)'}
                  </span>
                </div>
                <div className="bg-white text-gray-900 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                  {draft.showLogoOnPrint && (
                    <div className="w-10 h-10 mb-1 flex items-center justify-center">
                      <img
                        src={draft.schoolLogo}
                        alt="Logo Sekolah"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <p className="text-[8px] font-bold uppercase text-gray-700 leading-tight">DINAS PENDIDIKAN</p>
                  <p className="text-[10px] font-bold uppercase text-black">{draft.schoolName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
