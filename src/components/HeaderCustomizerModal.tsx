import React, { useState, useRef } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Upload,
  Layers,
  School,
  Clock,
  Layout,
  CheckCircle2,
  Trash2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { HeaderCustomConfig, HeaderPattern } from '../types/header';
import {
  HEADER_PRESETS,
  PATTERNS_LIST,
  CURATED_BANNER_IMAGES,
  getPatternSvgDataUri,
  processUploadedImage,
  DEFAULT_HEADER_CONFIG,
} from '../lib/headerTheme';
import { Modal } from './Modal';
import { AnalogClock } from './AnalogClock';
import { useBranding } from '../lib/branding';

interface HeaderCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HeaderCustomConfig;
  onSave: (newConfig: HeaderCustomConfig) => void;
  onReset: () => void;
  showToast?: (msg: string) => void;
  isDark?: boolean;
}

type TabKey = 'presets' | 'custom_color' | 'image' | 'layout';

const QUICK_COLORS = [
  '#1D4137', '#2D5F52', '#0F2B48', '#1E4976',
  '#3B0764', '#581C87', '#422006', '#854D0E',
  '#881337', '#9F1239', '#064E3B', '#047857',
  '#0F172A', '#1E293B', '#1E1B4B', '#312E81',
  '#27272A', '#3F3F46', '#B45309', '#0284C7',
];

export const HeaderCustomizerModal: React.FC<HeaderCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
  showToast,
  isDark = false,
}) => {
  const { branding } = useBranding();
  const [draft, setDraft] = useState<HeaderCustomConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<TabKey>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync draft whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setDraft({ ...config });
    }
  }, [isOpen, config]);

  const categories = ['Semua', 'Khas Sekolah', 'Gradien Modern', 'Elegan & Tenang', 'Warna Berani'];

  const filteredPresets = selectedCategory === 'Semua'
    ? HEADER_PRESETS
    : HEADER_PRESETS.filter((p) => p.category === selectedCategory);

  const handleSelectPreset = (presetId: string) => {
    const preset = HEADER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDraft((prev) => ({
      ...prev,
      type: 'preset',
      presetId: preset.id,
      pattern: preset.pattern || prev.pattern || 'grid',
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUrl = await processUploadedImage(file);
      setDraft((prev) => ({
        ...prev,
        type: 'image',
        imageUrl: dataUrl,
      }));
      if (showToast) showToast('Gambar latar header berhasil diunggah');
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApply = () => {
    onSave(draft);
    onClose();
    if (showToast) showToast('Tampilan latar header berhasil disimpan');
  };

  const handleResetToDefault = () => {
    onReset();
    setDraft({ ...DEFAULT_HEADER_CONFIG });
    onClose();
    if (showToast) showToast('Tampilan latar header dikembalikan ke standar');
  };

  // Compute live preview CSS style for the header container
  const getPreviewHeaderStyle = () => {
    let backgroundStyle = '';

    if (draft.type === 'preset') {
      const preset = HEADER_PRESETS.find((p) => p.id === draft.presetId) || HEADER_PRESETS[0];
      backgroundStyle = isDark ? preset.bgDark : preset.bgLight;
    } else if (draft.type === 'custom_gradient' || draft.type === 'custom_color') {
      const dir = draft.gradientDirection === 'to-r' ? '90deg'
        : draft.gradientDirection === 'to-b' ? '180deg'
        : draft.gradientDirection === 'to-br' ? '135deg'
        : draft.gradientDirection === 'to-tr' ? '45deg'
        : '270deg';
      backgroundStyle = `linear-gradient(${dir}, ${draft.customColor1} 0%, ${draft.customColor2} 100%)`;
    } else if (draft.type === 'image' && draft.imageUrl) {
      backgroundStyle = `url("${draft.imageUrl}") center / cover no-repeat`;
    } else {
      backgroundStyle = 'linear-gradient(135deg, #1D4137 0%, #2D5F52 100%)';
    }

    return {
      background: backgroundStyle,
    };
  };

  const patternDataUri = getPatternSvgDataUri(draft.pattern);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ubah Latar & Tampilan Header"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 text-xs text-[#21322C] dark:text-gray-100">
        {/* Live Header Preview Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#1D4137] dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Langsung (Live Preview)</span>
            </span>
            <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
              {draft.layoutMode === 'banner' ? 'Mode Banner Sekolah Luas' : 'Mode Bilah Standar'}
            </span>
          </div>

          <div
            id="header-live-preview-box"
            className="relative rounded-2xl overflow-hidden shadow-lg border border-white/20 dark:border-black/30 p-4 transition-all duration-300"
            style={getPreviewHeaderStyle()}
          >
            {/* Image Overlay if Type is Image */}
            {draft.type === 'image' && draft.imageUrl && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  backgroundColor: draft.overlayColor,
                  opacity: draft.overlayOpacity,
                }}
              />
            )}

            {/* Pattern Overlay */}
            {patternDataUri && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  backgroundImage: patternDataUri,
                  opacity: draft.patternOpacity,
                }}
              />
            )}

            {/* Glassmorphism Inner Gradient */}
            {draft.glassmorphism && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            )}

            {/* Live Content */}
            <div className="relative z-10 space-y-3 text-white">
              {/* Top Row: Title, Search, Badges */}
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-sm tracking-tight text-white drop-shadow-xs truncate">
                        Dashboard Utama
                      </h4>
                      <p className="text-[10px] text-white/80 drop-shadow-xs truncate">
                        Ringkasan aktivitas bimbingan dan kedisiplinan siswa
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-2.5 py-1 rounded-xl bg-white/20 border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Latar Aktif</span>
                  </div>
                </div>
              </div>

              {/* Banner Identity Row (If Banner Mode is Active) */}
              {draft.layoutMode === 'banner' && (
                <div className="pt-2 border-t border-white/20 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    {branding.schoolLogo && branding.schoolLogo !== branding.appLogo && (
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                        <img
                          src={branding.schoolLogo}
                          alt={branding.schoolName || 'Logo Sekolah'}
                          className="w-full h-full object-contain drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white truncate">
                        {draft.schoolName || 'Media Bantu Guru'}
                      </p>
                      <p className="text-[10px] text-white/80 truncate">
                        {draft.schoolMotto || 'Membimbing • Mencerdaskan • Menginspirasi'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    {draft.showLiveClock && (
                      <AnalogClock size={20} showDigitalText={true} showTimezone={false} />
                    )}
                    {draft.showQuickStats && (
                      <div className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 text-white font-semibold">
                        Siswa Asuh Aktif: <strong>12</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customization Tabs */}
        <div className="flex border-b border-[#D9E0D4] dark:border-[#2D483F] gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'presets'
                ? 'bg-[#2D5F52] text-white shadow-xs'
                : 'text-[#647169] dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema Siap Pakai</span>
          </button>
          <button
            onClick={() => setActiveTab('custom_color')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'custom_color'
                ? 'bg-[#2D5F52] text-white shadow-xs'
                : 'text-[#647169] dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Kustom Warna &amp; Gradien</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'image'
                ? 'bg-[#2D5F52] text-white shadow-xs'
                : 'text-[#647169] dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto / Banner Sekolah</span>
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'layout'
                ? 'bg-[#2D5F52] text-white shadow-xs'
                : 'text-[#647169] dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Identitas &amp; Banner Mode</span>
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#1D4137] dark:bg-[#6EE7B7] text-white dark:text-[#0D201B]'
                      : 'bg-[#EFF2EA] dark:bg-[#12211C] text-[#647169] dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = draft.type === 'preset' && draft.presetId === preset.id;
                const patternUri = getPatternSvgDataUri(preset.pattern || 'grid');

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden group flex flex-col justify-between h-28 shadow-xs ${
                      isSelected
                        ? 'border-[#2D5F52] ring-2 ring-[#2D5F52] shadow-md'
                        : 'border-[#D9E0D4] dark:border-[#2D483F] hover:border-emerald-600/50'
                    }`}
                    style={{
                      background: isDark ? preset.bgDark : preset.bgLight,
                    }}
                  >
                    {/* Pattern Overlay in card */}
                    {patternUri && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-15"
                        style={{ backgroundImage: patternUri }}
                      />
                    )}

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/25 text-white">
                          {preset.category}
                        </span>
                        <h5 className="font-bold text-xs text-white mt-1.5 drop-shadow-xs">
                          {preset.name}
                        </h5>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white text-[#1D4137] flex items-center justify-center font-bold shadow-md shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <p className="relative z-10 text-[10px] text-white/80 line-clamp-2 mt-auto">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Colors & Gradients */}
        {activeTab === 'custom_color' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Color Pickers */}
              <div className="space-y-3 p-4 bg-[#F7F9F6] dark:bg-[#12211C] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F]">
                <h5 className="font-bold text-xs text-[#1D4137] dark:text-gray-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Kombinasi Warna Gradien</span>
                </h5>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      Warna Awal (Color 1)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.customColor1}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            type: 'custom_gradient',
                            customColor1: e.target.value,
                          }))
                        }
                        className="w-9 h-9 rounded-xl cursor-pointer border border-[#D9E0D4] dark:border-[#2D483F] bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={draft.customColor1}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            type: 'custom_gradient',
                            customColor1: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      Warna Akhir (Color 2)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.customColor2}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            type: 'custom_gradient',
                            customColor2: e.target.value,
                          }))
                        }
                        className="w-9 h-9 rounded-xl cursor-pointer border border-[#D9E0D4] dark:border-[#2D483F] bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={draft.customColor2}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            type: 'custom_gradient',
                            customColor2: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Color Palette Samples */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Palet Cepat Favorit
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            type: 'custom_gradient',
                            customColor1: hex,
                          }))
                        }
                        className="w-6 h-6 rounded-lg border border-white/50 shadow-2xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: hex }}
                        title={`Pilih ${hex}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Direction Selector */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Arah Gradien
                  </label>
                  <select
                    value={draft.gradientDirection}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        type: 'custom_gradient',
                        gradientDirection: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs"
                  >
                    <option value="to-r">Horizontal (Kiri → Kanan)</option>
                    <option value="to-br">Diagonal Lembut (Kiri Atas → Kanan Bawah)</option>
                    <option value="to-b">Vertikal (Atas → Bawah)</option>
                    <option value="to-tr">Diagonal Tajam (Kiri Bawah → Kanan Atas)</option>
                    <option value="to-l">Horizontal Terbalik (Kanan → Kiri)</option>
                  </select>
                </div>
              </div>

              {/* Pattern Overlay Selector */}
              <div className="space-y-3 p-4 bg-[#F7F9F6] dark:bg-[#12211C] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F]">
                <h5 className="font-bold text-xs text-[#1D4137] dark:text-gray-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Motif / Tekstur Latar Belakang</span>
                </h5>

                <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {PATTERNS_LIST.map((p) => {
                    const isPatternSelected = draft.pattern === p.id;
                    const pUri = getPatternSvgDataUri(p.id);

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            pattern: p.id,
                          }))
                        }
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                          isPatternSelected
                            ? 'bg-[#2D5F52] text-white border-[#2D5F52] shadow-xs'
                            : 'bg-white dark:bg-[#1A2E27] text-gray-700 dark:text-gray-200 border-[#D9E0D4] dark:border-[#2D483F] hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-lg bg-gray-800 relative overflow-hidden border border-white/20"
                          style={{
                            backgroundImage: pUri || undefined,
                          }}
                        />
                        <span className="truncate w-full">{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Pattern Opacity Slider */}
                {draft.pattern !== 'none' && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">
                        Kepekatan Motif (Opacity)
                      </span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        {Math.round(draft.patternOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.4"
                      step="0.02"
                      value={draft.patternOpacity}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          patternOpacity: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-[#2D5F52] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Custom Banner / Photos */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F7F9F6] dark:bg-[#12211C] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h5 className="font-bold text-xs text-[#1D4137] dark:text-gray-200 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Foto Header Sekolah / Wallpaper Kustom</span>
                  </h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Gunakan foto gerbang sekolah, perpustakaan, atau background visual pilihan Anda.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-2 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Memproses...' : 'Pilih File Gambar'}</span>
                  </button>

                  {draft.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          imageUrl: '',
                          type: 'preset',
                        }))
                      }
                      className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900"
                      title="Hapus Gambar Latar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* URL Input alternative */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  Atau Masukkan URL Gambar (Online Image URL):
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={draft.imageUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      type: 'image',
                      imageUrl: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-mono text-[#1D4137] dark:text-gray-100"
                />
              </div>

              {/* Overlay Darkness & Tint Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#D9E0D4] dark:border-[#2D483F]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Lapisan Gelap (Overlay Darkness)
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      {Math.round(draft.overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={draft.overlayOpacity}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        overlayOpacity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-[#2D5F52] cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">
                    Membantu agar tulisan &amp; tombol tetap jelas terbaca di atas gambar.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Warna Lapisan Gelap (Tint Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.overlayColor}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          overlayColor: e.target.value,
                        }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#D9E0D4] dark:border-[#2D483F] bg-transparent"
                    />
                    <span className="font-mono text-xs">{draft.overlayColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curated Gallery */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-[#1D4137] dark:text-gray-200">
                Pilihan Wallpaper Edukasi Rekomendasi:
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {CURATED_BANNER_IMAGES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        type: 'image',
                        imageUrl: item.url,
                      }))
                    }
                    className={`relative rounded-xl overflow-hidden border h-20 group text-left transition-all ${
                      draft.type === 'image' && draft.imageUrl === item.url
                        ? 'border-[#2D5F52] ring-2 ring-[#2D5F52] shadow-md'
                        : 'border-[#D9E0D4] dark:border-[#2D483F] hover:opacity-90'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                      <span className="text-[10px] font-bold text-white leading-tight truncate">
                        {item.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Layout & School Identity */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Layout Mode Selection */}
              <div className="p-4 bg-[#F7F9F6] dark:bg-[#12211C] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] space-y-3">
                <h5 className="font-bold text-xs text-[#1D4137] dark:text-gray-200 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5" />
                  <span>Format Tata Letak Header</span>
                </h5>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        layoutMode: 'standard',
                      }))
                    }
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      draft.layoutMode === 'standard'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#2D5F52] text-[#1D4137] dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-[#1A2E27] border-[#D9E0D4] dark:border-[#2D483F] text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs">Bilah Standar (Kompak &amp; Rapi)</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                        Bilah menu atas minimalis, fokus pada fungsi dan efisiensi ruang layar.
                      </p>
                    </div>
                    {draft.layoutMode === 'standard' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        layoutMode: 'banner',
                      }))
                    }
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      draft.layoutMode === 'banner'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#2D5F52] text-[#1D4137] dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-[#1A2E27] border-[#D9E0D4] dark:border-[#2D483F] text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs">Banner Sekolah Luas (Elegan &amp; Informatif)</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                        Menampilkan nama instansi/sekolah, motto BK, jam digital, dan lencana statistik.
                      </p>
                    </div>
                    {draft.layoutMode === 'banner' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* School Identity Texts */}
              <div className="p-4 bg-[#F7F9F6] dark:bg-[#12211C] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] space-y-3">
                <h5 className="font-bold text-xs text-[#1D4137] dark:text-gray-200 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" />
                  <span>Identitas Satuan Pendidikan</span>
                </h5>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Nama Sekolah / Instansi
                  </label>
                  <input
                    type="text"
                    value={draft.schoolName}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        schoolName: e.target.value,
                      }))
                    }
                    placeholder="Contoh: SMP Negeri 1 Media Bantu Guru"
                    className="w-full px-3 py-2 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Motto / Keterangan Tambahan
                  </label>
                  <input
                    type="text"
                    value={draft.schoolMotto}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        schoolMotto: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Bimbingan Konseling & Kedisiplinan Siswa"
                    className="w-full px-3 py-2 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Widget Toggles */}
            <div className="p-4 bg-[#F7F9F6] dark:bg-[#12211C] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showLiveClock}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      showLiveClock: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[#2D5F52]"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Jam Digital Realtime
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showQuickStats}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      showQuickStats: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[#2D5F52]"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Lencana Statistik Singkat
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.glassmorphism}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      glassmorphism: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[#2D5F52]"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Efek Kilau Kaca (Glassmorphism)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="pt-4 border-t border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Standar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl transition-colors shadow-md shadow-emerald-900/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
