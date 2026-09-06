import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  FileText,
  Mail,
  FileCheck2,
  BarChart3,
  Search,
  Filter,
  Download,
  Calendar,
  AlertTriangle,
  Clock,
  UserX,
  Layers,
  FolderOpen,
  User,
  FileSpreadsheet,
  CheckCircle2,
  Bookmark,
  Building2,
  GraduationCap,
  MessageSquare,
  FileSignature,
} from 'lucide-react';
import {
  Siswa,
  Kasus,
  Konseling,
  Terlambat,
  Absensi,
  KelasItem,
  UserAccount,
} from '../types';
import {
  fmtDate,
  BULAN,
  currentTahunAjaran,
  currentSemester,
  thisMonthKey,
  todayISO,
} from '../lib/storage';
import {
  exportKasusToExcel,
  exportTerlambatToExcel,
  exportSiswaKeluarToExcel,
  exportRekapBulananToExcel,
  exportSemuaLaporanMultiSheet,
} from '../lib/excelExport';
import {
  exportKasusToPDF,
  exportTerlambatToPDF,
  exportSiswaKeluarToPDF,
  exportRekapBulananToPDF,
} from '../lib/pdfExport';
import { printDirectElement } from '../lib/printHelper';
import { useBranding } from '../lib/branding';

export type SubmenuCetak = 'rekap' | 'surat' | 'piket' | 'layanan' | 'kartu';

interface CetakViewProps {
  siswaList: Siswa[];
  kasusList: Kasus[];
  konselingList: Konseling[];
  terlambatList: Terlambat[];
  absensiList?: Absensi[];
  kelasList?: KelasItem[];
  currentUser?: UserAccount;
  defaultSubmenu?: SubmenuCetak;
  initialParams?: any;
}

export const CetakView: React.FC<CetakViewProps> = ({
  siswaList,
  kasusList,
  konselingList,
  terlambatList,
  absensiList = [],
  kelasList = [],
  currentUser,
  defaultSubmenu = 'rekap',
  initialParams,
}) => {
  const { branding } = useBranding();
  const params = (initialParams || {}) as Record<string, any>;

  // Active Main Submenu
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuCetak>(() => {
    if (params.tab === 'piket' || params.format) return 'piket';
    if (params.tab === 'surat') return 'surat';
    if (params.tab === 'layanan') return 'layanan';
    if (params.tab === 'kartu') return 'kartu';
    return defaultSubmenu;
  });

  // Tanda Tangan Pegawai (Nama & NIP tersimpan di browser)
  const [kepsekNama, setKepsekNama] = useState(() => localStorage.getItem('mbg_kepsek_nama') || 'H. Ahmad Subarjo, M.Pd');
  const [kepsekNip, setKepsekNip] = useState(() => localStorage.getItem('mbg_kepsek_nip') || '19750312 200212 1 004');
  const [guruNama, setGuruNama] = useState(
    () => localStorage.getItem('mbg_guru_nama') || currentUser?.nama || 'Hj. Siti Rahmah, S.Pd., Kons.'
  );
  const [guruNip, setGuruNip] = useState(
    () => localStorage.getItem('mbg_guru_nip') || currentUser?.nip || '19820514 200604 2 018'
  );

  useEffect(() => {
    localStorage.setItem('mbg_kepsek_nama', kepsekNama);
  }, [kepsekNama]);
  useEffect(() => {
    localStorage.setItem('mbg_kepsek_nip', kepsekNip);
  }, [kepsekNip]);
  useEffect(() => {
    localStorage.setItem('mbg_guru_nama', guruNama);
  }, [guruNama]);
  useEffect(() => {
    localStorage.setItem('mbg_guru_nip', guruNip);
  }, [guruNip]);

  // List of all unique classes
  const allKelasNames = useMemo(() => {
    const setK = new Set<string>();
    kelasList.forEach((k) => setK.add(k.nama));
    siswaList.forEach((s) => s.kelas && setK.add(s.kelas));
    return Array.from(setK).sort();
  }, [kelasList, siswaList]);

  // Siswa map for fast lookup
  const siswaMap = useMemo(() => {
    const map = new Map<string, Siswa>();
    siswaList.forEach((s) => map.set(s.id, s));
    return map;
  }, [siswaList]);

  const activeSiswa = useMemo(
    () => siswaList.filter((s) => (s.status || 'aktif') === 'aktif'),
    [siswaList]
  );
  const inactiveSiswa = useMemo(
    () => siswaList.filter((s) => (s.status || 'aktif') !== 'aktif'),
    [siswaList]
  );

  // ==========================================
  // STATE 1: REKAPITULASI (Laporan Rekap)
  // ==========================================
  const [tabRekap, setTabRekap] = useState<'kasus' | 'terlambat' | 'keluar' | 'bulanan' | 'konseling'>('kasus');
  const [selectedBulanRekap, setSelectedBulanRekap] = useState('');
  const [selectedKelasRekap, setSelectedKelasRekap] = useState(params.kelas || '');
  const [searchRekap, setSearchRekap] = useState('');
  const [filterTingkatKasus, setFilterTingkatKasus] = useState('');
  const [filterStatusKasus, setFilterStatusKasus] = useState('');
  const [filterStatusKeluar, setFilterStatusKeluar] = useState('');

  const [yRekap, mRekap] = selectedBulanRekap.split('-').map(Number);
  const monthNameRekap = mRekap ? BULAN[mRekap - 1] : 'Semua Periode';
  const periodeLabelRekap = selectedBulanRekap ? `${monthNameRekap} ${yRekap}` : 'Semua Waktu';

  // Filtered lists for Rekap
  const filteredKasus = useMemo(() => {
    return kasusList.filter((k) => {
      const s = siswaMap.get(k.siswaId);
      if (selectedBulanRekap && k.tanggal && !k.tanggal.startsWith(selectedBulanRekap)) return false;
      if (selectedKelasRekap && s?.kelas !== selectedKelasRekap) return false;
      if (filterTingkatKasus && k.jenis !== filterTingkatKasus) return false;
      if (filterStatusKasus && k.status !== filterStatusKasus) return false;
      if (searchRekap) {
        const q = searchRekap.toLowerCase();
        const matchNama = s?.nama.toLowerCase().includes(q);
        const matchNis = s?.nis?.toLowerCase().includes(q);
        const matchDesk = k.deskripsi?.toLowerCase().includes(q);
        const matchTindak = k.tindakLanjut?.toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchDesk && !matchTindak) return false;
      }
      return true;
    });
  }, [kasusList, siswaMap, selectedBulanRekap, selectedKelasRekap, filterTingkatKasus, filterStatusKasus, searchRekap]);

  const filteredTerlambat = useMemo(() => {
    return terlambatList.filter((t) => {
      const s = siswaMap.get(t.siswaId);
      if (selectedBulanRekap && t.tanggal && !t.tanggal.startsWith(selectedBulanRekap)) return false;
      if (selectedKelasRekap && s?.kelas !== selectedKelasRekap) return false;
      if (searchRekap) {
        const q = searchRekap.toLowerCase();
        const matchNama = s?.nama.toLowerCase().includes(q);
        const matchNis = s?.nis?.toLowerCase().includes(q);
        const matchKet = t.keterangan?.toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchKet) return false;
      }
      return true;
    });
  }, [terlambatList, siswaMap, selectedBulanRekap, selectedKelasRekap, searchRekap]);

  const filteredSiswaKeluar = useMemo(() => {
    return inactiveSiswa.filter((s) => {
      if (selectedKelasRekap && s.kelas !== selectedKelasRekap) return false;
      if (filterStatusKeluar && s.status !== filterStatusKeluar) return false;
      if (searchRekap) {
        const q = searchRekap.toLowerCase();
        const matchNama = s.nama.toLowerCase().includes(q);
        const matchNis = s.nis?.toLowerCase().includes(q);
        const matchCat = s.catatan?.toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchCat) return false;
      }
      return true;
    });
  }, [inactiveSiswa, selectedKelasRekap, filterStatusKeluar, searchRekap]);

  const filteredKonseling = useMemo(() => {
    return konselingList.filter((c) => {
      const s = c.siswaId ? siswaMap.get(c.siswaId) : null;
      if (selectedBulanRekap && c.tanggal && !c.tanggal.startsWith(selectedBulanRekap)) return false;
      if (selectedKelasRekap && s?.kelas !== selectedKelasRekap) return false;
      if (searchRekap) {
        const q = searchRekap.toLowerCase();
        const matchNama = (s?.nama || c.siswaNama || '').toLowerCase().includes(q);
        const matchTopik = c.topik?.toLowerCase().includes(q);
        const matchCatatan = c.catatan?.toLowerCase().includes(q);
        if (!matchNama && !matchTopik && !matchCatatan) return false;
      }
      return true;
    });
  }, [konselingList, siswaMap, selectedBulanRekap, selectedKelasRekap, searchRekap]);

  // Statistik Bulanan
  const statsBulanan = useMemo(() => {
    const targetBulan = selectedBulanRekap || thisMonthKey();
    const kasusBulan = kasusList.filter((k) => k.tanggal && k.tanggal.startsWith(targetBulan));
    const terlambatBulan = terlambatList.filter((t) => t.tanggal && t.tanggal.startsWith(targetBulan));
    const konselingBulan = konselingList.filter((c) => c.tanggal && c.tanggal.startsWith(targetBulan));
    const absensiBulan = absensiList.filter((a) => a.tanggal && a.tanggal.startsWith(targetBulan));

    const totalKasus = kasusBulan.length;
    const totalPoin = kasusBulan.reduce((acc, k) => acc + (k.poin || 0), 0);
    const totalTerlambat = terlambatBulan.length;
    const totalKonseling = konselingBulan.length;

    const sakit = absensiBulan.filter((a) => a.status === 'sakit').length;
    const izin = absensiBulan.filter((a) => a.status === 'izin').length;
    const alpa = absensiBulan.filter((a) => a.status === 'alpa').length;

    return {
      targetBulan,
      totalKasus,
      totalPoin,
      totalTerlambat,
      totalKonseling,
      sakit,
      izin,
      alpa,
    };
  }, [kasusList, terlambatList, konselingList, absensiList, selectedBulanRekap]);

  // ==========================================
  // STATE 2: SURAT RESMI & PEMANGGILAN
  // ==========================================
  const [formatSurat, setFormatSurat] = useState<'panggilan' | 'pernyataan'>('panggilan');
  const [selectedSiswaSuratId, setSelectedSiswaSuratId] = useState<string>(activeSiswa[0]?.id || '');
  const [jenisPanggilan, setJenisPanggilan] = useState<'panggilan_1' | 'panggilan_2' | 'panggilan_3' | 'mendesak'>('panggilan_1');
  const [nomorSurat, setNomorSurat] = useState('421.3/ 048 /SMAN1-BK/IX/2026');
  const [alasanPanggilan, setAlasanPanggilan] = useState(
    'Pelanggaran Tata Tertib & Akumulasi Poin Kedisiplinan Siswa'
  );
  const [tglPanggilan, setTglPanggilan] = useState(todayISO());
  const [hariPanggilan, setHariPanggilan] = useState('Senin');
  const [jamPanggilan, setJamPanggilan] = useState('09.00 - 10.30 WITA');
  const [tempatPanggilan, setTempatPanggilan] = useState('Ruang Bimbingan dan Konseling (BK)');

  const selectedSiswaSurat = useMemo(() => {
    return siswaMap.get(selectedSiswaSuratId) || activeSiswa[0] || null;
  }, [selectedSiswaSuratId, siswaMap, activeSiswa]);

  // ==========================================
  // STATE 3: JURNAL PIKET & PRESENSI
  // ==========================================
  const [formatPiket, setFormatPiket] = useState<'daftar' | 'matriks' | 'bulanan'>('daftar');
  const [selectedKelasPiket, setSelectedKelasPiket] = useState(params.kelas || 'semua');
  const [selectedBulanPiket, setSelectedBulanPiket] = useState(thisMonthKey());

  const studentsForPiket = useMemo(() => {
    const pool = selectedKelasPiket === 'semua'
      ? activeSiswa
      : activeSiswa.filter((s) => s.kelas === selectedKelasPiket);
    return [...pool].sort((a, b) => {
      if (a.kelas !== b.kelas) return (a.kelas || '').localeCompare(b.kelas || '');
      return a.nama.localeCompare(b.nama);
    });
  }, [activeSiswa, selectedKelasPiket]);

  const [yPiket, mPiket] = selectedBulanPiket.split('-').map(Number);
  const monthNamePiket = BULAN[mPiket - 1] || 'Bulan';

  // ==========================================
  // STATE 4: FORMULIR LAYANAN BK
  // ==========================================
  const [formatLayanan, setFormatLayanan] = useState<'konseling' | 'homevisit' | 'konferensi'>('konseling');
  const [selectedSiswaLayananId, setSelectedSiswaLayananId] = useState<string>(activeSiswa[0]?.id || '');
  const [layananBlankMode, setLayananBlankMode] = useState<boolean>(false);
  const [topikLayanan, setTopikLayanan] = useState('Kesulitan Belajar dan Disiplin Kehadiran');
  const [ringkasanLayanan, setRingkasanLayanan] = useState(
    'Konseli sering terlambat masuk jam pertama dan merasa kesulitan mengatur waktu belajar di malam hari.'
  );
  const [tindakLanjutLayanan, setTindakLanjutLayanan] = useState(
    'Penyusunan jadwal harian bersama konseli dan pemantauan kartu monitoring oleh wali kelas.'
  );

  const selectedSiswaLayanan = useMemo(() => {
    return siswaMap.get(selectedSiswaLayananId) || activeSiswa[0] || null;
  }, [selectedSiswaLayananId, siswaMap, activeSiswa]);

  // ==========================================
  // STATE 5: KARTU REKAM JEJAK SISWA (DOSSIER)
  // ==========================================
  const [selectedSiswaKartuId, setSelectedSiswaKartuId] = useState<string>(activeSiswa[0]?.id || '');
  const [searchSiswaKartu, setSearchSiswaKartu] = useState('');

  const selectedSiswaKartu = useMemo(() => {
    return siswaMap.get(selectedSiswaKartuId) || activeSiswa[0] || null;
  }, [selectedSiswaKartuId, siswaMap, activeSiswa]);

  const riwayatKasusSiswa = useMemo(() => {
    if (!selectedSiswaKartu) return [];
    return kasusList.filter((k) => k.siswaId === selectedSiswaKartu.id);
  }, [kasusList, selectedSiswaKartu]);

  const riwayatTerlambatSiswa = useMemo(() => {
    if (!selectedSiswaKartu) return [];
    return terlambatList.filter((t) => t.siswaId === selectedSiswaKartu.id);
  }, [terlambatList, selectedSiswaKartu]);

  const riwayatKonselingSiswa = useMemo(() => {
    if (!selectedSiswaKartu) return [];
    return konselingList.filter((c) => c.siswaId === selectedSiswaKartu.id);
  }, [konselingList, selectedSiswaKartu]);

  const totalPoinSiswa = useMemo(() => {
    return riwayatKasusSiswa.reduce((acc, k) => acc + (k.poin || 0), 0);
  }, [riwayatKasusSiswa]);

  // Handle Print Action per Submenu
  const handlePrintSubmenu = (targetId: string, titleDoc: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
    printDirectElement(targetId, {
      title: `${titleDoc} - ${branding.schoolName || 'Sekolah'}`,
      orientation,
    });
  };

  // Reusable Kop Surat Komponen Cetak
  const renderKopSurat = (judulDokumen: string, subJudul?: string) => (
    <div className="flex flex-col items-center justify-center pb-4 mb-4 border-b-2 border-black text-center select-none">
      {branding.showLogoOnPrint && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-1 flex items-center justify-center">
          <img
            src={branding.schoolLogo || '/logo.png?v=5'}
            alt={branding.schoolName || 'Logo Sekolah'}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {branding.kopInstansi && (
        <div className="text-[10px] sm:text-xs font-serif font-bold text-black uppercase tracking-wider leading-tight whitespace-pre-line">
          {branding.kopInstansi}
        </div>
      )}

      <h1 className="text-base sm:text-lg font-serif font-extrabold text-black uppercase tracking-wide mt-0.5">
        {branding.schoolName || 'SMA NEGERI 1 ALALAK'}
      </h1>

      <div className="text-[11px] sm:text-xs font-serif font-bold text-black uppercase tracking-wide">
        UNIT LAYANAN BIMBINGAN KONSELING &amp; KEDISIPLINAN SISWA
      </div>

      {branding.kopAlamat && (
        <p className="text-[9.5px] sm:text-[10.5px] text-black font-sans mt-0.5 leading-tight">
          {branding.kopAlamat}
        </p>
      )}

      {/* Double Divider Line khas Surat Dinas */}
      <div className="w-full mt-2 space-y-[2px]">
        <div className="h-[2px] bg-black w-full" />
        <div className="h-[0.5px] bg-black w-full" />
      </div>

      <div className="mt-3">
        <h2 className="text-sm sm:text-base font-serif font-bold text-black uppercase tracking-wide">
          {judulDokumen}
        </h2>
        {subJudul && (
          <p className="text-[10px] sm:text-[11px] font-sans text-black/80 font-medium">
            {subJudul}
          </p>
        )}
      </div>
    </div>
  );

  // Reusable Tanda Tangan Resmi
  const renderTandaTanganResmi = (opts?: {
    kiriJabatan?: string;
    kiriNama?: string;
    kiriNip?: string;
    kananJabatan?: string;
    kananNama?: string;
    kananNip?: string;
    lokasiTanggal?: string;
  }) => {
    const {
      kiriJabatan = 'Mengetahui,\nKepala Sekolah',
      kiriNama = kepsekNama,
      kiriNip = kepsekNip,
      kananJabatan = 'Guru Bimbingan Konseling (BK)',
      kananNama = guruNama,
      kananNip = guruNip,
      lokasiTanggal = `Alalak, ${fmtDate(todayISO())}`,
    } = opts || {};

    return (
      <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs text-black">
        <div className="text-center space-y-12">
          <p className="whitespace-pre-line font-medium leading-relaxed">{kiriJabatan}</p>
          <div>
            <p className="font-bold underline text-sm">{kiriNama || '_____________________'}</p>
            <p className="text-[11px] text-gray-700">NIP. {kiriNip || '_____________________'}</p>
          </div>
        </div>

        <div className="text-center space-y-12">
          <p className="whitespace-pre-line font-medium leading-relaxed">
            {lokasiTanggal}
            <br />
            {kananJabatan}
          </p>
          <div>
            <p className="font-bold underline text-sm">{kananNama || '_____________________'}</p>
            <p className="text-[11px] text-gray-700">NIP. {kananNip || '_____________________'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================ */}
      {/* MENU UTAMA PUSAT CETAK (Sub-menu Berdasarkan Kategori Dokumen) */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#152722] p-2 sm:p-3 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs print:hidden">
        <div className="flex items-center justify-between gap-2 mb-2 px-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2D5F52] text-white flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-serif text-[#1D4137] dark:text-emerald-300">
                Pusat Cetak Dokumen &amp; Laporan BK
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#647169] dark:text-[#94A3B8]">
                Pilih kategori bagian dokumen sekolah yang hendak dicetak langsung atau diekspor
              </p>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/40">
            <Bookmark className="w-3 h-3" />
            <span>Format Baku &amp; Kop Resmi</span>
          </span>
        </div>

        <nav aria-label="Submenu Pusat Cetak" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
          {/* 1. Rekapitulasi */}
          <button
            onClick={() => setActiveSubmenu('rekap')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
              activeSubmenu === 'rekap'
                ? 'bg-[#2D5F52] text-white border-[#1D4137] shadow-sm ring-2 ring-[#2D5F52]/30'
                : 'bg-[#F7F9F6] dark:bg-[#1C332C] hover:bg-emerald-50 dark:hover:bg-[#223E36] text-[#21322C] dark:text-gray-200 border-[#D9E0D4] dark:border-[#2D483F]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`p-1.5 rounded-lg ${activeSubmenu === 'rekap' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-[#1D4137] dark:text-emerald-300'}`}>
                <BarChart3 className="w-4 h-4" />
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeSubmenu === 'rekap' ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                5 Format
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Laporan Rekap</div>
              <div className={`text-[10px] leading-tight mt-0.5 ${activeSubmenu === 'rekap' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Kasus, Terlambat, Presensi, Bulanan
              </div>
            </div>
          </button>

          {/* 2. Surat Panggilan & Perjanjian */}
          <button
            onClick={() => setActiveSubmenu('surat')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
              activeSubmenu === 'surat'
                ? 'bg-[#2D5F52] text-white border-[#1D4137] shadow-sm ring-2 ring-[#2D5F52]/30'
                : 'bg-[#F7F9F6] dark:bg-[#1C332C] hover:bg-emerald-50 dark:hover:bg-[#223E36] text-[#21322C] dark:text-gray-200 border-[#D9E0D4] dark:border-[#2D483F]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`p-1.5 rounded-lg ${activeSubmenu === 'surat' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'}`}>
                <Mail className="w-4 h-4" />
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeSubmenu === 'surat' ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                Resmi
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Surat Panggilan &amp; Janji</div>
              <div className={`text-[10px] leading-tight mt-0.5 ${activeSubmenu === 'surat' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Panggilan Ortu 1/2/3, Janji Siswa
              </div>
            </div>
          </button>

          {/* 3. Jurnal Piket & Presensi */}
          <button
            onClick={() => setActiveSubmenu('piket')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
              activeSubmenu === 'piket'
                ? 'bg-[#2D5F52] text-white border-[#1D4137] shadow-sm ring-2 ring-[#2D5F52]/30'
                : 'bg-[#F7F9F6] dark:bg-[#1C332C] hover:bg-emerald-50 dark:hover:bg-[#223E36] text-[#21322C] dark:text-gray-200 border-[#D9E0D4] dark:border-[#2D483F]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`p-1.5 rounded-lg ${activeSubmenu === 'piket' ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'}`}>
                <FileCheck2 className="w-4 h-4" />
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeSubmenu === 'piket' ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                Harian
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Jurnal Piket &amp; Rekap Terlambat</div>
              <div className={`text-[10px] leading-tight mt-0.5 ${activeSubmenu === 'piket' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Rekap Terlambat (1–31), Jurnal Harian Piket
              </div>
            </div>
          </button>

          {/* 4. Formulir Layanan BK */}
          <button
            onClick={() => setActiveSubmenu('layanan')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
              activeSubmenu === 'layanan'
                ? 'bg-[#2D5F52] text-white border-[#1D4137] shadow-sm ring-2 ring-[#2D5F52]/30'
                : 'bg-[#F7F9F6] dark:bg-[#1C332C] hover:bg-emerald-50 dark:hover:bg-[#223E36] text-[#21322C] dark:text-gray-200 border-[#D9E0D4] dark:border-[#2D483F]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`p-1.5 rounded-lg ${activeSubmenu === 'layanan' ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'}`}>
                <FolderOpen className="w-4 h-4" />
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeSubmenu === 'layanan' ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                Layanan
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Formulir Layanan BK</div>
              <div className={`text-[10px] leading-tight mt-0.5 ${activeSubmenu === 'layanan' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Konseling, Home Visit, Konferensi
              </div>
            </div>
          </button>

          {/* 5. Kartu Rekam Jejak Siswa */}
          <button
            onClick={() => setActiveSubmenu('kartu')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 col-span-2 sm:col-span-1 ${
              activeSubmenu === 'kartu'
                ? 'bg-[#2D5F52] text-white border-[#1D4137] shadow-sm ring-2 ring-[#2D5F52]/30'
                : 'bg-[#F7F9F6] dark:bg-[#1C332C] hover:bg-emerald-50 dark:hover:bg-[#223E36] text-[#21322C] dark:text-gray-200 border-[#D9E0D4] dark:border-[#2D483F]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`p-1.5 rounded-lg ${activeSubmenu === 'kartu' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'}`}>
                <User className="w-4 h-4" />
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeSubmenu === 'kartu' ? 'bg-white/25 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                Dossier
              </span>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Kartu Rekam Jejak Siswa</div>
              <div className={`text-[10px] leading-tight mt-0.5 ${activeSubmenu === 'kartu' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Biodata, Pelanggaran, Histori BK
              </div>
            </div>
          </button>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* 1. BAGIAN: LAPORAN REKAPITULASI (Termasuk Laporan Rekap)     */}
      {/* ============================================================ */}
      {activeSubmenu === 'rekap' && (
        <div className="space-y-4">
          {/* Sub-tabs Rekap */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-[#D9E0D4] dark:border-[#2D483F] print:hidden">
            <button
              onClick={() => setTabRekap('kasus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                tabRekap === 'kasus'
                  ? 'bg-[#2D5F52] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1A2E27] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Rekap Kasus &amp; Poin ({filteredKasus.length})</span>
            </button>

            <button
              onClick={() => setTabRekap('terlambat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                tabRekap === 'terlambat'
                  ? 'bg-[#2D5F52] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1A2E27] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-300" />
              <span>Rekap Terlambat ({filteredTerlambat.length})</span>
            </button>

            <button
              onClick={() => setTabRekap('konseling')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                tabRekap === 'konseling'
                  ? 'bg-[#2D5F52] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1A2E27] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
              <span>Rekap Konseling ({filteredKonseling.length})</span>
            </button>

            <button
              onClick={() => setTabRekap('keluar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                tabRekap === 'keluar'
                  ? 'bg-[#2D5F52] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1A2E27] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-rose-300" />
              <span>Siswa Mutasi / Keluar ({filteredSiswaKeluar.length})</span>
            </button>

            <button
              onClick={() => setTabRekap('bulanan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                tabRekap === 'bulanan'
                  ? 'bg-[#2D5F52] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1A2E27] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              <span>Rekap Bulanan Terpadu</span>
            </button>
          </div>

          {/* Filter & Export Bar */}
          <div className="bg-white dark:bg-[#1A2E27] p-3 sm:p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-0.5">Filter Bulan</label>
                <input
                  type="month"
                  value={selectedBulanRekap}
                  onChange={(e) => setSelectedBulanRekap(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-0.5">Filter Kelas</label>
                <select
                  value={selectedKelasRekap}
                  onChange={(e) => setSelectedKelasRekap(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-medium"
                >
                  <option value="">-- Semua Kelas --</option>
                  {allKelasNames.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-0.5">Cari Siswa / Uraian</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchRekap}
                    onChange={(e) => setSearchRekap(e.target.value)}
                    placeholder="Nama / NIS..."
                    className="pl-8 pr-2.5 py-1.5 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs w-32 sm:w-44"
                  />
                </div>
              </div>
            </div>

            {/* Tombol Cetak & Ekspor */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handlePrintSubmenu(
                    'rekapPrintArea',
                    `Laporan Rekapitulasi ${tabRekap.toUpperCase()} - ${periodeLabelRekap}`,
                    'portrait'
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D5F52] hover:bg-[#1D4137] text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Cetak langsung ke kertas via printer fisik"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap (Print)</span>
              </button>

              <button
                onClick={() => {
                  const meta = {
                    title: `Laporan Rekap ${tabRekap.toUpperCase()}`,
                    periode: periodeLabelRekap,
                    kelas: selectedKelasRekap,
                    currentUser,
                    sekolahNama: branding.schoolName,
                    kepalaSekolahNama: kepsekNama,
                    kepalaSekolahNip: kepsekNip,
                    guruBkNama: guruNama,
                    guruBkNip: guruNip,
                  };
                  if (tabRekap === 'kasus') exportKasusToPDF(filteredKasus, siswaList, meta);
                  else if (tabRekap === 'terlambat') exportTerlambatToPDF(filteredTerlambat, siswaList, meta);
                  else if (tabRekap === 'keluar') exportSiswaKeluarToPDF(filteredSiswaKeluar, kasusList, meta);
                  else exportRekapBulananToPDF(activeSiswa, filteredKasus, filteredTerlambat, meta);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Ekspor ke dokumen PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={() => {
                  const filterInfo = {
                    periode: periodeLabelRekap,
                    kelas: selectedKelasRekap === 'semua' ? undefined : selectedKelasRekap,
                  };
                  if (tabRekap === 'kasus') exportKasusToExcel(filteredKasus, siswaList, filterInfo);
                  else if (tabRekap === 'terlambat') exportTerlambatToExcel(filteredTerlambat, siswaList, filterInfo);
                  else if (tabRekap === 'keluar') exportSiswaKeluarToExcel(filteredSiswaKeluar, kasusList, konselingList);
                  else exportRekapBulananToExcel(activeSiswa, filteredKasus, filteredKonseling, filteredTerlambat, absensiList, periodeLabelRekap);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Ekspor ke format Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Area Cetak Laporan Rekap */}
          <div id="rekapPrintArea" className="print-area bg-white p-6 sm:p-8 rounded-2xl border border-[#D9E0D4] shadow-xs text-black">
            {renderKopSurat(
              tabRekap === 'kasus'
                ? 'REKAPITULASI PELANGGARAN & POIN KASUS SISWA'
                : tabRekap === 'terlambat'
                ? 'REKAPITULASI KETERLAMBATAN SISWA'
                : tabRekap === 'konseling'
                ? 'REKAPITULASI PELAKSANAAN BIMBINGAN & KONSELING'
                : tabRekap === 'keluar'
                ? 'REKAPITULASI SISWA MUTASI / KELUAR'
                : 'REKAPITULASI LAPORAN BULANAN TERPADU BK',
              `Periode: ${periodeLabelRekap.toUpperCase()} | Kelas: ${selectedKelasRekap ? `Kelas ${selectedKelasRekap}` : 'Semua Kelas'}`
            )}

            {/* TAB KASUS */}
            {tabRekap === 'kasus' && (
              <div className="space-y-4">
                <table className="w-full text-xs border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-2 w-8">No</th>
                      <th className="border border-black p-2 w-20">Tanggal</th>
                      <th className="border border-black p-2">Nama Siswa</th>
                      <th className="border border-black p-2 w-14">Kelas</th>
                      <th className="border border-black p-2 w-16">Tingkat</th>
                      <th className="border border-black p-2 w-12">Poin</th>
                      <th className="border border-black p-2">Deskripsi Pelanggaran</th>
                      <th className="border border-black p-2 w-24">Tindak Lanjut</th>
                      <th className="border border-black p-2 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKasus.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-gray-500 italic border border-black">
                          Tidak ada catatan kasus pada periode dan filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredKasus.map((k, idx) => {
                        const s = siswaMap.get(k.siswaId);
                        return (
                          <tr key={k.id} className="border-b border-black">
                            <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center whitespace-nowrap">{fmtDate(k.tanggal)}</td>
                            <td className="border border-black p-1.5 font-bold">{s?.nama || '-'}</td>
                            <td className="border border-black p-1.5 text-center font-medium">{s?.kelas || '-'}</td>
                            <td className="border border-black p-1.5 text-center uppercase font-bold text-[10px]">{k.jenis}</td>
                            <td className="border border-black p-1.5 text-center font-bold text-rose-700">+{k.poin}</td>
                            <td className="border border-black p-1.5 leading-tight">{k.deskripsi}</td>
                            <td className="border border-black p-1.5 text-[11px]">{k.tindakLanjut || '-'}</td>
                            <td className="border border-black p-1.5 text-center capitalize text-[10px]">{k.status}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB TERLAMBAT */}
            {tabRekap === 'terlambat' && (
              <div className="space-y-4">
                <table className="w-full text-xs border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-2 w-8">No</th>
                      <th className="border border-black p-2 w-24">Tanggal</th>
                      <th className="border border-black p-2">Nama Siswa</th>
                      <th className="border border-black p-2 w-16">Kelas</th>
                      <th className="border border-black p-2 w-20">Jam Tiba</th>
                      <th className="border border-black p-2 w-20">Menit Telat</th>
                      <th className="border border-black p-2">Keterangan / Alasan Keterlambatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTerlambat.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 italic border border-black">
                          Tidak ada catatan keterlambatan pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredTerlambat.map((t, idx) => {
                        const s = siswaMap.get(t.siswaId);
                        return (
                          <tr key={t.id} className="border-b border-black">
                            <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center whitespace-nowrap">{fmtDate(t.tanggal)}</td>
                            <td className="border border-black p-1.5 font-bold">{s?.nama || '-'}</td>
                            <td className="border border-black p-1.5 text-center font-medium">{s?.kelas || '-'}</td>
                            <td className="border border-black p-1.5 text-center font-mono">{t.jam || '-'}</td>
                            <td className="border border-black p-1.5 text-center font-bold">{t.menit ? `${t.menit} mnt` : '-'}</td>
                            <td className="border border-black p-1.5 leading-tight">{t.keterangan || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB KONSELING */}
            {tabRekap === 'konseling' && (
              <div className="space-y-4">
                <table className="w-full text-xs border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-2 w-8">No</th>
                      <th className="border border-black p-2 w-20">Tanggal</th>
                      <th className="border border-black p-2">Nama Siswa / Sasaran</th>
                      <th className="border border-black p-2 w-16">Kelas</th>
                      <th className="border border-black p-2 w-20">Jenis Layanan</th>
                      <th className="border border-black p-2">Topik / Masalah Bimbingan</th>
                      <th className="border border-black p-2">Hasil &amp; Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKonseling.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 italic border border-black">
                          Tidak ada catatan konseling pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredKonseling.map((c, idx) => {
                        const s = c.siswaId ? siswaMap.get(c.siswaId) : null;
                        return (
                          <tr key={c.id} className="border-b border-black">
                            <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center whitespace-nowrap">{fmtDate(c.tanggal)}</td>
                            <td className="border border-black p-1.5 font-bold">{s?.nama || c.siswaNama || '-'}</td>
                            <td className="border border-black p-1.5 text-center font-medium">{s?.kelas || '-'}</td>
                            <td className="border border-black p-1.5 text-center capitalize font-medium">{c.jenis}</td>
                            <td className="border border-black p-1.5 font-semibold">{c.topik}</td>
                            <td className="border border-black p-1.5 text-[11px]">{c.tindakLanjut || c.catatan || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB SISWA KELUAR */}
            {tabRekap === 'keluar' && (
              <div className="space-y-4">
                <table className="w-full text-xs border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-2 w-8">No</th>
                      <th className="border border-black p-2 w-24">NIS</th>
                      <th className="border border-black p-2">Nama Lengkap Siswa</th>
                      <th className="border border-black p-2 w-16">Kelas Terakhir</th>
                      <th className="border border-black p-2 w-20">Status</th>
                      <th className="border border-black p-2">Alasan / Catatan Perpindahan</th>
                      <th className="border border-black p-2 w-28">Nama Orang Tua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSiswaKeluar.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 italic border border-black">
                          Tidak ada data siswa keluar / mutasi.
                        </td>
                      </tr>
                    ) : (
                      filteredSiswaKeluar.map((s, idx) => (
                        <tr key={s.id} className="border-b border-black">
                          <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{s.nis || '-'}</td>
                          <td className="border border-black p-1.5 font-bold">{s.nama}</td>
                          <td className="border border-black p-1.5 text-center font-medium">{s.kelas || '-'}</td>
                          <td className="border border-black p-1.5 text-center uppercase font-bold text-[10px]">{s.status}</td>
                          <td className="border border-black p-1.5">{s.catatan || '-'}</td>
                          <td className="border border-black p-1.5 text-[11px]">{s.ortu || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB BULANAN TERPADU */}
            {tabRekap === 'bulanan' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 border border-black rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-600">Total Siswa Aktif</p>
                    <p className="text-xl font-bold">{activeSiswa.length}</p>
                  </div>
                  <div className="p-3 border border-black rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-600">Total Kasus &amp; Poin</p>
                    <p className="text-xl font-bold">{statsBulanan.totalKasus} Kasus ({statsBulanan.totalPoin} Poin)</p>
                  </div>
                  <div className="p-3 border border-black rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-600">Siswa Terlambat</p>
                    <p className="text-xl font-bold">{statsBulanan.totalTerlambat} Kejadian</p>
                  </div>
                  <div className="p-3 border border-black rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-600">Layanan Konseling</p>
                    <p className="text-xl font-bold">{statsBulanan.totalKonseling} Sesi</p>
                  </div>
                </div>

                <div className="border border-black rounded-lg p-4 space-y-2">
                  <h3 className="font-bold font-serif text-xs uppercase border-b border-black pb-1">
                    Ringkasan Presensi &amp; Ketidakhadiran Siswa ({statsBulanan.targetBulan})
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-gray-50 border border-gray-300 rounded">
                      <span className="text-gray-600 block text-[10px]">Sakit (S)</span>
                      <strong className="text-base">{statsBulanan.sakit}</strong>
                    </div>
                    <div className="p-2 bg-gray-50 border border-gray-300 rounded">
                      <span className="text-gray-600 block text-[10px]">Izin (I)</span>
                      <strong className="text-base">{statsBulanan.izin}</strong>
                    </div>
                    <div className="p-2 bg-gray-50 border border-gray-300 rounded">
                      <span className="text-gray-600 block text-[10px]">Alpa (A)</span>
                      <strong className="text-base text-rose-700">{statsBulanan.alpa}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {renderTandaTanganResmi()}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. BAGIAN: SURAT RESMI & PEMANGGILAN ORTU / JANJI SISWA      */}
      {/* ============================================================ */}
      {activeSubmenu === 'surat' && (
        <div className="space-y-4">
          {/* Controls Surat */}
          <div className="bg-white dark:bg-[#1A2E27] p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9E0D4] dark:border-[#2D483F] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormatSurat('panggilan')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formatSurat === 'panggilan'
                      ? 'bg-[#2D5F52] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ✉️ Surat Panggilan Orang Tua / Wali
                </button>
                <button
                  onClick={() => setFormatSurat('pernyataan')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formatSurat === 'pernyataan'
                      ? 'bg-[#2D5F52] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📝 Surat Pernyataan / Perjanjian Siswa
                </button>
              </div>

              <button
                onClick={() =>
                  handlePrintSubmenu(
                    'suratPrintArea',
                    formatSurat === 'panggilan'
                      ? `Surat Panggilan Ortu - ${selectedSiswaSurat?.nama}`
                      : `Surat Pernyataan - ${selectedSiswaSurat?.nama}`,
                    'portrait'
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5F52] text-white rounded-xl font-bold text-xs hover:bg-[#1D4137] shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Surat (Print)</span>
              </button>
            </div>

            {/* Input Form Fields for Surat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                  Pilih Siswa
                </label>
                <select
                  value={selectedSiswaSuratId}
                  onChange={(e) => setSelectedSiswaSuratId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold"
                >
                  {activeSiswa.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas || '-'})
                    </option>
                  ))}
                </select>
              </div>

              {formatSurat === 'panggilan' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                      Jenis Panggilan
                    </label>
                    <select
                      value={jenisPanggilan}
                      onChange={(e) => setJenisPanggilan(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold"
                    >
                      <option value="panggilan_1">Surat Panggilan Ke-1 (Konsultasi Awal)</option>
                      <option value="panggilan_2">Surat Panggilan Ke-2 (Peringatan)</option>
                      <option value="panggilan_3">Surat Panggilan Ke-3 (Peringatan Keras / Terakhir)</option>
                      <option value="mendesak">Pemanggilan Mendesak (Kasus Khusus)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                      Nomor Surat
                    </label>
                    <input
                      type="text"
                      value={nomorSurat}
                      onChange={(e) => setNomorSurat(e.target.value)}
                      className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                      Waktu Pertemuan
                    </label>
                    <input
                      type="text"
                      value={jamPanggilan}
                      onChange={(e) => setJamPanggilan(e.target.value)}
                      placeholder="09.00 - 10.30 WITA"
                      className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                      Hari &amp; Tanggal Pemanggilan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={hariPanggilan}
                        onChange={(e) => setHariPanggilan(e.target.value)}
                        placeholder="Contoh: Senin"
                        className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold"
                      />
                      <input
                        type="date"
                        value={tglPanggilan}
                        onChange={(e) => setTglPanggilan(e.target.value)}
                        className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                      Alasan Pemanggilan
                    </label>
                    <input
                      type="text"
                      value={alasanPanggilan}
                      onChange={(e) => setAlasanPanggilan(e.target.value)}
                      placeholder="Uraian perihal pemanggilan..."
                      className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-medium"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-3 flex items-center text-xs text-gray-500 italic">
                  Surat pernyataan otomatis mengisi identitas lengkap siswa, butir-butir komitmen ketaatan tata tertib, serta 4 kolom tanda tangan (Siswa bermeterai, Orang Tua, Guru BK, dan Wali Kelas).
                </div>
              )}
            </div>
          </div>

          {/* Area Cetak Surat */}
          <div id="suratPrintArea" className="print-area bg-white p-8 sm:p-12 rounded-2xl border border-[#D9E0D4] shadow-sm text-black max-w-4xl mx-auto">
            {formatSurat === 'panggilan' ? (
              <div className="space-y-6 text-xs sm:text-sm font-serif leading-relaxed">
                {renderKopSurat(
                  jenisPanggilan === 'panggilan_1'
                    ? 'SURAT PANGGILAN ORANG TUA / WALI (KE-1)'
                    : jenisPanggilan === 'panggilan_2'
                    ? 'SURAT PANGGILAN ORANG TUA / WALI (KE-2)'
                    : jenisPanggilan === 'panggilan_3'
                    ? 'SURAT PANGGILAN ORANG TUA / WALI (KE-3)'
                    : 'SURAT PEMANGGILAN MENDESAK ORANG TUA / WALI'
                )}

                {/* Surat Meta */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <table className="text-xs">
                      <tbody>
                        <tr>
                          <td className="w-20 font-bold">Nomor</td>
                          <td className="w-3">:</td>
                          <td>{nomorSurat}</td>
                        </tr>
                        <tr>
                          <td className="font-bold">Lampiran</td>
                          <td>:</td>
                          <td>- (Satu Berkas)</td>
                        </tr>
                        <tr>
                          <td className="font-bold">Perihal</td>
                          <td>:</td>
                          <td className="font-bold underline">
                            {jenisPanggilan === 'panggilan_1'
                              ? 'Konsultasi Perkembangan Siswa (Panggilan I)'
                              : jenisPanggilan === 'panggilan_2'
                              ? 'Peringatan & Tindak Lanjut Kedisiplinan (Panggilan II)'
                              : jenisPanggilan === 'panggilan_3'
                              ? 'Peringatan Terakhir Pelanggaran Siswa (Panggilan III)'
                              : 'Pemanggilan Mendesak Orang Tua Siswa'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right">
                    <p>Alalak, {fmtDate(todayISO())}</p>
                    <p className="mt-1 font-bold">Kepada Yth.</p>
                    <p>Bapak/Ibu Orang Tua / Wali dari:</p>
                    <p className="font-bold text-sm underline">{selectedSiswaSurat?.nama}</p>
                    <p>di Tempat</p>
                  </div>
                </div>

                <div className="pt-3 space-y-3 font-sans text-xs sm:text-sm leading-relaxed text-justify">
                  <p>Dengan hormat,</p>
                  <p>
                    Sehubungan dengan hasil evaluasi kedisiplinan dan pembinaan belajar siswa di sekolah, kami mengharapkan kehadiran Bapak/Ibu Orang Tua / Wali murid pada:
                  </p>

                  <div className="pl-6 py-2 bg-gray-50 border-l-4 border-black font-mono text-xs sm:text-sm space-y-1">
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Hari / Tanggal</span>
                      <span className="col-span-3">: {hariPanggilan}, {fmtDate(tglPanggilan)}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Pukul / Waktu</span>
                      <span className="col-span-3">: {jamPanggilan}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Tempat</span>
                      <span className="col-span-3">: {tempatPanggilan}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Menemui</span>
                      <span className="col-span-3">: Guru Bimbingan Konseling (BK)</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Perihal / Alasan</span>
                      <span className="col-span-3 font-bold">: {alasanPanggilan}</span>
                    </div>
                  </div>

                  {/* Biodata Siswa */}
                  <div className="border border-black p-2.5 rounded font-sans text-xs space-y-0.5">
                    <p className="font-bold underline mb-1">Identitas Siswa Terkait:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span>Nama Siswa: </span>
                        <strong>{selectedSiswaSurat?.nama}</strong>
                      </div>
                      <div>
                        <span>NIS: </span>
                        <strong>{selectedSiswaSurat?.nis || '-'}</strong>
                      </div>
                      <div>
                        <span>Kelas: </span>
                        <strong>{selectedSiswaSurat?.kelas || '-'}</strong>
                      </div>
                      <div>
                        <span>Orang Tua/Wali: </span>
                        <strong>{selectedSiswaSurat?.ortu || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  <p>
                    Mengingat pentingnya koordinasi ini demi kebaikan dan masa depan pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang telah ditentukan (tidak dapat diwakilkan).
                  </p>
                  <p>
                    Demikian surat pemanggilan ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.
                  </p>
                </div>

                {renderTandaTanganResmi()}
              </div>
            ) : (
              /* SURAT PERNYATAAN / PERJANJIAN SISWA */
              <div className="space-y-6 text-xs sm:text-sm font-sans leading-relaxed text-black">
                {renderKopSurat('SURAT PERNYATAAN / PERJANJIAN SISWA')}

                <p className="text-justify leading-relaxed">
                  Yang bertanda tangan di bawah ini, saya peserta didik {branding.schoolName || 'SMA Negeri 1 Alalak'}:
                </p>

                <div className="pl-6 space-y-1 font-mono text-xs">
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Nama Lengkap</span>
                    <span className="col-span-2 font-bold">: {selectedSiswaSurat?.nama}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span>Nomor Induk Siswa (NIS)</span>
                    <span className="col-span-2">: {selectedSiswaSurat?.nis || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span>Kelas</span>
                    <span className="col-span-2">: {selectedSiswaSurat?.kelas || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span>Jenis Kelamin</span>
                    <span className="col-span-2">: {selectedSiswaSurat?.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span>Nama Orang Tua / Wali</span>
                    <span className="col-span-2">: {selectedSiswaSurat?.ortu || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span>Alamat Rumah</span>
                    <span className="col-span-2">: {selectedSiswaSurat?.alamat || '-'}</span>
                  </div>
                </div>

                <div className="space-y-2 text-justify">
                  <p>
                    Dengan sungguh-sungguh dan penuh kesadaran, menyatakan berjanji kepada pihak sekolah dan orang tua:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Tidak akan mengulangi perbuatan/pelanggaran tata tertib sekolah yang telah saya lakukan.</li>
                    <li>Sanggup mematuhi seluruh peraturan, tata tertib, dan instruksi guru serta pembina di sekolah.</li>
                    <li>Hadir tepat waktu setiap hari sekolah dan aktif mengikuti seluruh kegiatan pembelajaran.</li>
                    <li>Menjaga nama baik diri sendiri, keluarga, serta nama baik {branding.schoolName || 'sekolah'}.</li>
                    <li>
                      Apabila di kemudian hari saya mengulangi pelanggaran tata tertib, maka saya bersedia menerima sanksi tegas sesuai aturan yang berlaku (termasuk skorsing maupun dikembalikan pembinaannya kepada orang tua).
                    </li>
                  </ol>
                  <p>
                    Demikian surat pernyataan perjanjian ini saya buat dengan sebenarnya, tanpa ada paksaan dari pihak manapun, untuk dapat dipergunakan sebagaimana mestinya.
                  </p>
                </div>

                {/* 4 Kolom Tanda Tangan */}
                <div className="pt-6">
                  <p className="text-right text-xs mb-4">Alalak, {fmtDate(todayISO())}</p>
                  <div className="grid grid-cols-2 gap-y-12 gap-x-8 text-center text-xs">
                    <div className="space-y-14">
                      <p>Menyetujui,<br />Orang Tua / Wali Siswa</p>
                      <p className="font-bold underline">( {selectedSiswaSurat?.ortu || '____________________'} )</p>
                    </div>

                    <div className="space-y-8">
                      <p>Yang Membuat Pernyataan,<br />Peserta Didik</p>
                      <div className="inline-block p-2 border border-gray-400 text-[9px] text-gray-500 rounded">
                        Materai<br />Rp 10.000
                      </div>
                      <p className="font-bold underline">( {selectedSiswaSurat?.nama} )</p>
                    </div>

                    <div className="space-y-14">
                      <p>Mengetahui,<br />Guru Bimbingan Konseling (BK)</p>
                      <p className="font-bold underline">( {guruNama} )<br /><span className="font-normal text-[10px]">NIP. {guruNip}</span></p>
                    </div>

                    <div className="space-y-14">
                      <p>Saksi,<br />Wali Kelas</p>
                      <p className="font-bold underline">( _______________________ )<br /><span className="font-normal text-[10px]">NIP. ___________________</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. BAGIAN: JURNAL HARIAN PIKET & PRESENSI KELAS             */}
      {/* ============================================================ */}
      {activeSubmenu === 'piket' && (
        <div className="space-y-4">
          {/* Format Selector */}
          <div className="flex border-b border-[#D9E0D4] dark:border-[#2D483F] gap-2 sm:gap-4 overflow-x-auto pb-1 print:hidden">
            <button
              onClick={() => setFormatPiket('daftar')}
              className={`pb-2 px-1 sm:px-2 text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                formatPiket === 'daftar'
                  ? 'text-[#1D4137] dark:text-[#6EE7B7] border-b-2 border-b-[#2D5F52] dark:border-b-[#6EE7B7]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📋 Daftar Siswa &amp; Piket (Tabel Bersih)
            </button>
            <button
              onClick={() => setFormatPiket('matriks')}
              className={`pb-2 px-1 sm:px-2 text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                formatPiket === 'matriks'
                  ? 'text-[#1D4137] dark:text-[#6EE7B7] border-b-2 border-b-[#2D5F52] dark:border-b-[#6EE7B7]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📅 Rekap Terlambat (Tanggal 1–31)
            </button>
            <button
              onClick={() => setFormatPiket('bulanan')}
              className={`pb-2 px-1 sm:px-2 text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                formatPiket === 'bulanan'
                  ? 'text-[#1D4137] dark:text-[#6EE7B7] border-b-2 border-b-[#2D5F52] dark:border-b-[#6EE7B7]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📖 Jurnal Harian Guru Piket
            </button>
          </div>

          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#1A2E27] p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">Pilih Kelas</label>
                <select
                  value={selectedKelasPiket}
                  onChange={(e) => setSelectedKelasPiket(e.target.value)}
                  className="px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold text-[#1D4137] dark:text-gray-100"
                >
                  <option value="semua">-- Semua Kelas ({activeSiswa.length} Siswa) --</option>
                  {allKelasNames.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k} ({activeSiswa.filter((s) => s.kelas === k).length} siswa)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">Bulan &amp; Tahun</label>
                <input
                  type="month"
                  value={selectedBulanPiket}
                  onChange={(e) => setSelectedBulanPiket(e.target.value)}
                  className="px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold text-[#1D4137] dark:text-gray-100"
                />
              </div>
            </div>

            <button
              onClick={() =>
                handlePrintSubmenu(
                  'piketPrintArea',
                  `Jurnal Piket - ${formatPiket === 'matriks' ? 'REKAP TERLAMBAT' : formatPiket.toUpperCase()} - ${monthNamePiket} ${yPiket}`,
                  formatPiket === 'matriks' ? 'landscape' : 'portrait'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5F52] text-white rounded-xl font-bold text-xs hover:bg-[#1D4137] shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Piket (Print)</span>
            </button>
          </div>

          {/* Area Cetak Piket */}
          <div id="piketPrintArea" className="print-area bg-white p-6 sm:p-8 rounded-2xl border border-[#D9E0D4] shadow-sm text-black">
            {renderKopSurat(
              formatPiket === 'daftar'
                ? 'DAFTAR SISWA & JURNAL PIKET KELAS'
                : formatPiket === 'matriks'
                ? 'REKAP TERLAMBAT SISWA (TANGGAL 1–31)'
                : 'JURNAL HARIAN GURU PIKET SEKOLAH',
              `KELAS: ${selectedKelasPiket === 'semua' ? 'SEMUA KELAS' : `KELAS ${selectedKelasPiket}`} | PERIODE: ${monthNamePiket.toUpperCase()} ${yPiket} | TOTAL: ${studentsForPiket.length} SISWA`
            )}

            {formatPiket === 'daftar' && (
              <div className="space-y-4">
                <table className="w-full text-xs border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-2 w-8">No</th>
                      <th className="border border-black p-2 w-28">NIS</th>
                      <th className="border border-black p-2">Nama Lengkap Siswa</th>
                      <th className="border border-black p-2 w-12">L/P</th>
                      <th className="border border-black p-2 w-20">Kelas</th>
                      <th className="border border-black p-2 w-32">Paraf / Tanda Tangan</th>
                      <th className="border border-black p-2">Catatan Guru Piket / BK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsForPiket.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 italic border border-black">
                          Tidak ada data siswa untuk kelas ini.
                        </td>
                      </tr>
                    ) : (
                      studentsForPiket.map((siswa, idx) => (
                        <tr key={siswa.id} className="h-8 border-b border-black">
                          <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-black p-1.5 font-mono text-center">{siswa.nis || '-'}</td>
                          <td className="border border-black p-1.5 font-bold text-black">
                            {siswa.nama}
                            {siswa.asuh && <span className="ml-2 text-[10px] font-normal text-purple-700">(Siswa Asuh)</span>}
                          </td>
                          <td className="border border-black p-1.5 text-center font-bold">{siswa.jk || 'L'}</td>
                          <td className="border border-black p-1.5 text-center font-semibold">{siswa.kelas || '-'}</td>
                          <td className="border border-black p-1.5 bg-white"></td>
                          <td className="border border-black p-1.5 bg-white"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {formatPiket === 'matriks' && (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse text-center border border-black">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black">
                      <th className="border border-black p-1 w-6" rowSpan={2}>No</th>
                      <th className="border border-black p-1 text-left w-44" rowSpan={2}>Nama Siswa</th>
                      <th className="border border-black p-1 w-10" rowSpan={2}>Kelas</th>
                      <th className="border border-black p-1" colSpan={31}>Tanggal Catatan Rekap Terlambat ({monthNamePiket})</th>
                      <th className="border border-black p-1 w-14 font-bold text-red-800" rowSpan={2} title="Total Frekuensi Terlambat">Total Terlambat</th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-black">
                      {Array.from({ length: 31 }).map((_, i) => (
                        <th key={i} className="border border-black p-0.5 w-5 font-bold">
                          {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentsForPiket.map((siswa, idx) => {
                      const daysInMonth = new Date(yPiket, mPiket, 0).getDate();
                      const studentTerlambat = (terlambatList || []).filter(
                        (t) => t.siswaId === siswa.id && t.tanggal && t.tanggal.startsWith(selectedBulanPiket)
                      );

                      return (
                        <tr key={siswa.id} className="h-6">
                          <td className="border border-black p-1 font-mono">{idx + 1}</td>
                          <td className="border border-black p-1 text-left font-bold truncate max-w-[150px]">
                            {siswa.nama}
                          </td>
                          <td className="border border-black p-1">{siswa.kelas}</td>
                          {Array.from({ length: 31 }).map((_, i) => {
                            const day = i + 1;
                            if (day > daysInMonth) {
                              return <td key={i} className="border border-black p-0 bg-gray-100"></td>;
                            }
                            const late = studentTerlambat.find((t) => {
                              const parts = t.tanggal.split('-');
                              return parts.length >= 3 && parseInt(parts[2], 10) === day;
                            });

                            return (
                              <td key={i} className="border border-black p-0 bg-white text-center font-bold">
                                {late ? (
                                  <span className="text-red-700 font-extrabold text-[9px]">
                                    {late.menit ? `${late.menit}'` : 'T'}
                                  </span>
                                ) : (
                                  ''
                                )}
                              </td>
                            );
                          })}
                          <td className="border border-black p-1 bg-white font-bold text-red-700">
                            {studentTerlambat.length > 0 ? studentTerlambat.length : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {formatPiket === 'bulanan' && (
              <div className="space-y-4 text-xs">
                <table className="w-full text-xs text-left border border-black border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-2 w-8">No</th>
                      <th className="border border-black p-2 w-24">Tanggal</th>
                      <th className="border border-black p-2 w-20">Hari</th>
                      <th className="border border-black p-2 w-16">Sakit</th>
                      <th className="border border-black p-2 w-16">Izin</th>
                      <th className="border border-black p-2 w-16">Alpa</th>
                      <th className="border border-black p-2 w-16">Terlambat</th>
                      <th className="border border-black p-2">Catatan Kejadian / Pelanggaran</th>
                      <th className="border border-black p-2 w-24">Paraf Piket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 18 }).map((_, idx) => (
                      <tr key={idx} className="h-8">
                        <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {renderTandaTanganResmi({
              kiriJabatan: 'Mengetahui,\nGuru BK',
              kananJabatan: 'Guru Piket Harian Sekolah',
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. BAGIAN: FORMULIR & LEMBAR LAYANAN BK                      */}
      {/* ============================================================ */}
      {activeSubmenu === 'layanan' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A2E27] p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9E0D4] dark:border-[#2D483F] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormatLayanan('konseling')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formatLayanan === 'konseling'
                      ? 'bg-[#2D5F52] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📝 Lembar Konseling Individu
                </button>
                <button
                  onClick={() => setFormatLayanan('homevisit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formatLayanan === 'homevisit'
                      ? 'bg-[#2D5F52] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🏠 Lembar Home Visit (Kunjungan Rumah)
                </button>
                <button
                  onClick={() => setFormatLayanan('konferensi')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formatLayanan === 'konferensi'
                      ? 'bg-[#2D5F52] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  👥 Berita Acara Konferensi Kasus
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layananBlankMode}
                    onChange={(e) => setLayananBlankMode(e.target.checked)}
                    className="rounded text-[#2D5F52]"
                  />
                  <span>Format Kosong (Blank Form)</span>
                </label>

                <button
                  onClick={() =>
                    handlePrintSubmenu(
                      'layananPrintArea',
                      `Formulir BK - ${formatLayanan.toUpperCase()} - ${selectedSiswaLayanan?.nama || 'Siswa'}`,
                      'portrait'
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5F52] text-white rounded-xl font-bold text-xs hover:bg-[#1D4137] shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar Layanan</span>
                </button>
              </div>
            </div>

            {!layananBlankMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                    Pilih Siswa Klien
                  </label>
                  <select
                    value={selectedSiswaLayananId}
                    onChange={(e) => setSelectedSiswaLayananId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold"
                  >
                    {activeSiswa.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                    Topik / Gejala Permasalahan
                  </label>
                  <input
                    type="text"
                    value={topikLayanan}
                    onChange={(e) => setTopikLayanan(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Area Cetak Formulir Layanan */}
          <div id="layananPrintArea" className="print-area bg-white p-8 sm:p-12 rounded-2xl border border-[#D9E0D4] shadow-sm text-black max-w-4xl mx-auto space-y-6">
            {renderKopSurat(
              formatLayanan === 'konseling'
                ? 'LEMBAR CATATAN LAYANAN KONSELING INDIVIDU'
                : formatLayanan === 'homevisit'
                ? 'BERITA ACARA KUNJUNGAN RUMAH (HOME VISIT)'
                : 'BERITA ACARA KONFERENSI KASUS (CASE CONFERENCE)'
            )}

            {/* IDENTITAS SISWA */}
            <div className="border border-black p-3 rounded space-y-1 font-sans text-xs">
              <p className="font-bold underline mb-1">Identitas Peserta Didik / Klien:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                <div>
                  Nama Lengkap: <strong className="font-bold font-sans">{layananBlankMode ? '...................................................' : selectedSiswaLayanan?.nama}</strong>
                </div>
                <div>
                  NIS / NISN: <strong>{layananBlankMode ? '..............................' : selectedSiswaLayanan?.nis || '-'}</strong>
                </div>
                <div>
                  Kelas: <strong>{layananBlankMode ? '..............................' : selectedSiswaLayanan?.kelas || '-'}</strong>
                </div>
                <div>
                  Jenis Kelamin: <strong>{layananBlankMode ? 'L / P' : selectedSiswaLayanan?.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</strong>
                </div>
                <div>
                  Orang Tua / Wali: <strong>{layananBlankMode ? '...................................................' : selectedSiswaLayanan?.ortu || '-'}</strong>
                </div>
                <div>
                  No. Telepon / HP: <strong>{layananBlankMode ? '..............................' : selectedSiswaLayanan?.hp || '-'}</strong>
                </div>
              </div>
            </div>

            {/* FORMAT KONSELING INDIVIDU */}
            {formatLayanan === 'konseling' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-black p-2.5 rounded">
                    <p className="font-bold uppercase text-[10px] text-gray-700">Tanggal Pelaksanaan</p>
                    <p className="font-bold text-xs">{layananBlankMode ? '....... / ................... / 2026' : fmtDate(todayISO())}</p>
                  </div>
                  <div className="border border-black p-2.5 rounded">
                    <p className="font-bold uppercase text-[10px] text-gray-700">Waktu &amp; Tempat Konseling</p>
                    <p className="font-bold text-xs">{layananBlankMode ? 'Pukul .......... di Ruang BK' : '09.30 - 10.15 WITA (Ruang BK)'}</p>
                  </div>
                </div>

                <div className="border border-black p-3 rounded space-y-1">
                  <p className="font-bold uppercase text-[11px]">1. Deskripsi Permasalahan / Keluhan Siswa:</p>
                  <p className="leading-relaxed text-justify">
                    {layananBlankMode ? (
                      <span className="block h-16 text-gray-400 italic">
                        (Catat keluhan awal, latar belakang masalah, dan situasi yang sedang dialami siswa...)
                      </span>
                    ) : (
                      topikLayanan
                    )}
                  </p>
                </div>

                <div className="border border-black p-3 rounded space-y-1">
                  <p className="font-bold uppercase text-[11px]">2. Dinamika Wawancara &amp; Temuan Konseling:</p>
                  <p className="leading-relaxed text-justify">
                    {layananBlankMode ? (
                      <span className="block h-20 text-gray-400 italic">
                        (Catat dinamika perilaku, keterbukaan siswa, faktor internal/eksternal, serta analisis konselor...)
                      </span>
                    ) : (
                      ringkasanLayanan
                    )}
                  </p>
                </div>

                <div className="border border-black p-3 rounded space-y-1">
                  <p className="font-bold uppercase text-[11px]">3. Kesepakatan &amp; Rencana Tindak Lanjut:</p>
                  <p className="leading-relaxed text-justify">
                    {layananBlankMode ? (
                      <span className="block h-20 text-gray-400 italic">
                        (Catat langkah konkrit yang disepakati bersama konseli, jadwal evaluasi tindak lanjut...)
                      </span>
                    ) : (
                      tindakLanjutLayanan
                    )}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs text-center">
                  <div className="space-y-14">
                    <p>Konseli / Siswa Terkait</p>
                    <p className="font-bold underline">( {layananBlankMode ? '_____________________' : selectedSiswaLayanan?.nama} )</p>
                  </div>
                  <div className="space-y-14">
                    <p>Guru Pembimbing Konseling (BK)</p>
                    <div>
                      <p className="font-bold underline">( {guruNama} )</p>
                      <p className="text-[10px] text-gray-700">NIP. {guruNip}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORMAT HOME VISIT */}
            {formatLayanan === 'homevisit' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="border border-black p-3 rounded space-y-2">
                  <p className="font-bold uppercase text-[11px]">1. Tujuan Kunjungan Rumah:</p>
                  <p className="leading-relaxed">
                    Menjalin silaturahmi, klarifikasi permasalahan ketidakhadiran/disiplin belajar siswa, serta membangun kerja sama pembinaan bersama orang tua di lingkungan tempat tinggal.
                  </p>
                </div>

                <div className="border border-black p-3 rounded space-y-2">
                  <p className="font-bold uppercase text-[11px]">2. Hasil Observasi Lingkungan Keluarga:</p>
                  <div className="h-24 border border-dashed border-gray-400 p-2 text-gray-500 italic">
                    (Catatan kondisi fisik rumah, suasana hubungan keluarga, orang tua/anggota keluarga yang ditemui...)
                  </div>
                </div>

                <div className="border border-black p-3 rounded space-y-2">
                  <p className="font-bold uppercase text-[11px]">3. Komitmen &amp; Hasil Kesepakatan dengan Orang Tua:</p>
                  <div className="h-24 border border-dashed border-gray-400 p-2 text-gray-500 italic">
                    (Tindakan yang akan dilakukan orang tua di rumah untuk memantau waktu belajar dan kedisiplinan siswa...)
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs text-center">
                  <div className="space-y-14">
                    <p>Orang Tua / Wali yang Dikunjungi</p>
                    <p className="font-bold underline">( {layananBlankMode ? '_____________________' : selectedSiswaLayanan?.ortu || '____________________'} )</p>
                  </div>
                  <div className="space-y-14">
                    <p>Petugas Home Visit Guru BK</p>
                    <div>
                      <p className="font-bold underline">( {guruNama} )</p>
                      <p className="text-[10px] text-gray-700">NIP. {guruNip}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORMAT KONFERENSI KASUS */}
            {formatLayanan === 'konferensi' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="border border-black p-3 rounded space-y-2">
                  <p className="font-bold uppercase text-[11px]">Ringkasan Masalah Kasus Siswa:</p>
                  <p className="leading-relaxed">
                    Pembahasan masalah kedisiplinan dan keberlanjutan proses belajar siswa yang membutuhkan penanganan terpadu lintas pihak di sekolah.
                  </p>
                </div>

                <div className="border border-black p-3 rounded space-y-2">
                  <p className="font-bold uppercase text-[11px]">Daftar Pihak yang Hadir &amp; Tanda Tangan:</p>
                  <table className="w-full text-xs border border-black border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black font-bold text-center">
                        <th className="border border-black p-1.5 w-8">No</th>
                        <th className="border border-black p-1.5">Unsur / Jabatan</th>
                        <th className="border border-black p-1.5">Nama Pejabat / Pihak</th>
                        <th className="border border-black p-1.5 w-36">Tanda Tangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-8">
                        <td className="border border-black p-1 text-center">1</td>
                        <td className="border border-black p-1 font-semibold">Kepala Sekolah / Wakil</td>
                        <td className="border border-black p-1">{kepsekNama}</td>
                        <td className="border border-black p-1"></td>
                      </tr>
                      <tr className="h-8">
                        <td className="border border-black p-1 text-center">2</td>
                        <td className="border border-black p-1 font-semibold">Guru Bimbingan Konseling</td>
                        <td className="border border-black p-1">{guruNama}</td>
                        <td className="border border-black p-1"></td>
                      </tr>
                      <tr className="h-8">
                        <td className="border border-black p-1 text-center">3</td>
                        <td className="border border-black p-1 font-semibold">Wali Kelas</td>
                        <td className="border border-black p-1">................................................</td>
                        <td className="border border-black p-1"></td>
                      </tr>
                      <tr className="h-8">
                        <td className="border border-black p-1 text-center">4</td>
                        <td className="border border-black p-1 font-semibold">Orang Tua / Wali Siswa</td>
                        <td className="border border-black p-1">{selectedSiswaLayanan?.ortu || '................................................'}</td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-black p-3 rounded space-y-2">
                  <p className="font-bold uppercase text-[11px]">Keputusan Musyawarah Konferensi Kasus:</p>
                  <div className="h-24 border border-dashed border-gray-400 p-2 text-gray-500 italic">
                    (Tuliskan keputusan akhir, masa pembinaan, sanksi/bimbingan berkala yang wajib dijalani...)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. BAGIAN: KARTU REKAM JEJAK / DOSSIER SISWA                  */}
      {/* ============================================================ */}
      {activeSubmenu === 'kartu' && (
        <div className="space-y-4">
          {/* Controls Dossier */}
          <div className="bg-white dark:bg-[#1A2E27] p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#647169] dark:text-gray-400 block mb-1">
                  Pilih Siswa Dossier
                </label>
                <select
                  value={selectedSiswaKartuId}
                  onChange={(e) => setSelectedSiswaKartuId(e.target.value)}
                  className="px-3 py-2 bg-[#EFF2EA]/60 dark:bg-black/30 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold text-[#1D4137] dark:text-gray-100 min-w-[220px]"
                >
                  {activeSiswa.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas || '-'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSiswaKartu && (
                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-[#1D4137] text-xs font-bold border border-emerald-300">
                    Kelas {selectedSiswaKartu.kelas || '-'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                    Akumulasi: {totalPoinSiswa} Poin
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() =>
                handlePrintSubmenu(
                  'kartuPrintArea',
                  `Kartu Rekam Jejak BK - ${selectedSiswaKartu?.nama}`,
                  'portrait'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5F52] text-white rounded-xl font-bold text-xs hover:bg-[#1D4137] shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Siswa (Print)</span>
            </button>
          </div>

          {/* Area Cetak Kartu Rekam Jejak */}
          <div id="kartuPrintArea" className="print-area bg-white p-8 sm:p-10 rounded-2xl border border-[#D9E0D4] shadow-sm text-black max-w-4xl mx-auto space-y-6">
            {renderKopSurat('KARTU REKAM JEJAK BIMBINGAN KONSELING & KEDISIPLINAN SISWA')}

            {/* Biodata Siswa Dossier */}
            <div className="border border-black p-3.5 rounded-lg space-y-1.5 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-black pb-1.5">
                <h3 className="font-bold text-sm uppercase">Profil &amp; Data Pribadi Peserta Didik</h3>
                <span className="font-mono text-xs">Tahun Ajaran {currentTahunAjaran()}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs pt-1">
                <div>
                  Nama Lengkap: <strong className="font-sans font-bold text-sm">{selectedSiswaKartu?.nama}</strong>
                </div>
                <div>
                  NIS / NISN: <strong>{selectedSiswaKartu?.nis || '-'}</strong>
                </div>
                <div>
                  Kelas Saat Ini: <strong>{selectedSiswaKartu?.kelas || '-'}</strong>
                </div>
                <div>
                  Jenis Kelamin: <strong>{selectedSiswaKartu?.jk === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</strong>
                </div>
                <div>
                  Orang Tua / Wali: <strong>{selectedSiswaKartu?.ortu || '-'}</strong>
                </div>
                <div>
                  Kontak Telepon: <strong>{selectedSiswaKartu?.hp || '-'}</strong>
                </div>
                <div className="col-span-2">
                  Alamat Tempat Tinggal: <strong>{selectedSiswaKartu?.alamat || '-'}</strong>
                </div>
              </div>

              {/* Status Kedisiplinan Badge */}
              <div className="mt-2 pt-2 border-t border-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>Status Pelanggaran: </span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    totalPoinSiswa >= 75
                      ? 'bg-red-200 text-red-900 border border-red-400'
                      : totalPoinSiswa >= 40
                      ? 'bg-amber-200 text-amber-900 border border-amber-400'
                      : 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                  }`}>
                    {totalPoinSiswa >= 75
                      ? 'Perlu Perhatian Khusus / Skorsing'
                      : totalPoinSiswa >= 40
                      ? 'Peringatan / Pembinaan Intensif'
                      : 'Baik / Dalam Batas Wajar'}
                  </span>
                </div>
                <span className="font-bold text-xs">Total Poin: {totalPoinSiswa} Poin</span>
              </div>
            </div>

            {/* Riwayat Kasus */}
            <div className="space-y-2 font-sans text-xs">
              <h4 className="font-bold uppercase font-serif text-xs border-b border-black pb-1">
                1. Riwayat Catatan Kasus &amp; Pelanggaran ({riwayatKasusSiswa.length})
              </h4>
              <table className="w-full text-xs border border-black border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black p-1.5 w-8">No</th>
                    <th className="border border-black p-1.5 w-20">Tanggal</th>
                    <th className="border border-black p-1.5 w-16">Tingkat</th>
                    <th className="border border-black p-1.5 w-12">Poin</th>
                    <th className="border border-black p-1.5">Deskripsi Pelanggaran</th>
                    <th className="border border-black p-1.5">Tindak Lanjut Pembinaan</th>
                    <th className="border border-black p-1.5 w-16">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatKasusSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-gray-500 italic border border-black">
                        Tidak ada riwayat pelanggaran kasus (Siswa berkelakuan baik).
                      </td>
                    </tr>
                  ) : (
                    riwayatKasusSiswa.map((k, idx) => (
                      <tr key={k.id} className="border-b border-black">
                        <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-black p-1 text-center whitespace-nowrap">{fmtDate(k.tanggal)}</td>
                        <td className="border border-black p-1 text-center uppercase font-bold text-[10px]">{k.jenis}</td>
                        <td className="border border-black p-1 text-center font-bold text-rose-700">+{k.poin}</td>
                        <td className="border border-black p-1 leading-tight">{k.deskripsi}</td>
                        <td className="border border-black p-1 leading-tight text-[11px]">{k.tindakLanjut || '-'}</td>
                        <td className="border border-black p-1 text-center capitalize text-[10px]">{k.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Riwayat Keterlambatan */}
            <div className="space-y-2 font-sans text-xs">
              <h4 className="font-bold uppercase font-serif text-xs border-b border-black pb-1">
                2. Riwayat Keterlambatan Masuk Sekolah ({riwayatTerlambatSiswa.length})
              </h4>
              <table className="w-full text-xs border border-black border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black p-1.5 w-8">No</th>
                    <th className="border border-black p-1.5 w-24">Tanggal</th>
                    <th className="border border-black p-1.5 w-20">Jam Tiba</th>
                    <th className="border border-black p-1.5 w-24">Durasi Telat</th>
                    <th className="border border-black p-1.5">Alasan / Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatTerlambatSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-2.5 text-center text-gray-500 italic border border-black">
                        Tidak ada riwayat keterlambatan (Siswa selalu hadir tepat waktu).
                      </td>
                    </tr>
                  ) : (
                    riwayatTerlambatSiswa.map((t, idx) => (
                      <tr key={t.id} className="border-b border-black">
                        <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-black p-1 text-center">{fmtDate(t.tanggal)}</td>
                        <td className="border border-black p-1 text-center font-mono">{t.jam || '-'}</td>
                        <td className="border border-black p-1 text-center">{t.menit ? `${t.menit} Menit` : '-'}</td>
                        <td className="border border-black p-1">{t.keterangan || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Riwayat Konseling */}
            <div className="space-y-2 font-sans text-xs">
              <h4 className="font-bold uppercase font-serif text-xs border-b border-black pb-1">
                3. Riwayat Sesi Layanan Bimbingan &amp; Konseling ({riwayatKonselingSiswa.length})
              </h4>
              <table className="w-full text-xs border border-black border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black p-1.5 w-8">No</th>
                    <th className="border border-black p-1.5 w-24">Tanggal</th>
                    <th className="border border-black p-1.5 w-20">Jenis Layanan</th>
                    <th className="border border-black p-1.5">Topik / Permasalahan</th>
                    <th className="border border-black p-1.5">Hasil &amp; Kesepakatan Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatKonselingSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-2.5 text-center text-gray-500 italic border border-black">
                        Belum ada catatan konseling individual.
                      </td>
                    </tr>
                  ) : (
                    riwayatKonselingSiswa.map((c, idx) => (
                      <tr key={c.id} className="border-b border-black">
                        <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-black p-1 text-center">{fmtDate(c.tanggal)}</td>
                        <td className="border border-black p-1 text-center capitalize">{c.jenis}</td>
                        <td className="border border-black p-1 font-semibold">{c.topik}</td>
                        <td className="border border-black p-1 text-[11px]">{c.tindakLanjut || c.catatan || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Catatan Evaluasi Akhir & Tanda Tangan */}
            <div className="border border-black p-3 rounded text-xs space-y-1">
              <p className="font-bold uppercase text-[10px] text-gray-700">Catatan &amp; Evaluasi Guru BK:</p>
              <div className="h-14 border border-dashed border-gray-400 p-2 text-gray-500 italic">
                (Tuliskan rekomendasi pembinaan akademik/karakter, catatan khusus wali kelas atau arahan bagi orang tua...)
              </div>
            </div>

            {renderTandaTanganResmi({
              kiriJabatan: 'Mengetahui,\nWali Kelas',
              kiriNama: '_________________________',
              kiriNip: '_________________________',
              kananJabatan: 'Guru Bimbingan Konseling (BK)',
            })}
          </div>
        </div>
      )}
    </div>
  );
};
