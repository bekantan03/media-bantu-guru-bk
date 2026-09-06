import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  School,
  Save,
  RotateCcw,
  Sparkles,
  Link,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Modal } from './Modal';
import { AppBrandingConfig } from '../types/branding';
import {
  useBranding,
  DEFAULT_APP_LOGO,
  DEFAULT_SCHOOL_LOGO,
  processLogoImage,
  DEFAULT_BRANDING_CONFIG
} from '../lib/branding';

interface BrandingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string) => void;
}

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { branding, saveFullBranding, resetBranding } = useBranding();
  const [draft, setDraft] = useState<AppBrandingConfig>({ ...branding });
  const [tab, setTab] = useState<'app' | 'school'>('app');
  const [isUploading, setIsUploading] = useState(false);

  const appInputRef = useRef<HTMLInputElement>(null);
  const schoolInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft({ ...branding });
    }
  }, [isOpen, branding]);

  const handleAppUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const b64 = await processLogoImage(file, 512);
      setDraft((prev) => ({ ...prev, appLogo: b64 }));
      showToast?.('Logo aplikasi berhasil dimuat');
    } catch (err: any) {
      showToast?.(err.message || 'Gagal memproses gambar');
    } finally {
      setIsUploading(false);
      if (appInputRef.current) appInputRef.current.value = '';
    }
  };

  const handleSchoolUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const b64 = await processLogoImage(file, 512);
      setDraft((prev) => ({ ...prev, schoolLogo: b64 }));
      showToast?.('Logo sekolah berhasil dimuat');
    } catch (err: any) {
      showToast?.(err.message || 'Gagal memproses gambar');
    } finally {
      setIsUploading(false);
      if (schoolInputRef.current) schoolInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    saveFullBranding(draft);
    showToast?.('Logo dan identitas berhasil disimpan!');
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset semua logo ke bawaan awal?')) {
      resetBranding();
      setDraft({ ...DEFAULT_BRANDING_CONFIG });
      showToast?.('Logo direset ke default');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Logo Sekolah &amp; Aplikasi (Admin)" size="lg">
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-emerald-900/40 gap-2">
          <button
            type="button"
            onClick={() => setTab('app')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              tab === 'app'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Logo Aplikasi
          </button>
          <button
            type="button"
            onClick={() => setTab('school')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              tab === 'school'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <School className="w-4 h-4" />
            Logo Sekolah / Instansi
          </button>
        </div>

        {tab === 'app' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <img
                  src={draft.appLogo}
                  alt="App Logo"
                  className="w-full h-full object-contain drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Logo Aplikasi Aktif</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Ditampilkan di Sidebar, Login, Tab Browser (Favicon), dan Kop Dokumen.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => appInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Memproses...' : 'Upload Logo Baru'}
                  </button>
                  {draft.appLogo !== DEFAULT_APP_LOGO && (
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, appLogo: DEFAULT_APP_LOGO }))}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 text-xs font-medium"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
                <input
                  ref={appInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleAppUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nama Aplikasi:
                </label>
                <input
                  type="text"
                  value={draft.appName}
                  onChange={(e) => setDraft((p) => ({ ...p, appName: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Motto Aplikasi:
                </label>
                <input
                  type="text"
                  value={draft.appMotto}
                  onChange={(e) => setDraft((p) => ({ ...p, appMotto: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <img
                  src={draft.schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Logo Sekolah / Instansi</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Ditampilkan di Banner Header Topbar dan Kop Surat Laporan BK / Jurnal Piket.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => schoolInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Memproses...' : 'Upload Logo Sekolah'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, schoolLogo: p.appLogo }))}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 text-xs font-medium"
                  >
                    Samakan dgn Logo App
                  </button>
                </div>
                <input
                  ref={schoolInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleSchoolUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nama Sekolah:
                </label>
                <input
                  type="text"
                  value={draft.schoolName}
                  onChange={(e) => setDraft((p) => ({ ...p, schoolName: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Motto / Visi Sekolah:
                </label>
                <input
                  type="text"
                  value={draft.schoolMotto}
                  onChange={(e) => setDraft((p) => ({ ...p, schoolMotto: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-emerald-900/40">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Bawaan
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Simpan Logo
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
