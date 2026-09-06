import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Star,
  AlertTriangle,
  MessageSquare,
  Clock,
  Printer,
  Calendar as CalendarIcon,
  CheckCircle2,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  Search,
  X,
  User,
  ArrowRight,
  Filter,
  Sparkles,
  GraduationCap,
  Layers,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  Database,
  Check,
  Gem,
  Landmark,
  FileCheck2,
  UserX,
  School,
  UserCog,
} from 'lucide-react';
import kalselBanuaPanorama from '../assets/images/kalsel_banua_panorama_1788537768915.jpg';
import { SasiranganRibbon, KalselHeritageModal } from '../components/KalselAccents';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Siswa, Kasus, Konseling, Jadwal, Terlambat, Absensi, PageKey } from '../types';
import { todayISO, fmtDateFull, fmtDate, thisMonthKey, BULAN, initials, currentTahunAjaran, currentSemester } from '../lib/storage';

interface DashboardViewProps {
  siswaList: Siswa[];
  kasusList: Kasus[];
  konselingList: Konseling[];
  jadwalList: Jadwal[];
  terlambatList: Terlambat[];
  absensiList: Absensi[];
  onNavigate: (page: PageKey, params?: any) => void;
}

// Helper to parse dates in various formats (ISO, slash, dash, timestamp)
export function parseRecordDate(dateStr?: string | null): { iso: string; year: number; month: number; day: number; ta: number; semester: 'ganjil' | 'genap' } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (!clean) return null;

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ta = month >= 7 ? year : year - 1;
    const semester: 'ganjil' | 'genap' = month >= 7 ? 'ganjil' : 'genap';
    return { iso, year, month, day, ta, semester };
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ta = month >= 7 ? year : year - 1;
    const semester: 'ganjil' | 'genap' = month >= 7 ? 'ganjil' : 'genap';
    return { iso, year, month, day, ta, semester };
  }

  // Fallback to Date.parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ta = month >= 7 ? year : year - 1;
    const semester: 'ganjil' | 'genap' = month >= 7 ? 'ganjil' : 'genap';
    return { iso, year, month, day, ta, semester };
  }

  return null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  siswaList,
  kasusList,
  konselingList,
  jadwalList,
  terlambatList,
  absensiList,
  onNavigate,
}) => {
  const mKey = thisMonthKey();
  const activeSiswa = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');
  const siswaAsuhCount = activeSiswa.filter((s) => s.asuh).length;

  const kasusBulanIni = kasusList.filter((k) => k.tanggal && k.tanggal.startsWith(mKey));
  const konselingBulanIni = konselingList.filter((c) => c.tanggal && c.tanggal.startsWith(mKey));
  const terlambatBulanIni = terlambatList.filter((t) => t.tanggal && t.tanggal.startsWith(mKey));

  const ringan = kasusBulanIni.filter((k) => k.jenis === 'ringan').length;
  const sedang = kasusBulanIni.filter((k) => k.jenis === 'sedang').length;
  const berat = kasusBulanIni.filter((k) => k.jenis === 'berat').length;

  // 1 Semester & Multi-Period Dynamic Data Synchronization
  const curTa = currentTahunAjaran();
  const curSem = currentSemester();

  // Extract all academic years from all available records
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([curTa, curTa - 1, curTa + 1]);

    const inspectList = (list: { tanggal?: string }[]) => {
      list.forEach((item) => {
        const p = parseRecordDate(item.tanggal);
        if (p) yearsSet.add(p.ta);
      });
    };

    inspectList(kasusList);
    inspectList(terlambatList);
    inspectList(konselingList);
    inspectList(absensiList);

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [kasusList, terlambatList, konselingList, absensiList, curTa]);

  // Find the most recent record period across all lists to detect actual existing data
  const latestRecordPeriod = useMemo(() => {
    let latestIso = '';
    let latestTa = curTa;
    let latestSem: 'ganjil' | 'genap' = curSem;

    const checkItem = (item: { tanggal?: string }) => {
      const p = parseRecordDate(item.tanggal);
      if (p && p.iso > latestIso) {
        latestIso = p.iso;
        latestTa = p.ta;
        latestSem = p.semester;
      }
    };

    kasusList.forEach(checkItem);
    terlambatList.forEach(checkItem);
    konselingList.forEach(checkItem);

    return latestIso ? { ta: latestTa, sem: latestSem, iso: latestIso } : null;
  }, [kasusList, terlambatList, konselingList, curTa, curSem]);

  // Scope filter: 'ganjil' | 'genap' | 'tahun' | 'semua'
  const [scopeMode, setScopeMode] = useState<'ganjil' | 'genap' | 'tahun' | 'semua'>('ganjil');
  const [selectedTa, setSelectedTa] = useState<number>(() => {
    // If current academic year has no records but latest record does, initialize with it
    return latestRecordPeriod?.ta || curTa;
  });
  const [chartScope, setChartScope] = useState<'bulan' | 'semester' | 'semua'>('semester');
  const [syncNoticeDismissed, setSyncNoticeDismissed] = useState(false);

  // Auto-sync with existing data if current selection has zero items
  useEffect(() => {
    if (latestRecordPeriod) {
      const countInCurrentSelection =
        kasusList.filter((k) => {
          const p = parseRecordDate(k.tanggal);
          return p && p.ta === selectedTa && (scopeMode === 'semua' || scopeMode === 'tahun' || p.semester === scopeMode);
        }).length +
        terlambatList.filter((t) => {
          const p = parseRecordDate(t.tanggal);
          return p && p.ta === selectedTa && (scopeMode === 'semua' || scopeMode === 'tahun' || p.semester === scopeMode);
        }).length +
        konselingList.filter((c) => {
          const p = parseRecordDate(c.tanggal);
          return p && p.ta === selectedTa && (scopeMode === 'semua' || scopeMode === 'tahun' || p.semester === scopeMode);
        }).length;

      // If current selection is empty but data exists elsewhere, auto-sync to the latest available data period
      if (countInCurrentSelection === 0 && (kasusList.length > 0 || terlambatList.length > 0 || konselingList.length > 0)) {
        setSelectedTa(latestRecordPeriod.ta);
        setScopeMode(latestRecordPeriod.sem);
      }
    }
  }, [kasusList.length, terlambatList.length, konselingList.length, latestRecordPeriod]);

  // Matches record against currently selected period
  const matchesPeriod = useCallback((rawDate?: string) => {
    if (!rawDate) return false;
    const p = parseRecordDate(rawDate);
    if (!p) return false;

    if (scopeMode === 'semua') return true;
    if (p.ta !== selectedTa) return false;
    if (scopeMode === 'tahun') return true;
    return p.semester === scopeMode;
  }, [scopeMode, selectedTa]);

  // Synchronized dataset based on selected period
  const kasusSemester = useMemo(() => {
    return kasusList.filter((k) => matchesPeriod(k.tanggal));
  }, [kasusList, matchesPeriod]);

  const terlambatSemester = useMemo(() => {
    return terlambatList.filter((t) => matchesPeriod(t.tanggal));
  }, [terlambatList, matchesPeriod]);

  const konselingSemester = useMemo(() => {
    return konselingList.filter((c) => matchesPeriod(c.tanggal));
  }, [konselingList, matchesPeriod]);

  // Descriptive text for current scope
  const isCurrentActiveSemester = scopeMode === curSem && selectedTa === curTa;
  const semLabel = useMemo(() => {
    if (scopeMode === 'semua') return 'Semua Data';
    if (scopeMode === 'tahun') return `1 Tahun Ajaran (${selectedTa}/${selectedTa + 1})`;
    return scopeMode === 'ganjil' ? 'Semester Ganjil' : 'Semester Genap';
  }, [scopeMode, selectedTa]);

  const semPeriodText = useMemo(() => {
    if (scopeMode === 'semua') return 'akumulasi seluruh data kedisiplinan dan bimbingan konseling yang tersimpan di sistem';
    if (scopeMode === 'tahun') return `Juli ${selectedTa} – Juni ${selectedTa + 1} (T.A. ${selectedTa}/${selectedTa + 1})`;
    return scopeMode === 'ganjil'
      ? `Juli – Desember ${selectedTa} (T.A. ${selectedTa}/${selectedTa + 1})`
      : `Januari – Juni ${selectedTa + 1} (T.A. ${selectedTa}/${selectedTa + 1})`;
  }, [scopeMode, selectedTa]);

  // Semester Metrics Breakdown
  const kasusSemRingan = kasusSemester.filter((k) => k.jenis === 'ringan').length;
  const kasusSemSedang = kasusSemester.filter((k) => k.jenis === 'sedang').length;
  const kasusSemBerat = kasusSemester.filter((k) => k.jenis === 'berat').length;
  const kasusSemPoin = kasusSemester.reduce((acc, k) => acc + (Number(k.poin) || 0), 0);
  const siswaKasusSemCount = new Set(kasusSemester.map((k) => k.siswaId).filter(Boolean)).size;

  const terlambatSemCount = terlambatSemester.length;
  const siswaTerlambatSemCount = new Set(terlambatSemester.map((t) => t.siswaId).filter(Boolean)).size;
  const totalMenitTerlambatSem = terlambatSemester.reduce((acc, t) => acc + (Number(t.menit) || 0), 0);

  const konselingSemCount = konselingSemester.length;
  const konselingSemIndividu = konselingSemester.filter((c) => c.jenis === 'individu').length;
  const konselingSemKelompok = konselingSemester.filter((c) => c.jenis === 'kelompok').length;
  const konselingSemKlasikal = konselingSemester.filter((c) => c.jenis === 'klasikal').length;
  const siswaKonselingSemCount = new Set(konselingSemester.map((c) => c.siswaId || c.siswaNama).filter(Boolean)).size;

  // Recharts Data 1: Kasus Breakdown Pie Data (Monthly vs Semester vs All-time)
  const kasusPieData = useMemo(() => [
    { name: 'Ringan', value: ringan, color: '#4C8C6B' },
    { name: 'Sedang', value: sedang, color: '#C9862E' },
    { name: 'Berat', value: berat, color: '#B5473A' },
  ], [ringan, sedang, berat]);

  const activeKasusPieData = useMemo(() => {
    if (chartScope === 'semua') {
      const allRingan = kasusList.filter((k) => k.jenis === 'ringan').length;
      const allSedang = kasusList.filter((k) => k.jenis === 'sedang').length;
      const allBerat = kasusList.filter((k) => k.jenis === 'berat').length;
      return [
        { name: 'Ringan', value: allRingan, color: '#4C8C6B' },
        { name: 'Sedang', value: allSedang, color: '#C9862E' },
        { name: 'Berat', value: allBerat, color: '#B5473A' },
      ];
    }
    if (chartScope === 'semester') {
      return [
        { name: 'Ringan', value: kasusSemRingan, color: '#4C8C6B' },
        { name: 'Sedang', value: kasusSemSedang, color: '#C9862E' },
        { name: 'Berat', value: kasusSemBerat, color: '#B5473A' },
      ];
    }
    return kasusPieData;
  }, [chartScope, kasusSemRingan, kasusSemSedang, kasusSemBerat, kasusPieData, kasusList]);

  // Recharts Data 2: Last 7 Days Discipline & Attendance Trend Data
  const weeklyTrendData = useMemo(() => {
    const data = [];
    const todayObj = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayObj);
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      const countKasus = kasusList.filter((k) => k.tanggal === iso).length;
      const countTerlambat = terlambatList.filter((t) => t.tanggal === iso).length;
      const countAlpa = absensiList.filter((a) => a.tanggal === iso && a.status === 'alpa').length;
      const countIzinSakit = absensiList.filter((a) => a.tanggal === iso && (a.status === 'sakit' || a.status === 'izin')).length;

      data.push({
        tanggal: dayLabel,
        'Kasus': countKasus,
        'Terlambat': countTerlambat,
        'Alpa': countAlpa,
        'Sakit/Izin': countIzinSakit,
      });
    }
    return data;
  }, [kasusList, terlambatList, absensiList]);

  const today = todayISO();
  const jadwalHariIni = jadwalList
    .filter((j) => j.tanggal === today)
    .sort((a,b) => (a.jam || '').localeCompare(b.jam || ''));

  const absensiHariIni = absensiList.filter((a) => a.tanggal === today);
  const rekapAbsensi = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  absensiHariIni.forEach((a) => {
    if (rekapAbsensi[a.status] !== undefined) rekapAbsensi[a.status]++;
  });

  const getPoinSiswa = (id: string) =>
    kasusList.filter((k) => k.siswaId === id).reduce((sum, k) => sum + (k.poin || 0), 0);

  const topPoinSiswa = activeSiswa
    .map((s) => ({ siswa: s, poin: getPoinSiswa(s.id) }))
    .filter((x) => x.poin > 0)
    .sort((a, b) => b.poin - a.poin)
    .slice(0, 5);

  const recentKasus = [...kasusList]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 5);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredSiswa = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    
    return siswaList.filter((s) => {
      const matchNama = (s.nama || '').toLowerCase().includes(q);
      const matchNis = (s.nis || '').toLowerCase().includes(q);
      const matchNisn = ((s as any).nisn || '').toLowerCase().includes(q);
      const matchKelas = (s.kelas || '').toLowerCase().includes(q);
      return matchNama || matchNis || matchNisn || matchKelas;
    });
  }, [siswaList, searchQuery]);

  const [isKalselModalOpen, setIsKalselModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Modal Dialog Filosofi Banua Kalsel */}
      <KalselHeritageModal
        isOpen={isKalselModalOpen}
        onClose={() => setIsKalselModalOpen(false)}
      />

      {/* Hero Banner Nuansa Khas Kalimantan Selatan */}
      <div className="relative rounded-3xl overflow-hidden shadow-sm border border-[#D9E0D4] dark:border-[#2D483F] bg-gradient-to-r from-[#142D26] via-[#1A3F34] to-[#12241F] text-white">
        {/* Background Panorama Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay transition-transform duration-700 hover:scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${kalselBanuaPanorama})` }}
        />
        {/* Scrim Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E201B]/95 via-[#143229]/80 to-[#10251F]/90 pointer-events-none" />

        {/* Top Sasirangan Ribbon Accent */}
        <SasiranganRibbon className="relative z-10" />

        <div className="relative z-10 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Gem className="w-3 h-3 text-amber-400" />
                Bumi Antasari &bull; Kalimantan Selatan
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-200/90 italic">
                &ldquo;Haram Manyarah Waja Sampai Kaputing&rdquo;
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight">
              Portal Bimbingan Konseling &amp; Kedisiplinan Siswa
            </h2>
            <p className="text-xs text-emerald-100/85 leading-relaxed">
              Meneladani keuletan intan Martapura serta kearifan budaya Banua dalam membina budi pekerti dan mengantarkan generasi masa depan dengan kebersamaan <span className="font-semibold text-amber-300 italic">Kayuh Baimbai</span>.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsKalselModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold transition-all shadow-xs cursor-pointer group"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Filosofi Banua</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* Minimalist Quick Student Search Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Cari Cepat Siswa (Nama, NIS, atau Kelas)..."
            className="w-full bg-white dark:bg-[#1A2E27] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-11 pr-10 py-2.5 sm:py-3 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] focus:border-[#2D5F52] dark:focus:border-[#6EE7B7] focus:ring-2 focus:ring-[#2D5F52]/20 focus:outline-none text-xs sm:text-sm font-medium shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Hapus kata kunci"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown when typing */}
        <AnimatePresence>
          {searchQuery.trim() !== '' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1A2E27] text-[#1D4137] dark:text-gray-100 rounded-2xl p-4 shadow-2xl border border-[#D9E0D4] dark:border-[#2D483F] space-y-3 max-h-[420px] overflow-y-auto z-40"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-xs font-bold text-[#1D4137] dark:text-[#6EE7B7] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Hasil Pencarian Siswa ({filteredSiswa.length})
                </span>
                <span className="text-[11px] text-[#647169] dark:text-gray-400">
                  Klik kartu untuk profil lengkap
                </span>
              </div>

              {filteredSiswa.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Siswa tidak ditemukan</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tidak ada siswa yang cocok dengan &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {filteredSiswa.slice(0, 8).map((s) => {
                    const poin = getPoinSiswa(s.id);
                    const countTerlambat = terlambatList.filter((t) => t.siswaId === s.id).length;
                    const countKonseling = konselingList.filter((c) => c.siswaId === s.id).length;

                    return (
                      <div
                        key={s.id}
                        className="py-2.5 px-2 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 rounded-xl transition-colors flex items-center justify-between flex-wrap gap-3"
                      >
                        <div
                          onClick={() => onNavigate('siswa', { id: s.id })}
                          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-[200px]"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#1D4137] dark:bg-emerald-950 text-emerald-100 font-serif font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-600 dark:border-emerald-500/40 shadow-xs group-hover:scale-105 transition-transform">
                            {initials(s.nama)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-[#1D4137] dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {s.nama}
                              </span>
                              {s.asuh && (
                                <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 border border-purple-200 dark:border-purple-800">
                                  <Star className="w-2.5 h-2.5 fill-purple-700 dark:fill-purple-300" /> Asuh
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md capitalize ${
                                  (s.status || 'aktif') === 'aktif'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                {s.status || 'aktif'}
                              </span>
                            </div>
                            <div className="text-xs text-[#647169] dark:text-gray-400 flex items-center gap-2 mt-0.5 font-mono flex-wrap">
                              <span>NIS: <strong className="text-gray-800 dark:text-gray-200">{s.nis || '-'}</strong></span>
                              <span>•</span>
                              <span>Kelas: <strong className="text-gray-800 dark:text-gray-200">{s.kelas || '-'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Indicators & Actions */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {poin > 0 && (
                            <span
                              className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 flex items-center gap-1"
                              title="Total Poin Pelanggaran"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {poin} Poin
                            </span>
                          )}
                          {countTerlambat > 0 && (
                            <span
                              className="text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1"
                              title="Jumlah Terlambat"
                            >
                              <Clock className="w-3 h-3" />
                              {countTerlambat}x
                            </span>
                          )}
                          {countKonseling > 0 && (
                            <span
                              className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                              title="Jumlah Sesi Konseling"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {countKonseling} Sesi
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onNavigate('siswa', { id: s.id })}
                              className="px-2.5 py-1 bg-[#1D4137] hover:bg-[#2D5F52] dark:bg-[#6EE7B7] dark:hover:bg-[#58D3A2] text-white dark:text-[#0D201B] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                              title="Lihat Profil Detail Siswa"
                            >
                              <User className="w-3 h-3" />
                              <span>Profil</span>
                            </button>
                            <button
                              onClick={() => onNavigate('kasus', { id: s.id, siswaId: s.id })}
                              className="p-1 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors"
                              title="Catat Pelanggaran / Kasus"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onNavigate('konseling', { id: s.id, siswaId: s.id })}
                              className="p-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
                              title="Catat Sesi Konseling BK"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredSiswa.length > 8 && (
                    <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Menampilkan 8 dari {filteredSiswa.length} siswa. Buka menu{' '}
                      <button
                        onClick={() => onNavigate('siswa')}
                        className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Data Siswa
                      </button>{' '}
                      untuk melihat seluruh data.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid Stats cards with motion entry */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4">
        {[
          {
            label: 'Total Siswa Aktif',
            val: activeSiswa.length,
            sub: `${siswaList.length} siswa terdaftar`,
            icon: <Users className="w-4 h-4 text-[#2D5F52]" />,
            border: 'border-l-4 border-l-[#2D5F52]',
          },
          {
            label: 'Siswa Asuh Binaan',
            val: siswaAsuhCount,
            sub: `${Math.round((siswaAsuhCount / (activeSiswa.length || 1)) * 100)}% dari siswa aktif`,
            icon: <Star className="w-4 h-4 text-[#7B5EA7]" />,
            border: 'border-l-4 border-l-[#7B5EA7]',
          },
          {
            label: 'Kasus Bulan Ini',
            val: kasusBulanIni.length,
            sub: `Total: ${kasusList.length} kasus terdata`,
            icon: <AlertTriangle className="w-4 h-4 text-[#C9862E]" />,
            border: 'border-l-4 border-l-[#C9862E]',
          },
          {
            label: 'Konseling Bulan Ini',
            val: konselingBulanIni.length,
            sub: `Total: ${konselingList.length} sesi konseling`,
            icon: <MessageSquare className="w-4 h-4 text-[#4C8C6B]" />,
            border: 'border-l-4 border-l-[#4C8C6B]',
          },
          {
            label: 'Terlambat Bulan Ini',
            val: terlambatBulanIni.length,
            sub: `Total: ${terlambatList.length} kali terlambat`,
            icon: <Clock className="w-4 h-4 text-[#B5473A]" />,
            border: 'border-l-4 border-l-[#B5473A]',
          },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className={`bg-white dark:bg-[#1A2E27] rounded-2xl p-3 sm:p-4 border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs flex flex-col justify-between ${card.border} ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#647169] dark:text-gray-400 uppercase tracking-wider">
              <span>{card.label}</span>
              {card.icon}
            </div>
            <div className="font-serif font-bold text-2xl sm:text-3xl text-[#1D4137] dark:text-gray-100 my-1.5 sm:my-2">
              {card.val}
            </div>
            <div className="text-[11px] font-medium text-[#647169] dark:text-gray-400 truncate">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Alur Kerja & Kelompok Modul Berdasarkan Penggunaan (Quick Module Hub) */}
      <div className="bg-white dark:bg-[#1A2E27] rounded-2xl p-4 sm:p-5 border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E0D4] dark:border-[#2D483F] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#2D5F52] dark:bg-[#6EE7B7] text-white dark:text-[#0D201B]">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="font-serif font-bold text-base text-[#1D4137] dark:text-gray-100">
                Pusat Modul Berdasarkan Penggunaan &amp; Peran
              </h3>
            </div>
            <p className="text-xs text-[#647169] dark:text-gray-400">
              Akses cepat menu aplikasi yang dikelompokkan sesuai tugas kerja harian sekolah.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Kesiswaan & Database */}
          <div className="rounded-xl p-3.5 bg-white dark:bg-[#152520] border border-blue-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md hover:border-blue-400 flex flex-col justify-between space-y-3 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/30 uppercase">
                  Wali Kelas &amp; BK
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-gray-100">
                Kesiswaan &amp; Basis Data
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">
                Manajemen data pokok siswa, identitas kelas, dan status pembinaan asuh.
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2D483F]/70">
              <button
                onClick={() => onNavigate('siswa')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#1E362E] hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Data Siswa Aktif</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('siswa_keluar')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#1E362E] hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Siswa Mutasi / Alumni</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Piket & Kedisiplinan */}
          <div className="rounded-xl p-3.5 bg-white dark:bg-[#152520] border border-amber-200/90 dark:border-amber-900/40 shadow-xs hover:shadow-md hover:border-amber-400 flex flex-col justify-between space-y-3 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4" />
                </span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/30 uppercase">
                  Guru Piket &amp; Tatib
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-gray-100">
                Piket &amp; Kedisiplinan
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">
                Presensi harian siswa, izin keterlambatan masuk, dan pencatatan poin pelanggaran.
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2D483F]/70">
              <button
                onClick={() => onNavigate('absensi')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-[#1E362E] hover:text-amber-700 dark:hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Presensi Absensi Kelas</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('terlambat')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-[#1E362E] hover:text-amber-700 dark:hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Keterlambatan Masuk</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('kasus')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-[#1E362E] hover:text-amber-700 dark:hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Kasus &amp; Poin Pelanggaran</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 3: Layanan BK */}
          <div className="rounded-xl p-3.5 bg-white dark:bg-[#152520] border border-purple-200/90 dark:border-purple-900/40 shadow-xs hover:shadow-md hover:border-purple-400 flex flex-col justify-between space-y-3 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-400/30 uppercase">
                  Guru BK
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-gray-100">
                Layanan Bimbingan (BK)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">
                Sesi konseling individu, bimbingan kelompok, serta penjadwalan home visit.
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2D483F]/70">
              <button
                onClick={() => onNavigate('konseling')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-[#1E362E] hover:text-purple-700 dark:hover:text-purple-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Catatan Konseling Siswa</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('jadwal')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-[#1E362E] hover:text-purple-700 dark:hover:text-purple-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Jadwal &amp; Agenda Kegiatan</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 4: Cetak & Dokumen Resmi */}
          <div className="rounded-xl p-3.5 bg-white dark:bg-[#152520] border border-sky-200/90 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:border-sky-400 flex flex-col justify-between space-y-3 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                  <Printer className="w-4 h-4" />
                </span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-400/30 uppercase">
                  Dokumen Resmi
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-gray-100">
                Pusat Cetak &amp; Laporan
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">
                Pencetakan surat panggilan orang tua, jurnal piket, surat pernyataan, dan kartu siswa.
              </p>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2D483F]/70">
              <button
                onClick={() => onNavigate('print_piket')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-[#1E362E] hover:text-sky-700 dark:hover:text-sky-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Surat Panggilan Orang Tua</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('print_piket')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-[#1E362E] hover:text-sky-700 dark:hover:text-sky-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>• Jurnal Piket &amp; Formulir BK</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rekapitulasi 1 Semester / Multi-Periode (Kasus, Terlambat, Sesi Konseling) */}
      <div className="bg-white dark:bg-[#1A2E27] rounded-2xl p-4 sm:p-5 border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs space-y-4">
        {/* Sync Status Banner */}
        <div className="p-3 bg-[#F4F7F2] dark:bg-[#12221D] rounded-xl border border-[#D9E0D4] dark:border-[#2D483F] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-md bg-[#2D5F52] text-white">
              <Database className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-[#1D4137] dark:text-gray-200">
              Sinkronisasi Data Sistem:
            </span>
            <span className="text-[#647169] dark:text-gray-400">
              <strong className="text-gray-800 dark:text-gray-200">{siswaList.length}</strong> Siswa •{' '}
              <strong className="text-gray-800 dark:text-gray-200">{kasusList.length}</strong> Kasus •{' '}
              <strong className="text-gray-800 dark:text-gray-200">{terlambatList.length}</strong> Terlambat •{' '}
              <strong className="text-gray-800 dark:text-gray-200">{konselingList.length}</strong> Sesi Konseling
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {latestRecordPeriod && (
              <button
                onClick={() => {
                  setSelectedTa(latestRecordPeriod.ta);
                  setScopeMode(latestRecordPeriod.sem);
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Sinkronkan tampilan ke periode data terbaru yang ada"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sinkronkan ke Data Ada</span>
              </button>
            )}
            <button
              onClick={() => setScopeMode('semua')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                scopeMode === 'semua'
                  ? 'bg-[#1D4137] text-white border-[#1D4137]'
                  : 'bg-white dark:bg-[#1A2E27] text-[#647169] dark:text-gray-300 border-[#D9E0D4] dark:border-[#2D483F] hover:bg-gray-50'
              }`}
            >
              Semua Data (Total)
            </button>
          </div>
        </div>

        {/* Empty data helper alert if selected scope has 0 records but other periods have data */}
        {kasusSemester.length === 0 && terlambatSemester.length === 0 && konselingSemester.length === 0 && (kasusList.length > 0 || terlambatList.length > 0 || konselingList.length > 0) && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Tidak ada data pada <strong>{semLabel} T.A. {selectedTa}/{selectedTa + 1}</strong>. Data tercatat ditemukan pada periode lain ({kasusList.length} kasus, {terlambatList.length} terlambat, {konselingList.length} konseling).
              </span>
            </div>
            {latestRecordPeriod && (
              <button
                onClick={() => {
                  setSelectedTa(latestRecordPeriod.ta);
                  setScopeMode(latestRecordPeriod.sem);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 transition-colors"
              >
                Buka Periode Terisi ({latestRecordPeriod.sem === 'ganjil' ? 'Ganjil' : 'Genap'} {latestRecordPeriod.ta})
              </button>
            )}
          </div>
        )}

        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#D9E0D4] dark:border-[#2D483F]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                <GraduationCap className="w-4 h-4" />
              </span>
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#1D4137] dark:text-gray-100">
                Rekapitulasi Kedisiplinan &amp; Bimbingan Konseling
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#EFF2EA] dark:bg-emerald-950/80 text-[#2D5F52] dark:text-[#6EE7B7] border border-[#D9E0D4] dark:border-emerald-800">
                {semLabel} {scopeMode !== 'semua' && `• T.A. ${selectedTa}/${selectedTa + 1}`}
              </span>
            </div>
            <p className="text-xs text-[#647169] dark:text-gray-400">
              Akumulasi data kasus, keterlambatan, dan sesi konseling untuk {semPeriodText}.
            </p>
          </div>

          {/* Interactive Semester, Tahun Ajaran & Mode Selector */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Tahun Ajaran Selector (Disabled if scopeMode === 'semua') */}
            <select
              value={selectedTa}
              onChange={(e) => setSelectedTa(Number(e.target.value))}
              disabled={scopeMode === 'semua'}
              className="bg-[#EFF2EA] dark:bg-[#12221D] disabled:opacity-50 text-[#1D4137] dark:text-gray-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#D9E0D4] dark:border-[#2D483F] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              title="Pilih Tahun Ajaran"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  T.A. {year}/{year + 1}
                </option>
              ))}
            </select>

            {/* Scope Switcher Pills */}
            <div className="flex items-center bg-[#EFF2EA] dark:bg-[#12221D] p-0.5 rounded-xl border border-[#D9E0D4] dark:border-[#2D483F]">
              <button
                onClick={() => setScopeMode('ganjil')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  scopeMode === 'ganjil'
                    ? 'bg-[#1D4137] text-white shadow-xs'
                    : 'text-[#647169] dark:text-gray-400 hover:text-[#1D4137] dark:hover:text-white'
                }`}
              >
                Ganjil
              </button>
              <button
                onClick={() => setScopeMode('genap')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  scopeMode === 'genap'
                    ? 'bg-[#1D4137] text-white shadow-xs'
                    : 'text-[#647169] dark:text-gray-400 hover:text-[#1D4137] dark:hover:text-white'
                }`}
              >
                Genap
              </button>
              <button
                onClick={() => setScopeMode('tahun')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  scopeMode === 'tahun'
                    ? 'bg-[#1D4137] text-white shadow-xs'
                    : 'text-[#647169] dark:text-gray-400 hover:text-[#1D4137] dark:hover:text-white'
                }`}
              >
                1 T.A.
              </button>
              <button
                onClick={() => setScopeMode('semua')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  scopeMode === 'semua'
                    ? 'bg-[#1D4137] text-white shadow-xs'
                    : 'text-[#647169] dark:text-gray-400 hover:text-[#1D4137] dark:hover:text-white'
                }`}
              >
                Semua
              </button>
            </div>

            {/* Quick Reset to Active Semester if changed */}
            {!isCurrentActiveSemester && scopeMode !== 'semua' && (
              <button
                onClick={() => {
                  setScopeMode(curSem);
                  setSelectedTa(curTa);
                }}
                className="px-2 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1"
                title="Kembali ke Semester Sekarang"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Cards for 1 Semester / Multi-Periode: Kasus, Terlambat, Sesi Konseling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 1. Kasus 1 Semester */}
          <div className="bg-[#FAFBF9] dark:bg-[#152520] rounded-2xl p-4 sm:p-5 border border-[#D9E0D4] dark:border-[#2D483F] border-l-4 border-l-[#C9862E] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all group">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-[#8A5B1E] dark:text-[#E8A549] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#C9862E]" />
                  Kasus Pelanggaran ({semLabel})
                </span>
                <span className="text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  {kasusSemPoin} Poin Total
                </span>
              </div>

              <div className="my-3 flex items-baseline gap-2">
                <span className="font-serif font-bold text-3xl sm:text-4xl text-[#1D4137] dark:text-gray-100 group-hover:text-[#C9862E] transition-colors">
                  {kasusSemester.length}
                </span>
                <span className="text-xs font-semibold text-[#647169] dark:text-gray-400">Kasus Terdata</span>
              </div>

              {/* Breakdown by severity */}
              <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">Ringan</span>
                  <span className="font-bold text-xs text-[#1D4137] dark:text-gray-200">{kasusSemRingan}</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80">
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">Sedang</span>
                  <span className="font-bold text-xs text-[#1D4137] dark:text-gray-200">{kasusSemSedang}</span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl border border-rose-200 dark:border-rose-800/80">
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">Berat</span>
                  <span className="font-bold text-xs text-[#1D4137] dark:text-gray-200">{kasusSemBerat}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200/80 dark:border-gray-800 flex items-center justify-between text-[11px] text-[#647169] dark:text-gray-400">
              <span>{siswaKasusSemCount} siswa terlibat • Bulan ini: <strong className="text-gray-800 dark:text-gray-200">{kasusBulanIni.length}</strong></span>
              <button
                onClick={() => onNavigate('kasus')}
                className="font-bold text-[#2D5F52] dark:text-[#6EE7B7] hover:underline flex items-center gap-0.5"
              >
                Lihat Kasus <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. Terlambat 1 Semester */}
          <div className="bg-[#FAFBF9] dark:bg-[#152520] rounded-2xl p-4 sm:p-5 border border-[#D9E0D4] dark:border-[#2D483F] border-l-4 border-l-[#B5473A] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all group">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-[#8C3429] dark:text-[#E87A6E] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#B5473A]" />
                  Keterlambatan (1 Semester)
                </span>
                <span className="text-[11px] font-mono font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                  {siswaTerlambatSemCount} Siswa
                </span>
              </div>

              <div className="my-3 flex items-baseline gap-2">
                <span className="font-serif font-bold text-3xl sm:text-4xl text-[#1D4137] dark:text-gray-100 group-hover:text-[#B5473A] transition-colors">
                  {terlambatSemCount}
                </span>
                <span className="text-xs font-semibold text-[#647169] dark:text-gray-400">Total Terlambat</span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 mb-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#647169] dark:text-gray-400">Total Akumulasi Waktu:</span>
                  <span className="font-mono font-bold text-[#B5473A] dark:text-rose-300">
                    {totalMenitTerlambatSem > 0 ? `${totalMenitTerlambatSem} Menit` : '0 Menit'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#647169] dark:text-gray-400">Rata-rata Keterlambatan:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {terlambatSemCount > 0 ? `${Math.round(totalMenitTerlambatSem / terlambatSemCount)} menit/kejadian` : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200/80 dark:border-gray-800 flex items-center justify-between text-[11px] text-[#647169] dark:text-gray-400">
              <span>Bulan ini: <strong className="text-gray-800 dark:text-gray-200">{terlambatBulanIni.length}</strong> terlambat</span>
              <button
                onClick={() => onNavigate('terlambat')}
                className="font-bold text-[#2D5F52] dark:text-[#6EE7B7] hover:underline flex items-center gap-0.5"
              >
                Lihat Terlambat <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 3. Sesi Konseling 1 Semester */}
          <div className="bg-[#FAFBF9] dark:bg-[#152520] rounded-2xl p-4 sm:p-5 border border-[#D9E0D4] dark:border-[#2D483F] border-l-4 border-l-[#4C8C6B] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all group sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-[#2F6147] dark:text-[#76D19F] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#4C8C6B]" />
                  Sesi Konseling BK (1 Semester)
                </span>
                <span className="text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {siswaKonselingSemCount} Siswa Terbina
                </span>
              </div>

              <div className="my-3 flex items-baseline gap-2">
                <span className="font-serif font-bold text-3xl sm:text-4xl text-[#1D4137] dark:text-gray-100 group-hover:text-[#4C8C6B] transition-colors">
                  {konselingSemCount}
                </span>
                <span className="text-xs font-semibold text-[#647169] dark:text-gray-400">Sesi Terlaksana</span>
              </div>

              {/* Breakdown by counseling type */}
              <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">Individu</span>
                  <span className="font-bold text-xs text-[#1D4137] dark:text-gray-200">{konselingSemIndividu}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">Kelompok</span>
                  <span className="font-bold text-xs text-[#1D4137] dark:text-gray-200">{konselingSemKelompok}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">Klasikal</span>
                  <span className="font-bold text-xs text-[#1D4137] dark:text-gray-200">{konselingSemKlasikal}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200/80 dark:border-gray-800 flex items-center justify-between text-[11px] text-[#647169] dark:text-gray-400">
              <span>Bulan ini: <strong className="text-gray-800 dark:text-gray-200">{konselingBulanIni.length}</strong> sesi</span>
              <button
                onClick={() => onNavigate('konseling')}
                className="font-bold text-[#2D5F52] dark:text-[#6EE7B7] hover:underline flex items-center gap-0.5"
              >
                Lihat Konseling <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Recent Cases & Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1A2E27] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#1D4137] dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C9862E]" />
              Kasus &amp; Pelanggaran Terbaru
            </h3>
            <button
              onClick={() => onNavigate('kasus')}
              className="text-xs font-semibold text-[#2D5F52] dark:text-[#6EE7B7] hover:underline cursor-pointer"
            >
              Lihat semua →
            </button>
          </div>

          <div className="p-4 overflow-x-auto">
            {recentKasus.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#647169]">Belum ada data kasus dicatat.</p>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Siswa</th>
                    <th className="p-2">Jenis</th>
                    <th className="p-2 text-right">Poin</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentKasus.map((k) => {
                    const s = activeSiswa.find((item) => item.id === k.siswaId);
                    return (
                      <tr key={k.id} className="hover:bg-[#EFF2EA]/60 transition-colors">
                        <td className="p-2 font-mono text-[#647169]">{fmtDate(k.tanggal)}</td>
                        <td className="p-2 font-bold text-[#1D4137]">{s ? s.nama : '(Siswa Dihapus)'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            k.jenis === 'ringan' ? 'bg-[#E1EFE7] text-[#4C8C6B]' : k.jenis === 'sedang' ? 'bg-[#F5E7CE] text-[#C9862E]' : 'bg-[#F5DEDA] text-[#B5473A]'
                          }`}>
                            {k.jenis}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-[#B5473A]">+{k.poin}</td>
                        <td className="p-2">
                          <span className="capitalize px-2 py-0.5 text-[10px] font-medium rounded-md bg-gray-100 text-gray-700">
                            {k.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sebaran Pelanggaran Kasus (Recharts Donut Chart) */}
        <div className="bg-white dark:bg-[#1A2E27] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#D9E0D4] dark:border-[#2D483F] pb-3 mb-3 gap-2 flex-wrap">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1D4137] dark:text-gray-100 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#2D5F52] dark:text-[#6EE7B7]" />
                Rekap Kasus ({chartScope === 'bulan' ? 'Bulan Ini' : '1 Semester'})
              </h3>
              <span className="text-[11px] text-[#647169] dark:text-gray-400">
                {chartScope === 'bulan' ? 'Data bulan berjalan' : chartScope === 'semester' ? `${semLabel} (${selectedTa}/${selectedTa + 1})` : `Semua Data Terdata (${kasusList.length} total)`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-[#EFF2EA] dark:bg-[#12221D] p-0.5 rounded-lg border border-[#D9E0D4] dark:border-[#2D483F]">
                <button
                  onClick={() => setChartScope('bulan')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                    chartScope === 'bulan'
                      ? 'bg-[#1D4137] text-white shadow-xs'
                      : 'text-[#647169] dark:text-gray-400 hover:text-[#1D4137]'
                  }`}
                >
                  Bulan
                </button>
                <button
                  onClick={() => setChartScope('semester')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                    chartScope === 'semester'
                      ? 'bg-[#1D4137] text-white shadow-xs'
                      : 'text-[#647169] dark:text-gray-400 hover:text-[#1D4137]'
                  }`}
                >
                  Periode
                </button>
                <button
                  onClick={() => setChartScope('semua')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                    chartScope === 'semua'
                      ? 'bg-[#1D4137] text-white shadow-xs'
                      : 'text-[#647169] dark:text-gray-400 hover:text-[#1D4137]'
                  }`}
                >
                  Semua
                </button>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#647169] dark:text-gray-300 bg-[#EFF2EA] dark:bg-[#12221D] px-2 py-0.5 rounded-md border border-[#D9E0D4] dark:border-[#2D483F]">
                Total: {chartScope === 'bulan' ? ringan + sedang + berat : chartScope === 'semester' ? kasusSemester.length : kasusList.length}
              </span>
            </div>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            {(chartScope === 'bulan' ? ringan + sedang + berat : chartScope === 'semester' ? kasusSemester.length : kasusList.length) === 0 ? (
              <p className="text-center text-xs text-[#647169] dark:text-gray-400">
                {chartScope === 'bulan' ? 'Belum ada kasus dicatat bulan ini.' : chartScope === 'semester' ? 'Belum ada kasus dicatat pada semester ini.' : 'Belum ada data kasus dicatat.'}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeKasusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {activeKasusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1D4137',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-[#1D4137] dark:text-gray-200">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#D9E0D4] dark:border-[#2D483F] text-center">
            <div className="bg-[#E1EFE7] dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <span className="text-[10px] text-[#4C8C6B] dark:text-emerald-300 font-bold block uppercase">Ringan</span>
              <span className="font-serif font-bold text-base text-[#1D4137] dark:text-gray-100">
                {chartScope === 'bulan' ? ringan : chartScope === 'semester' ? kasusSemRingan : kasusList.filter((k) => k.jenis === 'ringan').length}
              </span>
            </div>
            <div className="bg-[#F5E7CE] dark:bg-amber-950/60 p-2 rounded-xl border border-amber-100 dark:border-amber-800">
              <span className="text-[10px] text-[#C9862E] dark:text-amber-300 font-bold block uppercase">Sedang</span>
              <span className="font-serif font-bold text-base text-[#C9862E] dark:text-amber-300">
                {chartScope === 'bulan' ? sedang : chartScope === 'semester' ? kasusSemSedang : kasusList.filter((k) => k.jenis === 'sedang').length}
              </span>
            </div>
            <div className="bg-[#F5DEDA] dark:bg-rose-950/60 p-2 rounded-xl border border-rose-100 dark:border-rose-800">
              <span className="text-[10px] text-[#B5473A] dark:text-rose-300 font-bold block uppercase">Berat</span>
              <span className="font-serif font-bold text-base text-[#B5473A] dark:text-rose-300">
                {chartScope === 'bulan' ? berat : chartScope === 'semester' ? kasusSemBerat : kasusList.filter((k) => k.jenis === 'berat').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row Visualisasi Grafis Tren Kedisiplinan Mingguan (Recharts AreaChart & BarChart) */}
      <div className="bg-white dark:bg-[#1A2E27] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#D9E0D4] dark:border-[#2D483F] pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#1D4137] dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2D5F52] dark:text-[#6EE7B7]" />
              Grafik Tren Kedisiplinan &amp; Absensi (7 Hari Terakhir)
            </h3>
            <p className="text-xs text-[#647169] dark:text-gray-400 mt-0.5">
              Visualisasi harian keterlambatan, kasus pelanggaran, serta siswa alpa dan izin/sakit.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
            <span className="flex items-center gap-1.5 text-[#B5473A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B5473A]" /> Alpa
            </span>
            <span className="flex items-center gap-1.5 text-[#C9862E]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9862E]" /> Terlambat
            </span>
            <span className="flex items-center gap-1.5 text-[#2D5F52] dark:text-[#6EE7B7]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D5F52] dark:bg-[#6EE7B7]" /> Kasus
            </span>
            <span className="flex items-center gap-1.5 text-[#4C8C6B]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4C8C6B]" /> Sakit/Izin
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKasus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D5F52" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2D5F52" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTerlambat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9862E" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#C9862E" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAlpa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B5473A" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#B5473A" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSakitIzin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4C8C6B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4C8C6B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFF2EA" vertical={false} />
              <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#647169' }} axisLine={{ stroke: '#D9E0D4' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#647169' }} axisLine={{ stroke: '#D9E0D4' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1D4137',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '12px',
                  border: '1px solid #2D5F52',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                }}
              />
              <Area type="monotone" dataKey="Alpa" stroke="#B5473A" fillOpacity={1} fill="url(#colorAlpa)" strokeWidth={2} />
              <Area type="monotone" dataKey="Terlambat" stroke="#C9862E" fillOpacity={1} fill="url(#colorTerlambat)" strokeWidth={2} />
              <Area type="monotone" dataKey="Kasus" stroke="#2D5F52" fillOpacity={1} fill="url(#colorKasus)" strokeWidth={2} />
              <Area type="monotone" dataKey="Sakit/Izin" stroke="#4C8C6B" fillOpacity={1} fill="url(#colorSakitIzin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Agenda Hari Ini & Siswa Poin Tertinggi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Agenda Hari Ini */}
        <div className="bg-white dark:bg-[#1A2E27] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#1D4137] dark:text-gray-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#2D5F52] dark:text-[#6EE7B7]" />
              Agenda Hari Ini ({fmtDateFull(today)})
            </h3>
            <button
              onClick={() => onNavigate('jadwal')}
              className="text-xs font-semibold text-[#2D5F52] dark:text-[#6EE7B7] hover:underline cursor-pointer"
            >
              Kelola jadwal →
            </button>
          </div>

          <div className="p-4 space-y-3">
            {jadwalHariIni.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#647169] dark:text-gray-400">
                <p>Tidak ada agenda kegiatan tercatat hari ini.</p>
                <button
                  onClick={() => onNavigate('jadwal')}
                  className="mt-2 px-3 py-1 bg-[#DCE8E1] dark:bg-emerald-900/60 text-[#1D4137] dark:text-emerald-200 font-semibold rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer"
                >
                  + Tambah Jadwal Baru
                </button>
              </div>
            ) : (
              jadwalHariIni.map((j) => (
                <div key={j.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#EFF2EA]/60 dark:bg-[#152520] border border-[#D9E0D4] dark:border-[#2D483F]">
                  <span className="font-mono text-xs font-bold bg-[#DCE8E1] dark:bg-emerald-950 text-[#1D4137] dark:text-[#6EE7B7] px-2.5 py-1 rounded-md shrink-0">
                    {j.jam || '--:--'}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#1D4137] dark:text-gray-100">{j.kegiatan}</p>
                    <p className="text-[11px] text-[#647169] dark:text-gray-400">
                      {j.sasaran || 'Umum'} {j.tempat ? `· ${j.tempat}` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Poin Siswa */}
        <div className="bg-white dark:bg-[#1A2E27] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#1D4137] dark:text-gray-100">
              Siswa Poin Kedisiplinan Tertinggi
            </h3>
            <button
              onClick={() => onNavigate('siswa')}
              className="text-xs font-semibold text-[#2D5F52] dark:text-[#6EE7B7] hover:underline cursor-pointer"
            >
              Data siswa →
            </button>
          </div>

          <div className="p-4 space-y-3">
            {topPoinSiswa.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#647169] dark:text-gray-400">Kondisi kedisiplinan siswa masih bersih tanpa poin.</p>
            ) : (
              topPoinSiswa.map(({ siswa, poin }) => (
                <div
                  key={siswa.id}
                  onClick={() => onNavigate('siswa', { id: siswa.id })}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#EFF2EA]/60 dark:bg-[#152520] border border-[#D9E0D4] dark:border-[#2D483F] hover:bg-[#DCE8E1]/50 dark:hover:bg-[#1c332b] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F3E3C8] dark:bg-amber-950/60 text-[#C9862E] dark:text-amber-300 font-serif font-bold text-xs flex items-center justify-center border border-[#C9862E] dark:border-amber-700">
                      {initials(siswa.nama)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1D4137] dark:text-gray-100">{siswa.nama}</p>
                      <p className="text-[10px] font-mono text-[#647169] dark:text-gray-400">Kelas {siswa.kelas || '-'}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#B5473A] bg-red-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-red-100 dark:border-rose-900">
                    {poin} pt
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Kehadiran Hari Ini */}
      <div className="bg-white dark:bg-[#1A2E27] rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-serif font-bold text-base text-[#1D4137] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#4C8C6B]" />
            Rekap Kehadiran Hari Ini ({fmtDateFull(today)})
          </h3>
          <button
            onClick={() => onNavigate('absensi')}
            className="text-xs font-semibold text-[#2D5F52] hover:underline"
          >
            Isi Absensi Kelas →
          </button>
        </div>

        {absensiHariIni.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#647169]">
            Absensi hari ini belum diisi. Silakan pilih kelas di menu Absensi Harian.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-[#E1EFE7] rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-[#4C8C6B] uppercase block">Hadir</span>
              <span className="font-serif font-bold text-2xl text-[#1D4137]">{rekapAbsensi.hadir}</span>
            </div>
            <div className="p-3 bg-[#F5E7CE] rounded-xl border border-amber-200">
              <span className="text-xs font-semibold text-[#8F5F1C] uppercase block">Sakit</span>
              <span className="font-serif font-bold text-2xl text-[#8F5F1C]">{rekapAbsensi.sakit}</span>
            </div>
            <div className="p-3 bg-[#F5E7CE] rounded-xl border border-amber-200">
              <span className="text-xs font-semibold text-[#8F5F1C] uppercase block">Izin</span>
              <span className="font-serif font-bold text-2xl text-[#8F5F1C]">{rekapAbsensi.izin}</span>
            </div>
            <div className="p-3 bg-[#F5DEDA] rounded-xl border border-red-200">
              <span className="text-xs font-semibold text-[#B5473A] uppercase block">Alpa</span>
              <span className="font-serif font-bold text-2xl text-[#B5473A]">{rekapAbsensi.alpa}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
