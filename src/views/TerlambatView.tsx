import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Printer,
  FileSpreadsheet,
  Download,
  GraduationCap,
  UserCheck,
  X,
  Check,
  School,
  User,
  Filter,
} from 'lucide-react';
import { Siswa, Terlambat, KelasItem } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { todayISO, fmtDate, thisMonthKey, BULAN, currentTahunAjaran, currentSemester } from '../lib/storage';
import { exportTerlambatToExcel } from '../lib/excelExport';
import { exportTerlambatToPDF } from '../lib/pdfExport';
import { printDirectElement } from '../lib/printHelper';
import { useBranding } from '../lib/branding';

interface TerlambatViewProps {
  siswaList: Siswa[];
  kelasList: KelasItem[];
  terlambatList: Terlambat[];
  presetSiswaId?: string;
  onSaveTerlambat: (t: Partial<Terlambat>, isEdit?: boolean) => void;
  onDeleteTerlambat: (id: string) => void;
  showToast: (msg: string) => void;
}

export const TerlambatView: React.FC<TerlambatViewProps> = ({
  siswaList,
  kelasList,
  terlambatList,
  presetSiswaId,
  onSaveTerlambat,
  onDeleteTerlambat,
  showToast,
}) => {
  const { branding } = useBranding();
  const [mode, setMode] = useState<'catatan' | 'rekap'>('catatan');
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  // Rekap filters
  const [rekapJenis, setRekapJenis] = useState<'bulan' | 'semester' | 'tahun'>('bulan');
  const [rekapBulan, setRekapBulan] = useState(thisMonthKey());
  const [rekapTa, setRekapTa] = useState(currentTahunAjaran());
  const [rekapSemester, setRekapSemester] = useState<'ganjil' | 'genap'>(currentSemester());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Terlambat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Terlambat | null>(null);

  // Search & Filter state inside Modal for adding/editing terlambat
  const [modalFilterKelas, setModalFilterKelas] = useState('');
  const [modalSearchNama, setModalSearchNama] = useState('');

  const activeSiswa = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');

  const [formData, setFormData] = useState<Partial<Terlambat>>({
    siswaId: presetSiswaId || '',
    tanggal: todayISO(),
    jam: '07:15',
    menit: 15,
    keterangan: '',
  });

  // Auto-respond if presetSiswaId changes or is set externally
  useEffect(() => {
    if (presetSiswaId) {
      const s = activeSiswa.find((item) => item.id === presetSiswaId);
      setEditingItem(null);
      setModalSearchNama('');
      if (s?.kelas) {
        setModalFilterKelas(s.kelas);
      }
      setFormData({
        siswaId: presetSiswaId,
        tanggal: todayISO(),
        jam: '07:15',
        menit: 15,
        keterangan: '',
      });
      setIsModalOpen(true);
    }
  }, [presetSiswaId]);

  const allKelasNames = Array.from(
    new Set([...kelasList.map((k) => k.nama), ...siswaList.map((s) => s.kelas || '')].filter(Boolean))
  ).sort();

  // Siswa list filtered for modal by class & search name
  const modalFilteredSiswa = useMemo(() => {
    return activeSiswa.filter((s) => {
      const matchKelas = !modalFilterKelas || s.kelas === modalFilterKelas;
      const q = modalSearchNama.toLowerCase().trim();
      const matchNama =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q));
      return matchKelas && matchNama;
    });
  }, [activeSiswa, modalFilterKelas, modalSearchNama]);

  const selectedStudent = activeSiswa.find((s) => s.id === formData.siswaId);

  const filteredTerlambat = terlambatList.filter((t) => {
    const s = activeSiswa.find((item) => item.id === t.siswaId);
    const q = search.toLowerCase().trim();
    const matchSearch = !q || (s && s.nama.toLowerCase().includes(q)) || (t.keterangan || '').toLowerCase().includes(q);
    const matchKelas = !filterKelas || (s && s.kelas === filterKelas);
    return matchSearch && matchKelas;
  });

  // Calculate Rekap
  const getRekapData = () => {
    let records = [...terlambatList];

    if (rekapJenis === 'bulan') {
      records = records.filter((t) => t.tanggal && t.tanggal.startsWith(rekapBulan));
    } else if (rekapJenis === 'semester') {
      const startYear = rekapTa;
      const startIso = rekapSemester === 'ganjil' ? `${startYear}-07-01` : `${startYear + 1}-01-01`;
      const endIso = rekapSemester === 'ganjil' ? `${startYear}-12-31` : `${startYear + 1}-06-30`;
      records = records.filter((t) => t.tanggal >= startIso && t.tanggal <= endIso);
    } else {
      const startIso = `${rekapTa}-07-01`;
      const endIso = `${rekapTa + 1}-06-30`;
      records = records.filter((t) => t.tanggal >= startIso && t.tanggal <= endIso);
    }

    const map: Record<string, number> = {};
    records.forEach((t) => {
      map[t.siswaId] = (map[t.siswaId] || 0) + 1;
    });

    return Object.entries(map)
      .map(([siswaId, count]) => ({
        siswa: activeSiswa.find((s) => s.id === siswaId),
        count,
      }))
      .filter((x) => x.siswa)
      .sort((a, b) => b.count - a.count);
  };

  const rekapRanked = getRekapData();

  const openAddModal = () => {
    setEditingItem(null);
    setModalSearchNama('');
    const initSiswaId = presetSiswaId || '';
    const presetStudent = initSiswaId ? activeSiswa.find((s) => s.id === initSiswaId) : null;
    if (presetStudent?.kelas) {
      setModalFilterKelas(presetStudent.kelas);
    } else {
      setModalFilterKelas('');
    }
    setFormData({
      siswaId: initSiswaId,
      tanggal: todayISO(),
      jam: '07:15',
      menit: 15,
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Terlambat) => {
    setEditingItem(t);
    setModalSearchNama('');
    const currentStudent = activeSiswa.find((s) => s.id === t.siswaId);
    if (currentStudent?.kelas) {
      setModalFilterKelas(currentStudent.kelas);
    } else {
      setModalFilterKelas('');
    }
    setFormData({ ...t });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siswaId) {
      showToast('Pilih siswa terlebih dahulu');
      return;
    }

    if (editingItem) {
      onSaveTerlambat({ ...editingItem, ...formData }, true);
      showToast('Catatan keterlambatan diperbarui');
    } else {
      onSaveTerlambat(formData, false);
      showToast('Catatan keterlambatan baru ditambahkan');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Mode Sub-navigation */}
      <div className="flex border-b border-[#D9E0D4] dark:border-[#2D483F] gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setMode('catatan')}
          className={`pb-2 px-1 sm:px-2 text-xs font-bold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            mode === 'catatan' ? 'text-[#1D4137] dark:text-[#6EE7B7] border-b-2 border-b-[#C9862E]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          Catatan Harian
        </button>
        <button
          onClick={() => setMode('rekap')}
          className={`pb-2 px-1 sm:px-2 text-xs font-bold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            mode === 'rekap' ? 'text-[#1D4137] dark:text-[#6EE7B7] border-b-2 border-b-[#C9862E]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          Rekap Bulanan / Semester / Tahunan
        </button>
      </div>

      {mode === 'catatan' ? (
        <>
          {/* Controls */}
          <div className="bg-white dark:bg-[#1A2E27] p-3 sm:p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari siswa atau alasan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#EFF2EA]/60 dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] text-[#1D4137] dark:text-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
                />
              </div>

              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-3 py-2 bg-[#EFF2EA]/60 dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold text-[#1D4137] dark:text-gray-200"
              >
                <option value="">Semua Kelas</option>
                {allKelasNames.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
              <button
                onClick={() => exportTerlambatToExcel(filteredTerlambat, siswaList, { kelas: filterKelas })}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 shadow-xs transition-colors cursor-pointer"
                title="Download data keterlambatan ke file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={() => exportTerlambatToPDF(filteredTerlambat, siswaList, { kelas: filterKelas })}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-700 text-white rounded-xl text-xs font-semibold hover:bg-rose-800 shadow-xs transition-colors cursor-pointer"
                title="Download data keterlambatan ke dokumen PDF (.pdf)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold hover:bg-[#1D4137] shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Keterlambatan</span>
              </button>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white rounded-2xl border border-[#D9E0D4] shadow-xs overflow-hidden">
            {filteredTerlambat.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <Clock className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-xs text-[#647169]">Belum ada catatan keterlambatan siswa.</p>
                <button
                  onClick={openAddModal}
                  className="px-3.5 py-1.5 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold"
                >
                  + Catat Keterlambatan Pertama
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EFF2EA]/60 border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Jam Datang</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Durasi</th>
                      <th className="p-3">Keterangan / Alasan</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E0D4]/60">
                    {filteredTerlambat.map((t) => {
                      const s = activeSiswa.find((item) => item.id === t.siswaId);

                      return (
                        <tr key={t.id} className="hover:bg-[#EFF2EA]/50">
                          <td className="p-3 font-mono text-[#647169]">{fmtDate(t.tanggal)}</td>
                          <td className="p-3 font-mono font-bold text-[#1D4137]">{t.jam || '-'}</td>
                          <td className="p-3 font-bold text-[#1D4137]">
                            {s ? `${s.nama} (Kelas ${s.kelas || '-'})` : '(Siswa Dihapus)'}
                          </td>
                          <td className="p-3 font-mono text-[#C9862E] font-bold">
                            {t.menit ? `${t.menit} mnt` : '-'}
                          </td>
                          <td className="p-3 text-[#647169]">{t.keterangan || '-'}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(t)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Rekap View */
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-[#D9E0D4] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={rekapJenis}
                onChange={(e) => setRekapJenis(e.target.value as any)}
                className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-bold text-[#1D4137]"
              >
                <option value="bulan">Rekap Bulanan</option>
                <option value="semester">Rekap Semester</option>
                <option value="tahun">Rekap Tahun Ajaran</option>
              </select>

              {rekapJenis === 'bulan' && (
                <input
                  type="month"
                  value={rekapBulan}
                  onChange={(e) => setRekapBulan(e.target.value)}
                  className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-bold"
                />
              )}

              {rekapJenis === 'semester' && (
                <>
                  <input
                    type="number"
                    value={rekapTa}
                    onChange={(e) => setRekapTa(Number(e.target.value))}
                    className="w-24 px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-bold"
                  />
                  <select
                    value={rekapSemester}
                    onChange={(e) => setRekapSemester(e.target.value as any)}
                    className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-bold text-[#1D4137]"
                  >
                    <option value="ganjil">Semester Ganjil (Jul–Des)</option>
                    <option value="genap">Semester Genap (Jan–Jun)</option>
                  </select>
                </>
              )}
            </div>

            <button
              onClick={() => {
                printDirectElement('rekapTerlambatPrintArea', {
                  title: `Rekap Keterlambatan - ${branding.schoolName || 'Sekolah'}`,
                  orientation: 'portrait',
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-bold hover:bg-[#1D4137] transition-all shadow-xs"
              title="Cetak langsung ke printer fisik tanpa perlu download"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap Langsung</span>
            </button>
          </div>

          <div
            id="rekapTerlambatPrintArea"
            className="print-area bg-white rounded-2xl border border-[#D9E0D4] shadow-xs p-6"
          >
            {/* Kop Surat saat Cetak */}
            <div className="flex flex-col items-center justify-center pb-4 mb-4 border-b-2 border-black text-center">
              {branding.showLogoOnPrint && (
                <div className="w-14 h-14 mb-1.5 flex items-center justify-center">
                  <img
                    src={branding.schoolLogo || '/logo.png?v=5'}
                    alt={branding.schoolName || 'Logo'}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <h2 className="text-xs font-bold uppercase tracking-wider text-black font-serif">
                {branding.schoolName || 'MEDIA BANTU GURU'}
              </h2>
              <h3 className="font-serif font-bold text-base text-black uppercase tracking-wide mt-0.5">
                REKAPITULASI FREKUENSI KETERLAMBATAN SISWA
              </h3>
              <p className="text-[11px] text-gray-700 mt-0.5 font-medium">
                Periode: {rekapJenis === 'bulan' ? `Bulan ${rekapBulan}` : rekapJenis === 'semester' ? `Semester ${rekapSemester.toUpperCase()} (T.A ${rekapTa})` : `Tahun Ajaran ${rekapTa}/${rekapTa + 1}`}
              </p>
            </div>

            {rekapRanked.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#647169]">
                Tidak ada keterlambatan tercatat pada periode ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EFF2EA]/60 border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3 text-center">Jumlah Terlambat</th>
                      <th className="p-3">Catatan BK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E0D4]/60">
                    {rekapRanked.map(({ siswa, count }) => (
                      <tr key={siswa!.id} className="hover:bg-[#EFF2EA]/50">
                        <td className="p-3 font-bold text-[#1D4137]">{siswa!.nama}</td>
                        <td className="p-3 font-semibold text-[#1D4137]">Kelas {siswa!.kelas || '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-base text-[#B5473A]">
                          {count}x
                        </td>
                        <td className="p-3">
                          {count >= 5 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-200">
                              Perlu Perhatian Khusus (Panggilan Wali)
                            </span>
                          ) : count >= 3 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Perlu Dipantau
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              Wajar
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Keterlambatan' : 'Catat Keterlambatan Siswa'}
        maxWidth="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#2D5F52] text-white font-semibold text-xs rounded-xl hover:bg-[#1D4137] shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Catatan'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* MENU PENCARIAN KELAS & NAMA SISWA */}
          <div className="space-y-3 bg-[#EFF2EA]/60 dark:bg-black/20 p-3.5 sm:p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1D4137] dark:text-[#6EE7B7] uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#2D5F52] dark:text-[#6EE7B7]" />
                <span>Pencarian Kelas &amp; Nama Siswa *</span>
              </label>
              {(modalFilterKelas || modalSearchNama) && (
                <button
                  type="button"
                  onClick={() => {
                    setModalFilterKelas('');
                    setModalSearchNama('');
                  }}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Reset Filter
                </button>
              )}
            </div>

            {/* Inputs: 1. Filter Kelas, 2. Cari Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Menu Pencarian / Filter Kelas */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-gray-500" />
                  <span>Pilih / Filter Kelas:</span>
                </label>
                <select
                  value={modalFilterKelas}
                  onChange={(e) => setModalFilterKelas(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
                >
                  <option value="">Semua Kelas ({activeSiswa.length} Siswa)</option>
                  {allKelasNames.map((k) => {
                    const count = activeSiswa.filter((s) => s.kelas === k).length;
                    return (
                      <option key={k} value={k}>
                        Kelas {k} ({count} siswa)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Menu Pencarian Nama Siswa */}
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  <span>Cari Nama Siswa / NIS:</span>
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={modalSearchNama}
                    onChange={(e) => setModalSearchNama(e.target.value)}
                    placeholder="Ketik nama siswa atau NIS..."
                    className="w-full pl-8.5 pr-8 py-2 bg-white dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
                  />
                  {modalSearchNama && (
                    <button
                      type="button"
                      onClick={() => setModalSearchNama('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dropdown Hasil Pencarian */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  Daftar Siswa ({modalFilteredSiswa.length} ditemukan):
                </span>
                {modalFilteredSiswa.length > 0 && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Pilih di bawah ini atau klik daftar
                  </span>
                )}
              </div>

              <select
                required
                value={formData.siswaId || ''}
                onChange={(e) => setFormData({ ...formData, siswaId: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              >
                <option value="">
                  {modalFilteredSiswa.length === 0
                    ? '-- Tidak ada siswa yang sesuai --'
                    : '-- Pilih Siswa dari Hasil Pencarian --'}
                </option>
                {modalFilteredSiswa.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} · Kelas {s.kelas || '-'} {s.nis ? `(NIS: ${s.nis})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick-Click Student List (Scrollable Interactive Box) */}
            {modalFilteredSiswa.length > 0 ? (
              <div className="max-h-36 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin border-t border-[#D9E0D4]/70 dark:border-[#2D483F]/70 pt-2">
                {modalFilteredSiswa.slice(0, 30).map((s) => {
                  const isSelected = formData.siswaId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, siswaId: s.id })}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-[#142620] border-gray-200 dark:border-gray-700/60 hover:border-emerald-300 dark:hover:border-emerald-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : (s.nama[0] || '?')}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-xs block truncate">{s.nama}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Kelas: <strong>{s.kelas || '-'}</strong> {s.nis ? `· NIS: ${s.nis}` : ''}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                          Dipilih ✓
                        </span>
                      )}
                    </button>
                  );
                })}
                {modalFilteredSiswa.length > 30 && (
                  <p className="text-[10px] text-center text-gray-400 italic pt-1">
                    Menampilkan 30 dari {modalFilteredSiswa.length} siswa. Ketik nama untuk mempersempit.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-center text-amber-800 dark:text-amber-300 text-xs">
                Tidak ada siswa yang cocok dengan filter kelas "<strong>{modalFilterKelas || 'Semua'}</strong>" dan pencarian nama "<strong>{modalSearchNama}</strong>".
              </div>
            )}

            {/* Selected Student Confirmation Card */}
            {selectedStudent && (
              <div className="p-2.5 sm:p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {selectedStudent.nama}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                        Kelas {selectedStudent.kelas || '-'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                      {selectedStudent.nis ? `NIS: ${selectedStudent.nis} · ` : ''}Siswa siap dicatat
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-xs shrink-0 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Siswa Terpilih
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">Tanggal Keterlambatan</label>
              <input
                type="date"
                required
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full p-2.5 bg-[#EFF2EA] dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">Jam Datang</label>
              <input
                type="time"
                value={formData.jam || ''}
                onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                className="w-full p-2.5 bg-[#EFF2EA] dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#1D4137] dark:text-gray-200">Durasi Terlambat (menit)</label>
              <div className="flex items-center gap-1">
                {[5, 10, 15, 20, 30, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({ ...formData, menit: m })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                      formData.menit === m
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="0"
              value={formData.menit || ''}
              onChange={(e) => setFormData({ ...formData, menit: Number(e.target.value) })}
              placeholder="Misal: 15"
              className="w-full p-2.5 bg-[#EFF2EA] dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-gray-900 dark:text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#1D4137] dark:text-gray-200">Alasan / Keterangan Keterlambatan</label>
            </div>
            {/* Quick Reason Chips */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Pilihan cepat:</span>
              {[
                'Bangun kesiangan',
                'Kendala transportasi',
                'Macet di jalan',
                'Hujan deras',
                'Ban bocor / mogok',
                'Membantu orang tua',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setFormData({ ...formData, keterangan: reason })}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950 border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors"
                >
                  + {reason}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={formData.keterangan || ''}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Bangun kesiangan, sepeda bocor, kendala transportasi..."
              className="w-full p-2.5 bg-[#EFF2EA] dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteTerlambat(deleteTarget.id);
            showToast('Catatan keterlambatan berhasil dihapus');
          }
        }}
        title="Hapus Catatan Keterlambatan"
        message={
          <>
            Hapus catatan keterlambatan untuk siswa{' '}
            <strong>
              {siswaList.find((s) => s.id === deleteTarget?.siswaId)?.nama || 'Siswa'}
            </strong>{' '}
            pada tanggal {deleteTarget ? fmtDate(deleteTarget.tanggal) : ''}?
          </>
        }
        detailMessage="Data yang dihapus tidak dapat dipulihkan kembali."
        confirmText="Ya, Hapus Catatan"
        variant="danger"
      />
    </div>
  );
};
