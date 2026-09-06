import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  UserX,
  BarChart3,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  UserSquare2,
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

interface LaporanViewProps {
  siswaList: Siswa[];
  kasusList: Kasus[];
  konselingList: Konseling[];
  terlambatList: Terlambat[];
  absensiList?: Absensi[];
  kelasList?: KelasItem[];
  currentUser?: UserAccount;
}

type TabLaporan = 'kasus' | 'terlambat' | 'keluar' | 'bulanan';

export const LaporanView: React.FC<LaporanViewProps> = ({
  siswaList,
  kasusList,
  konselingList,
  terlambatList,
  absensiList = [],
  kelasList = [],
  currentUser,
}) => {
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState<TabLaporan>('kasus');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [search, setSearch] = useState('');

  // Sub-filter for Kasus
  const [filterTingkatKasus, setFilterTingkatKasus] = useState('');
  const [filterStatusKasus, setFilterStatusKasus] = useState('');

  // Sub-filter for Siswa Keluar
  const [filterStatusKeluar, setFilterStatusKeluar] = useState('');

  // Nama & NIP Kepala Sekolah (untuk kolom tanda tangan pada cetak & PDF)
  // Disimpan otomatis di browser (localStorage) agar tidak perlu diisi ulang tiap cetak.
  const [kepsekNama, setKepsekNama] = useState(() => localStorage.getItem('mbg_kepsek_nama') || '');
  const [kepsekNip, setKepsekNip] = useState(() => localStorage.getItem('mbg_kepsek_nip') || '');

  // Nama & NIP Guru BK (untuk kolom tanda tangan pada cetak & PDF)
  // Default mengikuti akun yang sedang login, tapi bisa diganti manual & tersimpan di browser.
  const [guruNama, setGuruNama] = useState(
    () => localStorage.getItem('mbg_guru_nama') || currentUser?.nama || ''
  );
  const [guruNip, setGuruNip] = useState(
    () => localStorage.getItem('mbg_guru_nip') || currentUser?.nip || ''
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

  // Month & Year parsing
  const [yearStr, monthStr] = selectedBulan.split('-');
  const y = Number(yearStr) || new Date().getFullYear();
  const m = Number(monthStr) || new Date().getMonth() + 1;
  const monthName = BULAN[m - 1] || 'Bulan';
  const periodeLabel = selectedBulan ? `${monthName} ${y}` : 'Semua Periode (Keseluruhan Data)';

  // All unique classes
  const allKelasNames = useMemo(() => {
    const setK = new Set<string>();
    kelasList.forEach((k) => setK.add(k.nama));
    siswaList.forEach((s) => s.kelas && setK.add(s.kelas));
    return Array.from(setK).sort();
  }, [kelasList, siswaList]);

  // Siswa map for quick lookup
  const siswaMap = useMemo(() => {
    const map = new Map<string, Siswa>();
    siswaList.forEach((s) => map.set(s.id, s));
    return map;
  }, [siswaList]);

  // Active students
  const activeSiswa = useMemo(() => {
    return siswaList.filter((s) => (s.status || 'aktif') === 'aktif');
  }, [siswaList]);

  // Inactive students (Pindah / Keluar / Berhenti)
  const inactiveSiswa = useMemo(() => {
    return siswaList.filter((s) => (s.status || 'aktif') !== 'aktif');
  }, [siswaList]);

  // 1. Filtered Kasus List
  const filteredKasus = useMemo(() => {
    return kasusList.filter((k) => {
      const s = siswaMap.get(k.siswaId);
      if (selectedBulan && k.tanggal && !k.tanggal.startsWith(selectedBulan)) return false;
      if (selectedKelas && s?.kelas !== selectedKelas) return false;
      if (filterTingkatKasus && k.jenis !== filterTingkatKasus) return false;
      if (filterStatusKasus && k.status !== filterStatusKasus) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchNama = s?.nama.toLowerCase().includes(q);
        const matchNis = s?.nis?.toLowerCase().includes(q);
        const matchDesk = k.deskripsi?.toLowerCase().includes(q);
        const matchTindak = k.tindakLanjut?.toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchDesk && !matchTindak) return false;
      }
      return true;
    });
  }, [kasusList, siswaMap, selectedBulan, selectedKelas, filterTingkatKasus, filterStatusKasus, search]);

  // 2. Filtered Terlambat List
  const filteredTerlambat = useMemo(() => {
    return terlambatList.filter((t) => {
      const s = siswaMap.get(t.siswaId);
      if (selectedBulan && t.tanggal && !t.tanggal.startsWith(selectedBulan)) return false;
      if (selectedKelas && s?.kelas !== selectedKelas) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchNama = s?.nama.toLowerCase().includes(q);
        const matchNis = s?.nis?.toLowerCase().includes(q);
        const matchKet = t.keterangan?.toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchKet) return false;
      }
      return true;
    });
  }, [terlambatList, siswaMap, selectedBulan, selectedKelas, search]);

  // 3. Filtered Siswa Keluar List
  const filteredSiswaKeluar = useMemo(() => {
    return inactiveSiswa.filter((s) => {
      if (selectedKelas && s.kelas !== selectedKelas) return false;
      if (filterStatusKeluar && s.status !== filterStatusKeluar) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchNama = s.nama.toLowerCase().includes(q);
        const matchNis = s.nis?.toLowerCase().includes(q);
        const matchCat = s.catatan?.toLowerCase().includes(q);
        const matchOrtu = s.ortu?.toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchCat && !matchOrtu) return false;
      }
      return true;
    });
  }, [inactiveSiswa, selectedKelas, filterStatusKeluar, search]);

  // 4. Statistics for Rekap Bulanan
  const kasusBulan = selectedBulan ? kasusList.filter((k) => k.tanggal && k.tanggal.startsWith(selectedBulan)) : kasusList;
  const konselingBulan = selectedBulan ? konselingList.filter((c) => c.tanggal && c.tanggal.startsWith(selectedBulan)) : konselingList;
  const terlambatBulan = selectedBulan ? terlambatList.filter((t) => t.tanggal && t.tanggal.startsWith(selectedBulan)) : terlambatList;

  const getPoin = (id: string) =>
    kasusList.filter((k) => k.siswaId === id).reduce((sum, k) => sum + (Number(k.poin) || 0), 0);

  const topPoinRanked = useMemo(() => {
    return activeSiswa
      .map((s) => ({ siswa: s, poin: getPoin(s.id) }))
      .filter((x) => x.poin > 0)
      .sort((a, b) => b.poin - a.poin)
      .slice(0, 10);
  }, [activeSiswa, kasusList]);

  const topTerlambatRanked = useMemo(() => {
    const map: Record<string, number> = {};
    terlambatBulan.forEach((t) => {
      map[t.siswaId] = (map[t.siswaId] || 0) + 1;
    });
    return Object.entries(map)
      .map(([siswaId, count]) => ({
        siswa: activeSiswa.find((s) => s.id === siswaId),
        count,
      }))
      .filter((x) => x.siswa)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [terlambatBulan, activeSiswa]);

  // Handlers for Excel Export
  const handleExportTabExcel = () => {
    const currentPeriode = selectedBulan ? `${monthName} ${y}` : 'Semua Periode';
    if (activeTab === 'kasus') {
      exportKasusToExcel(filteredKasus, siswaList, {
        periode: currentPeriode,
        kelas: selectedKelas,
      });
    } else if (activeTab === 'terlambat') {
      exportTerlambatToExcel(filteredTerlambat, siswaList, {
        periode: currentPeriode,
        kelas: selectedKelas,
      });
    } else if (activeTab === 'keluar') {
      exportSiswaKeluarToExcel(filteredSiswaKeluar, kasusList, konselingList);
    } else if (activeTab === 'bulanan') {
      exportRekapBulananToExcel(
        siswaList,
        kasusList,
        konselingList,
        terlambatList,
        absensiList,
        currentPeriode
      );
    }
  };

  const handleExportTabPDF = () => {
    const meta = {
      periode: selectedBulan ? `${monthName} ${y}` : 'Semua Periode',
      kelas: selectedKelas,
      currentUser,
      kepalaSekolahNama: kepsekNama,
      kepalaSekolahNip: kepsekNip,
      guruBkNama: guruNama,
      guruBkNip: guruNip,
    };

    if (activeTab === 'kasus') {
      exportKasusToPDF(filteredKasus, siswaList, meta);
    } else if (activeTab === 'terlambat') {
      exportTerlambatToPDF(filteredTerlambat, siswaList, meta);
    } else if (activeTab === 'keluar') {
      exportSiswaKeluarToPDF(filteredSiswaKeluar, kasusList, meta);
    } else if (activeTab === 'bulanan') {
      exportRekapBulananToPDF(siswaList, kasusList, terlambatList, meta);
    }
  };

  const handleExportAllExcel = () => {
    exportSemuaLaporanMultiSheet({
      siswaList,
      kasusList,
      konselingList,
      terlambatList,
      absensiList,
    });
  };

  const handlePrint = () => {
    printDirectElement('laporanPrintArea', {
      title: `Laporan BK - ${activeTab.toUpperCase()} - ${branding.schoolName || 'Sekolah'}`,
      orientation: activeTab === 'kasus' || activeTab === 'bulanan' ? 'landscape' : 'portrait',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Box (Hidden when printing) */}
      <div className="bg-[#FAFBF9] border border-[#D9E0D4] rounded-2xl p-5 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2D5F52]" />
              Laporan & Rekapitulasi BK
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cetak langsung dokumen resmi siap tanda tangan ke printer, atau unduh ke format Excel / PDF jika diperlukan.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2D5F52] hover:bg-[#1D4137] text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] ring-2 ring-[#2D5F52]/30"
              title="Cetak langsung ke printer fisik / dialog cetak browser tanpa download file"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Langsung (Print)</span>
            </button>

            <button
              onClick={handleExportTabExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              title="Unduh data tabel aktif saat ini ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportTabPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              title="Unduh file dokumen PDF (.pdf) ke komputer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleExportAllExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3E35] hover:bg-[#152E27] text-emerald-300 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98] border border-emerald-800"
              title="Unduh seluruh data kasus, keterlambatan, siswa keluar, dan rekap dalam 1 file Excel multi-sheet"
            >
              <Layers className="w-4 h-4" />
              <span>Semua Sheet (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#D9E0D4]">
          <button
            onClick={() => setActiveTab('kasus')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'kasus'
                ? 'bg-[#2D5F52] text-white border-[#2D5F52] shadow-xs'
                : 'bg-white text-gray-700 border-[#D9E0D4] hover:bg-[#F0F4EE]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Kasus & Pelanggaran</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {filteredKasus.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('terlambat')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'terlambat'
                ? 'bg-[#2D5F52] text-white border-[#2D5F52] shadow-xs'
                : 'bg-white text-gray-700 border-[#D9E0D4] hover:bg-[#F0F4EE]'
            }`}
          >
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Keterlambatan Siswa</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {filteredTerlambat.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('keluar')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'keluar'
                ? 'bg-[#2D5F52] text-white border-[#2D5F52] shadow-xs'
                : 'bg-white text-gray-700 border-[#D9E0D4] hover:bg-[#F0F4EE]'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-400" />
            <span>Siswa Pindah / Keluar</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {filteredSiswaKeluar.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bulanan')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'bulanan'
                ? 'bg-[#2D5F52] text-white border-[#2D5F52] shadow-xs'
                : 'bg-white text-gray-700 border-[#D9E0D4] hover:bg-[#F0F4EE]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Rekap Bulanan & Statistik</span>
          </button>
        </div>

        {/* Sub-Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {/* Periode Filter (for Kasus, Terlambat, Bulanan) */}
          {activeTab !== 'keluar' && (
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#D9E0D4] shadow-2xs">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-gray-700 mr-1">Periode:</span>
              <button
                type="button"
                onClick={() => setSelectedBulan('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  !selectedBulan
                    ? 'bg-[#2D5F52] text-white shadow-2xs'
                    : 'bg-[#EFF2EA] text-[#2D5F52] hover:bg-[#D9E0D4]'
                }`}
              >
                Semua Periode
              </button>
              <button
                type="button"
                onClick={() => setSelectedBulan(thisMonthKey())}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedBulan === thisMonthKey()
                    ? 'bg-[#2D5F52] text-white shadow-2xs'
                    : 'bg-[#EFF2EA] text-[#2D5F52] hover:bg-[#D9E0D4]'
                }`}
              >
                Bulan Ini
              </button>
              <input
                type="month"
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="bg-[#EFF2EA]/80 px-2 py-1 rounded-lg text-xs font-semibold text-gray-800 outline-none cursor-pointer border border-[#D9E0D4]"
                title="Pilih Bulan & Tahun Tertentu"
              />
            </div>
          )}

          {/* Kelas Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#D9E0D4]">
            <Filter className="w-4 h-4 text-gray-400" />
            <label className="text-xs font-bold text-gray-700">Kelas:</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 outline-none"
            >
              <option value="">Semua Kelas</option>
              {allKelasNames.map((k) => (
                <option key={k} value={k}>Kelas {k}</option>
              ))}
            </select>
          </div>

          {/* Sub-filter Kasus */}
          {activeTab === 'kasus' && (
            <>
              <select
                value={filterTingkatKasus}
                onChange={(e) => setFilterTingkatKasus(e.target.value)}
                className="bg-white border border-[#D9E0D4] text-gray-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none"
              >
                <option value="">Semua Tingkat</option>
                <option value="ringan">Kasus Ringan</option>
                <option value="sedang">Kasus Sedang</option>
                <option value="berat">Kasus Berat</option>
              </select>

              <select
                value={filterStatusKasus}
                onChange={(e) => setFilterStatusKasus(e.target.value)}
                className="bg-white border border-[#D9E0D4] text-gray-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none"
              >
                <option value="">Semua Status</option>
                <option value="baru">Status Baru</option>
                <option value="proses">Sedang Diproses</option>
                <option value="selesai">Selesai</option>
              </select>
            </>
          )}

          {/* Sub-filter Siswa Keluar */}
          {activeTab === 'keluar' && (
            <select
              value={filterStatusKeluar}
              onChange={(e) => setFilterStatusKeluar(e.target.value)}
              className="bg-white border border-[#D9E0D4] text-gray-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none"
            >
              <option value="">Semua Status Keluar</option>
              <option value="berhenti">Berhenti Sekolah</option>
              <option value="pindah">Pindah Sekolah</option>
              <option value="keluar">Keluar</option>
            </select>
          )}

          {/* Search Input */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa / NIS / keterangan..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#D9E0D4] rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#2D5F52]/20"
            />
          </div>
        </div>

        {/* Input Nama & NIP Kepala Sekolah -- dipakai di kolom tanda tangan cetak/PDF */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#D9E0D4] shadow-2xs">
            <UserSquare2 className="w-4 h-4 text-[#2D5F52]" />
            <span className="text-xs font-bold text-gray-700">Kepala Sekolah:</span>
          </div>
          <input
            type="text"
            value={kepsekNama}
            onChange={(e) => setKepsekNama(e.target.value)}
            placeholder="Nama Kepala Sekolah"
            className="min-w-[180px] flex-1 px-3 py-2 bg-white border border-[#D9E0D4] rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#2D5F52]/20"
          />
          <input
            type="text"
            value={kepsekNip}
            onChange={(e) => setKepsekNip(e.target.value)}
            placeholder="NIP Kepala Sekolah"
            className="min-w-[160px] flex-1 px-3 py-2 bg-white border border-[#D9E0D4] rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#2D5F52]/20"
          />
        </div>

        {/* Input Nama & NIP Guru BK -- dipakai di kolom tanda tangan cetak/PDF */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#D9E0D4] shadow-2xs">
            <UserSquare2 className="w-4 h-4 text-[#2D5F52]" />
            <span className="text-xs font-bold text-gray-700">Guru BK:</span>
          </div>
          <input
            type="text"
            value={guruNama}
            onChange={(e) => setGuruNama(e.target.value)}
            placeholder="Nama Guru BK"
            className="min-w-[180px] flex-1 px-3 py-2 bg-white border border-[#D9E0D4] rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#2D5F52]/20"
          />
          <input
            type="text"
            value={guruNip}
            onChange={(e) => setGuruNip(e.target.value)}
            placeholder="NIP Guru BK"
            className="min-w-[160px] flex-1 px-3 py-2 bg-white border border-[#D9E0D4] rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#2D5F52]/20"
          />
        </div>
      </div>

      {/* Direct Print Document Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 px-4 rounded-xl border border-[#D9E0D4] shadow-xs print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Printer className="w-4 h-4 text-[#2D5F52]" />
          <span>Pratinjau Lembar Cetak Dokumen Resmi</span>
          <span className="text-[11px] text-gray-500 font-normal hidden md:inline">
            (Klik tombol untuk langsung membuka dialog cetak printer tanpa mengunduh file)
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#2D5F52] hover:bg-[#1D4137] text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Ini Sekarang</span>
        </button>
      </div>

      {/* Printable Document Paper */}
      <div
        id="laporanPrintArea"
        className="print-area bg-white text-gray-900 border border-gray-200 p-8 sm:p-12 rounded-2xl shadow-xs print:p-0 print:border-none print:shadow-none min-h-[750px] font-sans"
      >
        {/* Kop Surat Resmi */}
        <div className="flex flex-col items-center justify-center border-b-2 border-gray-900 pb-4 mb-6 text-center">
          {/* Logo Sekolah di atas Nama Sekolah */}
          {branding.showLogoOnPrint && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
              <img
                src={branding.schoolLogo || '/logo.png?v=5'}
                alt={branding.schoolName || 'Logo Sekolah'}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-gray-900">
            {branding.schoolName ? branding.schoolName.toUpperCase() : 'MEDIA BANTU GURU'}
          </h2>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-gray-900 mt-1">
            LAPORAN BIMBINGAN DAN KONSELING (BK)
          </h1>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Tahun Ajaran {currentTahunAjaran()} • Semester {currentSemester()}
            {branding.kopSubHeader && ` • ${branding.kopSubHeader}`}
          </p>
        </div>

        {/* Sub Header Laporan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs font-semibold text-gray-700 pb-2 border-b border-gray-200">
          <div>
            <span>Laporan: </span>
            <span className="font-bold text-gray-900 uppercase">
              {activeTab === 'kasus' && 'Daftar Catatan Kasus & Pelanggaran Siswa'}
              {activeTab === 'terlambat' && 'Rekapitulasi Keterlambatan Masuk Siswa'}
              {activeTab === 'keluar' && 'Daftar Siswa Pindah / Keluar / Berhenti'}
              {activeTab === 'bulanan' && `Rekapitulasi Kedisiplinan & Evaluasi Siswa (${periodeLabel})`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {activeTab !== 'keluar' && (
              <div>
                <span>Periode: </span>
                <span className="font-bold text-gray-900">{periodeLabel}</span>
              </div>
            )}
            {selectedKelas && (
              <div>
                <span>Kelas: </span>
                <span className="font-bold text-gray-900">{selectedKelas}</span>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: KASUS & PELANGGARAN */}
        {activeTab === 'kasus' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-bold">
                    <th className="border border-gray-400 px-2 py-2 w-10 text-center">No</th>
                    <th className="border border-gray-400 px-2.5 py-2 text-center w-24">Tanggal</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Nama Siswa</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-16">Kelas</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-20">Tingkat</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-14">Poin</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Uraian Kasus / Pelanggaran</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Tindak Lanjut / Sanksi</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKasus.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500 italic border border-gray-400">
                        Tidak ada data kasus & pelanggaran siswa yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredKasus.map((k, idx) => {
                      const s = siswaMap.get(k.siswaId);
                      return (
                        <tr key={k.id} className="hover:bg-gray-50/50">
                          <td className="border border-gray-400 px-2 py-2 text-center">{idx + 1}</td>
                          <td className="border border-gray-400 px-2.5 py-2 text-center whitespace-nowrap">
                            {k.tanggal ? fmtDate(k.tanggal) : '-'}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 font-bold text-gray-900">
                            <div>{s?.nama || '-'}</div>
                            {s?.nis && <div className="text-[10px] text-gray-500 font-normal">NIS: {s.nis}</div>}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-semibold">
                            {s?.kelas || '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center uppercase font-bold text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                k.jenis === 'berat'
                                  ? 'bg-rose-100 text-rose-800'
                                  : k.jenis === 'sedang'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {k.jenis}
                            </span>
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-mono font-bold text-rose-600">
                            {k.poin} pt
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-gray-800">
                            {k.deskripsi}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-gray-700">
                            {k.tindakLanjut || '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center uppercase font-semibold text-[10px]">
                            {k.status}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Rekap Total Poin & Kasus */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-300">
              <div>
                Total Catatan Kasus: <strong className="text-gray-900">{filteredKasus.length}</strong> kasus
              </div>
              <div>
                Total Poin Pelanggaran: <strong className="text-rose-600 font-mono">{filteredKasus.reduce((sum, k) => sum + (Number(k.poin) || 0), 0)} pt</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KETERLAMBATAN */}
        {activeTab === 'terlambat' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-bold">
                    <th className="border border-gray-400 px-2 py-2 w-10 text-center">No</th>
                    <th className="border border-gray-400 px-2.5 py-2 text-center w-24">Tanggal</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-16">Jam</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Nama Siswa</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-16">Kelas</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-14">JK</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-20">Terlambat</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Alasan / Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTerlambat.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500 italic border border-gray-400">
                        Tidak ada data keterlambatan siswa yang tercatat pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTerlambat.map((t, idx) => {
                      const s = siswaMap.get(t.siswaId);
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="border border-gray-400 px-2 py-2 text-center">{idx + 1}</td>
                          <td className="border border-gray-400 px-2.5 py-2 text-center whitespace-nowrap">
                            {t.tanggal ? fmtDate(t.tanggal) : '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-mono">
                            {t.jam || '-'}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 font-bold text-gray-900">
                            <div>{s?.nama || '-'}</div>
                            {s?.nis && <div className="text-[10px] text-gray-500 font-normal">NIS: {s.nis}</div>}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-semibold">
                            {s?.kelas || '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center">
                            {s?.jk || 'L'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-mono font-bold text-orange-600">
                            {t.menit ? `${t.menit} mnt` : '-'}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-gray-800">
                            {t.keterangan || 'Terlambat masuk sekolah'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Rekap Total Terlambat */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-300">
              <div>
                Total Kejadian Terlambat: <strong className="text-gray-900">{filteredTerlambat.length}</strong> kali
              </div>
              <div>
                Total Akumulasi Waktu: <strong className="text-orange-600 font-mono">{filteredTerlambat.reduce((sum, t) => sum + (Number(t.menit) || 0), 0)} menit</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SISWA PINDAH / KELUAR */}
        {activeTab === 'keluar' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-bold">
                    <th className="border border-gray-400 px-2 py-2 w-10 text-center">No</th>
                    <th className="border border-gray-400 px-2.5 py-2 text-center w-24">NIS</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Nama Siswa</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-16">Kelas</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-12">JK</th>
                    <th className="border border-gray-400 px-2.5 py-2 text-center w-24">Status</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Nama Orang Tua / HP</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Catatan / Alasan Keluar</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-14">Kasus</th>
                    <th className="border border-gray-400 px-2 py-2 text-center w-14">Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSiswaKeluar.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-500 italic border border-gray-400">
                        Tidak ada data siswa non-aktif / pindah / keluar yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredSiswaKeluar.map((s, idx) => {
                      const totalKasus = kasusList.filter((k) => k.siswaId === s.id).length;
                      const totalPoin = getPoin(s.id);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                          <td className="border border-gray-400 px-2 py-2 text-center">{idx + 1}</td>
                          <td className="border border-gray-400 px-2.5 py-2 text-center font-mono">
                            {s.nis || '-'}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 font-bold text-gray-900">
                            {s.nama}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-semibold">
                            {s.kelas || '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center">
                            {s.jk || 'L'}
                          </td>
                          <td className="border border-gray-400 px-2.5 py-2 text-center uppercase font-bold text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                s.status === 'berhenti'
                                  ? 'bg-rose-100 text-rose-800'
                                  : s.status === 'pindah'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {s.status === 'berhenti' ? 'Berhenti' : s.status === 'pindah' ? 'Pindah' : 'Keluar'}
                            </span>
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-gray-700">
                            <div>{s.ortu || '-'}</div>
                            {s.hp && <div className="text-[10px] text-gray-500 font-mono">{s.hp}</div>}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-gray-800">
                            {s.catatan || '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-mono">
                            {totalKasus}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-mono font-bold text-rose-600">
                            {totalPoin}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Rekap Total Siswa Keluar */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-300">
              <div>
                Total Siswa Pindah / Keluar / Berhenti: <strong className="text-gray-900">{filteredSiswaKeluar.length}</strong> siswa
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REKAP BULANAN & STATISTIK */}
        {activeTab === 'bulanan' && (
          <div className="space-y-6">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-300">
                <span className="text-xs font-bold text-gray-500 uppercase block">Total Kasus Bulan Ini</span>
                <span className="font-serif font-bold text-2xl text-gray-900 mt-1 block">{kasusBulan.length}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-300">
                <span className="text-xs font-bold text-gray-500 uppercase block">Sesi Konseling</span>
                <span className="font-serif font-bold text-2xl text-emerald-700 mt-1 block">{konselingBulan.length}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-300">
                <span className="text-xs font-bold text-gray-500 uppercase block">Keterlambatan</span>
                <span className="font-serif font-bold text-2xl text-orange-600 mt-1 block">{terlambatBulan.length}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-300">
                <span className="text-xs font-bold text-gray-500 uppercase block">Kasus Berat</span>
                <span className="font-serif font-bold text-2xl text-rose-600 mt-1 block">
                  {kasusBulan.filter((k) => k.jenis === 'berat').length}
                </span>
              </div>
            </div>

            {/* Tables Row: Top Poin & Top Terlambat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Poin */}
              <div className="bg-white rounded-xl border border-gray-300 p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  10 Siswa Poin Pelanggaran Tertinggi ({monthName} {y})
                </h3>

                {topPoinRanked.length === 0 ? (
                  <p className="text-xs text-center py-6 text-gray-400 italic">Belum ada poin pelanggaran tercatat.</p>
                ) : (
                  <table className="w-full text-xs border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 text-gray-900 font-bold">
                        <th className="border border-gray-300 px-2 py-1.5 w-8 text-center">No</th>
                        <th className="border border-gray-300 px-3 py-1.5 text-left">Nama Siswa</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">Kelas</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-right">Poin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPoinRanked.map(({ siswa, poin }, idx) => (
                        <tr key={siswa.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                          <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-900">{siswa.nama}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Kelas {siswa.kelas || '-'}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right font-mono font-bold text-rose-600">{poin} pt</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Top Terlambat */}
              <div className="bg-white rounded-xl border border-gray-300 p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  10 Siswa Paling Sering Terlambat ({monthName} {y})
                </h3>

                {topTerlambatRanked.length === 0 ? (
                  <p className="text-xs text-center py-6 text-gray-400 italic">Seluruh siswa hadir tepat waktu bulan ini.</p>
                ) : (
                  <table className="w-full text-xs border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 text-gray-900 font-bold">
                        <th className="border border-gray-300 px-2 py-1.5 w-8 text-center">No</th>
                        <th className="border border-gray-300 px-3 py-1.5 text-left">Nama Siswa</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">Kelas</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-right">Frekuensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTerlambatRanked.map(({ siswa, count }, idx) => (
                        <tr key={siswa!.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                          <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-900">{siswa!.nama}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Kelas {siswa!.kelas || '-'}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right font-mono font-bold text-orange-600">{count}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lembar Tanda Tangan Resmi Pengesahan */}
        <div className="mt-12 grid grid-cols-2 gap-8 text-xs text-gray-800">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="font-bold text-gray-900">Kepala Sekolah</p>
            <div className="h-20" />
            <p className="font-bold underline text-gray-900">
              {kepsekNama || '_________________________'}
            </p>
            <p className="text-[11px] text-gray-600">
              NIP. {kepsekNip || '........................................'}
            </p>
          </div>

          <div className="text-center">
            <p>Guru Bimbingan &amp; Konseling,</p>
            <p className="font-bold text-gray-900">Guru BK</p>
            <div className="h-20" />
            <p className="font-bold underline text-gray-900">{guruNama || '_________________________'}</p>
            <p className="text-[11px] text-gray-600">NIP. {guruNip || '........................................'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};