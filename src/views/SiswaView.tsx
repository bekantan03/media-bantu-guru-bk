import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Upload,
  Printer,
  Trash2,
  Star,
  Settings,
  MoreVertical,
  CheckSquare,
  Square,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  Clock,
  Eye,
  Edit2,
  UserX,
  LogOut,
  UserMinus
} from 'lucide-react';
import { Siswa, Kasus, Konseling, Terlambat, KelasItem } from '../types';
import { KartuSiswaMorph } from '../components/KartuSiswaMorph';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  initials,
  isDuplicateSiswa,
  isValidNis,
  extractSiswaFromRow,
  parseCSVToRows,
} from '../lib/storage';
import * as XLSX from 'xlsx';

interface SiswaViewProps {
  siswaList: Siswa[];
  kelasList: KelasItem[];
  kasusList: Kasus[];
  konselingList: Konseling[];
  terlambatList: Terlambat[];
  selectedSiswaId?: string;
  selectedTab?: 'kasus' | 'konseling' | 'terlambat';
  filterAsuhOnly?: boolean;
  onSelectSiswa: (id?: string, tab?: 'kasus' | 'konseling' | 'terlambat') => void;
  onSaveSiswa: (siswa: Partial<Siswa>, isEdit?: boolean) => void;
  onDeleteSiswa: (id: string) => void;
  onBulkDeleteSiswa: (ids: string[]) => void;
  onDeleteAllSiswa: () => void;
  onToggleAsuh: (id: string) => void;
  onAddKelas: (nama: string) => Promise<boolean>;
  onDeleteKelas: (id: string) => void;
  onImportSiswa: (imported: Partial<Siswa>[]) => void;
  onQuickAction: (type: 'kasus' | 'konseling' | 'terlambat' | 'absensi', siswaId: string) => void;
  onPrintPresensi: (kelasName: string) => void;
  onDeleteKasus?: (id: string) => void;
  onDeleteKonseling?: (id: string) => void;
  onDeleteTerlambat?: (id: string) => void;
  showToast: (msg: string) => void;
}

export const SiswaView: React.FC<SiswaViewProps> = ({
  siswaList,
  kelasList,
  kasusList,
  konselingList,
  terlambatList,
  selectedSiswaId,
  selectedTab = 'kasus',
  filterAsuhOnly = false,
  onSelectSiswa,
  onSaveSiswa,
  onDeleteSiswa,
  onBulkDeleteSiswa,
  onDeleteAllSiswa,
  onToggleAsuh,
  onAddKelas,
  onDeleteKelas,
  onImportSiswa,
  onQuickAction,
  onPrintPresensi,
  onDeleteKasus,
  onDeleteKonseling,
  onDeleteTerlambat,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [asuhFilter, setAsuhFilter] = useState(filterAsuhOnly);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [isKelasModalOpen, setIsKelasModalOpen] = useState(false);
  const [newKelasName, setNewKelasName] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [importedPreview, setImportedPreview] = useState<{
    valid: Partial<Siswa>[];
    duplicates: { data: Partial<Siswa>; reason: string }[];
  }>({ valid: [], duplicates: [] });
  const [previewTab, setPreviewTab] = useState<'valid' | 'duplicates'>('valid');
  const [quickActionSiswa, setQuickActionSiswa] = useState<Siswa | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    detailMessage?: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Siswa>>({
    nama: '',
    nis: '',
    kelas: '',
    jk: 'L',
    alamat: '',
    ortu: '',
    hp: '',
    catatan: '',
    asuh: false,
    status: 'aktif',
  });

  const allKelasNames = Array.from(
    new Set([...kelasList.map((k) => k.nama), ...siswaList.map((s) => s.kelas || '')].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));

  const activeSiswaList = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');

  const filteredSiswa = activeSiswaList.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || s.nama.toLowerCase().includes(q) || (s.nis || '').toLowerCase().includes(q);
    const matchKelas = !selectedKelas || s.kelas === selectedKelas;
    const matchAsuh = !asuhFilter || s.asuh;
    return matchSearch && matchKelas && matchAsuh;
  });

  const getPoin = (id: string) =>
    kasusList.filter((k) => k.siswaId === id).reduce((sum, k) => sum + (k.poin || 0), 0);

  // If a student profile is selected, render morph profile view
  const currentSelectedSiswa = activeSiswaList.find((s) => s.id === selectedSiswaId);
  if (currentSelectedSiswa) {
    const studentKasus = kasusList.filter((k) => k.siswaId === currentSelectedSiswa.id);
    const studentKonseling = konselingList.filter((c) => c.siswaId === currentSelectedSiswa.id);
    const studentTerlambat = terlambatList.filter((t) => t.siswaId === currentSelectedSiswa.id);

    return (
      <KartuSiswaMorph
        siswa={currentSelectedSiswa}
        poin={getPoin(currentSelectedSiswa.id)}
        kasusList={studentKasus}
        konselingList={studentKonseling}
        terlambatList={studentTerlambat}
        activeTab={selectedTab}
        onChangeTab={(tab) => onSelectSiswa(currentSelectedSiswa.id, tab)}
        onBack={() => onSelectSiswa(undefined)}
        onToggleAsuh={onToggleAsuh}
        onChangeStatus={(id, status) => {
          const target = activeSiswaList.find((s) => s.id === id);
          if (target) {
            onSaveSiswa({ ...target, status }, true);
            showToast(`Status ${target.nama} diubah menjadi ${status}`);
          }
        }}
        onDeleteSiswa={(id) => {
          onDeleteSiswa(id);
          showToast(`Data siswa ${currentSelectedSiswa.nama} berhasil dihapus`);
        }}
        onDeleteKasus={(id) => {
          if (onDeleteKasus) {
            onDeleteKasus(id);
            showToast('Catatan kasus dihapus');
          }
        }}
        onDeleteKonseling={(id) => {
          if (onDeleteKonseling) {
            onDeleteKonseling(id);
            showToast('Sesi konseling dihapus');
          }
        }}
        onDeleteTerlambat={(id) => {
          if (onDeleteTerlambat) {
            onDeleteTerlambat(id);
            showToast('Catatan keterlambatan dihapus');
          }
        }}
      />
    );
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSiswa.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const openAddForm = () => {
    setEditingSiswa(null);
    setFormData({
      nama: '',
      nis: '',
      kelas: allKelasNames[0] || '7A',
      jk: 'L',
      alamat: '',
      ortu: '',
      hp: '',
      catatan: '',
      asuh: false,
      status: 'aktif',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormData({ ...siswa });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim()) {
      showToast('Nama siswa wajib diisi');
      return;
    }

    // Check duplicate using isDuplicateSiswa
    // Same name in different class is strictly ALLOWED!
    const duplicateMatch = activeSiswaList.find(
      (s) => s.id !== editingSiswa?.id && isDuplicateSiswa(formData, s).isDuplicate
    );

    if (duplicateMatch) {
      const dupInfo = isDuplicateSiswa(formData, duplicateMatch);
      showToast(`⚠️ ${dupInfo.reason || 'Data ganda terdeteksi (NIS sama atau Nama & Kelas sama)'}`);
      return;
    }

    if (editingSiswa) {
      onSaveSiswa({ ...editingSiswa, ...formData }, true);
      showToast('Data siswa berhasil diperbarui');
    } else {
      onSaveSiswa(formData, false);
      showToast('Siswa baru berhasil ditambahkan');
    }
    setIsFormOpen(false);
  };

  // Helper to filter out duplicate students from parsed list
  const processUploadedRecords = (rawParsed: Partial<Siswa>[]) => {
    const valid: Partial<Siswa>[] = [];
    const duplicates: { data: Partial<Siswa>; reason: string }[] = [];

    rawParsed.forEach((item) => {
      const itemNama = (item.nama || '').trim();
      if (!itemNama) return;

      // Check against existing database students
      const dbMatch = siswaList.find((s) => isDuplicateSiswa(item, s).isDuplicate);

      if (dbMatch) {
        const dupInfo = isDuplicateSiswa(item, dbMatch);
        duplicates.push({
          data: item,
          reason: dupInfo.reason || `Siswa ${item.nama} sudah terdaftar di database`,
        });
        return;
      }

      // Check against already processed items in current upload batch
      const batchMatch = valid.find((b) => isDuplicateSiswa(item, b).isDuplicate);

      if (batchMatch) {
        const dupInfo = isDuplicateSiswa(item, batchMatch);
        duplicates.push({
          data: item,
          reason: `Duplikat dalam file terunggah: ${dupInfo.reason || `baris ganda untuk ${item.nama}`}`,
        });
        return;
      }

      valid.push(item);
    });

    setImportedPreview({ valid, duplicates });
    setPreviewTab(valid.length > 0 ? 'valid' : 'duplicates');
  };

  // Upload Excel / CSV handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = /\.xlsx$|\.xls$/i.test(file.name);
    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const parsed: Partial<Siswa>[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName], { defval: '' });
            rawRows.forEach((row) => {
              // Extract using smart mapper, fallback default class to sheetName if sheetName looks like a class name (e.g. 7A, 8B)
              const defaultKelas = /^(sheet\s*\d+|data|export|siswa)$/i.test(sheetName.trim()) ? '' : sheetName.trim();
              const student = extractSiswaFromRow(row, defaultKelas);
              if (student && student.nama) {
                parsed.push(student);
              }
            });
          });

          processUploadedRecords(parsed);
        } catch (err) {
          showToast('Gagal membaca file Excel');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (evt) => {
        try {
          const text = String(evt.target?.result || '');
          const rows = parseCSVToRows(text);
          const parsed: Partial<Siswa>[] = [];

          rows.forEach((row) => {
            const student = extractSiswaFromRow(row);
            if (student && student.nama) {
              parsed.push(student);
            }
          });

          processUploadedRecords(parsed);
        } catch (err) {
          showToast('Gagal membaca CSV');
        }
      };
      reader.readAsText(file);
    }
  };

  const confirmImport = () => {
    if (importedPreview.valid.length === 0) {
      showToast('Tidak ada data baru yang dapat diimpor');
      return;
    }
    onImportSiswa(importedPreview.valid);
    const dupCount = importedPreview.duplicates.length;
    showToast(
      `${importedPreview.valid.length} data siswa berhasil diimpor${
        dupCount > 0 ? ` (${dupCount} data duplikat ditolak)` : ''
      }`
    );
    setImportedPreview({ valid: [], duplicates: [] });
    setIsUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar Controls */}
      <div className="bg-white dark:bg-[#1A2E27] p-3 sm:p-4 rounded-2xl border border-[#D9E0D4] dark:border-[#2D483F] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#EFF2EA]/60 dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] text-[#1D4137] dark:text-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            />
          </div>

          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 bg-[#EFF2EA]/60 dark:bg-[#12221D] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold text-[#1D4137] dark:text-gray-200"
          >
            <option value="">Semua Kelas</option>
            {allKelasNames.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>

          <button
            onClick={() => setAsuhFilter(!asuhFilter)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              asuhFilter
                ? 'bg-[#C9862E] text-amber-950 border-[#C9862E]'
                : 'bg-white dark:bg-[#12221D] text-[#647169] dark:text-gray-300 border-[#D9E0D4] dark:border-[#2D483F] hover:bg-gray-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${asuhFilter ? 'fill-current' : ''}`} />
            <span>{asuhFilter ? '★ Siswa Asuh' : '★ Semua'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => {
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Ubah Status Siswa Terpilih',
                    message: (
                      <>
                        Set status <strong>{selectedIds.length} siswa terpilih</strong> menjadi <strong>BERHENTI / KELUAR</strong>?
                      </>
                    ),
                    detailMessage: 'Data siswa terpilih akan dipindahkan ke daftar Siswa Keluar.',
                    confirmText: 'Ya, Set Berhenti',
                    variant: 'warning',
                    onConfirm: () => {
                      selectedIds.forEach((id) => {
                        const target = activeSiswaList.find((s) => s.id === id);
                        if (target) onSaveSiswa({ ...target, status: 'berhenti' }, true);
                      });
                      setSelectedIds([]);
                      showToast(`${selectedIds.length} siswa ditandai Berhenti`);
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-700 text-white rounded-xl text-xs font-semibold hover:bg-rose-800 transition-colors shadow-2xs cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Berhenti ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => {
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Hapus Siswa Terpilih',
                    message: (
                      <>
                        Apakah Anda yakin ingin menghapus <strong>{selectedIds.length} siswa terpilih</strong>?
                      </>
                    ),
                    detailMessage: 'Semua riwayat kasus, konseling, dan absensi siswa terkait akan ikut terhapus.',
                    confirmText: `Ya, Hapus (${selectedIds.length})`,
                    variant: 'danger',
                    onConfirm: () => {
                      onBulkDeleteSiswa(selectedIds);
                      setSelectedIds([]);
                      showToast(`${selectedIds.length} siswa berhasil dihapus`);
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedIds.length})</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsKelasModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#12221D] text-[#1D4137] dark:text-gray-200 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-black/20 transition-colors cursor-pointer"
            title="Kelola Daftar Kelas"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Kelola Kelas</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#12221D] text-[#1D4137] dark:text-gray-200 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-black/20 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            onClick={() => onPrintPresensi(selectedKelas || 'semua')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#12221D] text-[#1D4137] dark:text-gray-200 border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-black/20 transition-colors shadow-2xs cursor-pointer"
            title="Cetak Daftar Siswa &amp; Jurnal Piket"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Siswa</span>
          </button>

          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold hover:bg-[#1D4137] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Siswa</span>
          </button>

          {activeSiswaList.length > 0 && (
            <button
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  title: 'Hapus Seluruh Data Siswa',
                  message: (
                    <>
                      Apakah Anda yakin ingin menghapus <strong>SEMUA ({activeSiswaList.length})</strong> data siswa aktif?
                    </>
                  ),
                  detailMessage: 'PERINGATAN: Tindakan ini tidak dapat dibatalkan. Seluruh data siswa beserta seluruh riwayat BK akan terhapus bersih.',
                  confirmText: 'Ya, Hapus Semua Siswa',
                  variant: 'danger',
                  onConfirm: () => {
                    onDeleteAllSiswa();
                    showToast('Semua data siswa berhasil dihapus');
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Grid Container */}
      <div className="bg-white rounded-2xl border border-[#D9E0D4] shadow-xs overflow-hidden">
        {filteredSiswa.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EFF2EA] text-[#2D5F52] flex items-center justify-center mx-auto text-xl">
              🧑‍🎓
            </div>
            <h4 className="font-serif font-bold text-base text-[#1D4137]">
              {asuhFilter ? 'Belum Ada Siswa Asuh' : 'Belum Ada Data Siswa'}
            </h4>
            <p className="text-xs text-[#647169] max-w-sm mx-auto">
              {asuhFilter
                ? 'Tandai siswa sebagai siswa asuh binaan Anda dengan mengeklik bintang pada daftar siswa.'
                : 'Tambahkan data siswa pertama atau impor file Excel/CSV data siswa sekolah.'}
            </p>
            {!asuhFilter && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold hover:bg-[#1D4137]"
              >
                + Tambah Siswa Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EFF2EA]/60 border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <button
                      onClick={() => handleSelectAll(selectedIds.length !== filteredSiswa.length)}
                      className="text-gray-500 hover:text-black"
                    >
                      {selectedIds.length === filteredSiswa.length ? (
                        <CheckSquare className="w-4 h-4 text-[#2D5F52]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 w-12 text-center">Asuh</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">JK</th>
                  <th className="p-3 text-right">Poin</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0D4]/60">
                {filteredSiswa.map((siswa) => {
                  const isSelected = selectedIds.includes(siswa.id);
                  const poin = getPoin(siswa.id);

                  return (
                    <motion.tr
                      key={siswa.id}
                      layoutId={`siswa-card-${siswa.id}`}
                      className="hover:bg-[#EFF2EA]/50 transition-colors group"
                    >
                      <td className="p-3 text-center">
                        <button onClick={() => handleToggleSelectOne(siswa.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#2D5F52]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                          )}
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => onToggleAsuh(siswa.id)}
                          className="p-1 rounded-md hover:bg-amber-100 transition-colors"
                          title={siswa.asuh ? 'Hapus tanda siswa asuh' : 'Tandai siswa asuh'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              siswa.asuh ? 'fill-[#C9862E] text-[#C9862E]' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="p-3 font-bold text-[#1D4137]">
                        <div className="flex items-center gap-2">
                          <motion.div
                            layoutId={`siswa-avatar-${siswa.id}`}
                            className="w-7 h-7 rounded-lg bg-[#F3E3C8] text-[#C9862E] font-serif font-bold text-xs flex items-center justify-center border border-[#C9862E] shrink-0"
                          >
                            {initials(siswa.nama)}
                          </motion.div>
                          <motion.span layoutId={`siswa-nama-${siswa.id}`}>
                            {siswa.nama}
                          </motion.span>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[#647169]">{siswa.nis || '-'}</td>
                      <td className="p-3 font-semibold text-[#1D4137]">Kelas {siswa.kelas || '-'}</td>
                      <td className="p-3 text-[#647169]">{siswa.jk === 'L' ? 'L' : 'P'}</td>

                      <td className="p-3 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            poin >= 50
                              ? 'bg-red-100 text-[#B5473A]'
                              : poin >= 25
                              ? 'bg-amber-100 text-[#C9862E]'
                              : 'bg-emerald-50 text-[#1D4137]'
                          }`}
                        >
                          {poin} pt
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectSiswa(siswa.id)}
                            className="p-1.5 rounded-lg text-[#2D5F52] hover:bg-[#DCE8E1] transition-colors"
                            title="Lihat Kartu Siswa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditForm(siswa)}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setQuickActionSiswa(siswa)}
                            className="px-2 py-1 rounded-lg bg-[#DCE8E1] text-[#1D4137] font-semibold text-[11px] hover:bg-emerald-200 transition-colors"
                          >
                            ⚡ Aksi
                          </button>

                          <button
                            onClick={() => {
                              setConfirmConfig({
                                isOpen: true,
                                title: 'Hapus Data Siswa',
                                message: (
                                  <>
                                    Apakah Anda yakin ingin menghapus data siswa <strong>{siswa.nama}</strong> ({siswa.nis || 'Tanpa NIS'})?
                                  </>
                                ),
                                detailMessage: 'Semua riwayat kasus, konseling, dan absensi siswa akan ikut terhapus.',
                                confirmText: 'Ya, Hapus Siswa',
                                variant: 'danger',
                                onConfirm: () => {
                                  onDeleteSiswa(siswa.id);
                                  showToast('Siswa berhasil dihapus');
                                },
                              });
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Siswa Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        footer={
          <>
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              onClick={handleFormSubmit}
              className="px-4 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold hover:bg-[#1D4137]"
            >
              {editingSiswa ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama lengkap siswa"
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1D4137] mb-1">NIS / NISN</label>
              <input
                type="text"
                value={formData.nis || ''}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Nomor Induk Siswa"
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Kelas</label>
              <input
                type="text"
                list="kelasListOptions"
                value={formData.kelas || ''}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                placeholder="Misal: 7A, 8B"
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
              <datalist id="kelasListOptions">
                {allKelasNames.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Jenis Kelamin</label>
              <select
                value={formData.jk || 'L'}
                onChange={(e) => setFormData({ ...formData, jk: e.target.value as any })}
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Alamat Rumah</label>
            <input
              type="text"
              value={formData.alamat || ''}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Alamat tempat tinggal"
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Orang Tua / Wali</label>
              <input
                type="text"
                value={formData.ortu || ''}
                onChange={(e) => setFormData({ ...formData, ortu: e.target.value })}
                placeholder="Nama ayah/ibu/wali"
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1D4137] mb-1">No. HP Orang Tua / Wali</label>
              <input
                type="text"
                value={formData.hp || ''}
                onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                placeholder="0812xxxxxxxx"
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Catatan Khusus BK</label>
            <textarea
              value={formData.catatan || ''}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={2}
              placeholder="Kondisi kesehatan, latar belakang, atau potensi siswa..."
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="asuhCheckbox"
              checked={formData.asuh || false}
              onChange={(e) => setFormData({ ...formData, asuh: e.target.checked })}
              className="rounded text-[#2D5F52] focus:ring-[#2D5F52]"
            />
            <label htmlFor="asuhCheckbox" className="font-bold text-[#1D4137] cursor-pointer">
              Tandai sebagai <strong>Siswa Asuh Binaan BK</strong>
            </label>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Status Keaktifan</label>
            <select
              value={formData.status || 'aktif'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            >
              <option value="aktif">Aktif</option>
              <option value="berhenti">Berhenti</option>
              <option value="pindah">Pindah Sekolah</option>
              <option value="keluar">Keluar</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Quick Action Modal */}
      {quickActionSiswa && (
        <Modal
          isOpen={!!quickActionSiswa}
          onClose={() => setQuickActionSiswa(null)}
          title={`Aksi Cepat · ${quickActionSiswa.nama}`}
          maxWidth="sm"
        >
          <div className="space-y-2 text-xs">
            <button
              onClick={() => {
                onToggleAsuh(quickActionSiswa.id);
                setQuickActionSiswa(null);
              }}
              className="w-full p-3 bg-[#EFF2EA] hover:bg-[#DCE8E1] text-[#1D4137] font-semibold rounded-xl text-left flex items-center justify-between"
            >
              <span>{quickActionSiswa.asuh ? '★ Hapus Tanda Siswa Asuh' : '★ Tandai sebagai Siswa Asuh'}</span>
            </button>

            <button
              onClick={() => {
                const sid = quickActionSiswa.id;
                setQuickActionSiswa(null);
                onQuickAction('kasus', sid);
              }}
              className="w-full p-3 bg-[#EFF2EA] hover:bg-[#DCE8E1] text-[#1D4137] font-semibold rounded-xl text-left flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-[#C9862E]" />
              <span>Catat Kasus / Pelanggaran</span>
            </button>

            <button
              onClick={() => {
                const sid = quickActionSiswa.id;
                setQuickActionSiswa(null);
                onQuickAction('konseling', sid);
              }}
              className="w-full p-3 bg-[#EFF2EA] hover:bg-[#DCE8E1] text-[#1D4137] font-semibold rounded-xl text-left flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#4C8C6B]" />
              <span>Catat Sesi Konseling BK</span>
            </button>

            <button
              onClick={() => {
                const sid = quickActionSiswa.id;
                setQuickActionSiswa(null);
                onQuickAction('terlambat', sid);
              }}
              className="w-full p-3 bg-[#EFF2EA] hover:bg-[#DCE8E1] text-[#1D4137] font-semibold rounded-xl text-left flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-[#B5473A]" />
              <span>Catat Keterlambatan</span>
            </button>

            <div className="pt-2 pb-1 border-t border-[#D9E0D4] mt-2">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1.5">
                Ubah Status Siswa (Berhenti / Keluar)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    const currentSiswa = quickActionSiswa;
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Tandai Berhenti',
                      message: (
                        <>
                          Tandai siswa <strong>{currentSiswa.nama}</strong> sebagai <strong>BERHENTI</strong>?
                        </>
                      ),
                      detailMessage: 'Data siswa akan dipindahkan ke daftar Siswa Keluar.',
                      confirmText: 'Ya, Set Berhenti',
                      variant: 'warning',
                      onConfirm: () => {
                        onSaveSiswa({ ...currentSiswa, status: 'berhenti' }, true);
                        setQuickActionSiswa(null);
                        showToast(`Status ${currentSiswa.nama} diubah menjadi Berhenti`);
                      },
                    });
                  }}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-lg text-[11px] flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Berhenti</span>
                </button>

                <button
                  onClick={() => {
                    const currentSiswa = quickActionSiswa;
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Tandai Pindah Sekolah',
                      message: (
                        <>
                          Tandai siswa <strong>{currentSiswa.nama}</strong> sebagai <strong>PINDAH SEKOLAH</strong>?
                        </>
                      ),
                      detailMessage: 'Data siswa akan dipindahkan ke daftar Siswa Keluar.',
                      confirmText: 'Ya, Set Pindah',
                      variant: 'warning',
                      onConfirm: () => {
                        onSaveSiswa({ ...currentSiswa, status: 'pindah' }, true);
                        setQuickActionSiswa(null);
                        showToast(`Status ${currentSiswa.nama} diubah menjadi Pindah`);
                      },
                    });
                  }}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-[11px] flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pindah</span>
                </button>

                <button
                  onClick={() => {
                    const currentSiswa = quickActionSiswa;
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Tandai Keluar',
                      message: (
                        <>
                          Tandai siswa <strong>{currentSiswa.nama}</strong> sebagai <strong>KELUAR</strong>?
                        </>
                      ),
                      detailMessage: 'Data siswa akan dipindahkan ke daftar Siswa Keluar.',
                      confirmText: 'Ya, Set Keluar',
                      variant: 'warning',
                      onConfirm: () => {
                        onSaveSiswa({ ...currentSiswa, status: 'keluar' }, true);
                        setQuickActionSiswa(null);
                        showToast(`Status ${currentSiswa.nama} diubah menjadi Keluar`);
                      },
                    });
                  }}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-bold rounded-lg text-[11px] flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <UserMinus className="w-3.5 h-3.5 text-gray-600" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                const sid = quickActionSiswa.id;
                setQuickActionSiswa(null);
                onSelectSiswa(sid);
              }}
              className="w-full p-3 bg-[#1D4137] text-white font-semibold rounded-xl text-left flex items-center gap-2 mt-2"
            >
              <Eye className="w-4 h-4" />
              <span>Buka Kartu Profil Lengkap</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Kelola Kelas Modal */}
      <Modal
        isOpen={isKelasModalOpen}
        onClose={() => setIsKelasModalOpen(false)}
        title="Menu Tambah & Hapus Kelas"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#647169]">
            Tambahkan nama kelas baru untuk mempermudah pengelompokan siswa, atau hapus kelas yang sudah tidak digunakan.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama kelas baru (contoh: 7C, 8A, 9B)"
              value={newKelasName}
              onChange={(e) => setNewKelasName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!newKelasName.trim()) return;
                  const ok = await onAddKelas(newKelasName.trim());
                  if (ok) {
                    showToast(`Kelas ${newKelasName.trim()} berhasil ditambahkan`);
                    setNewKelasName('');
                  } else {
                    showToast('Nama kelas sudah terdaftar');
                  }
                }
              }}
              className="flex-1 p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            />
            <button
              onClick={async () => {
                if (!newKelasName.trim()) return;
                const ok = await onAddKelas(newKelasName.trim());
                if (ok) {
                  showToast(`Kelas ${newKelasName.trim()} berhasil ditambahkan`);
                  setNewKelasName('');
                } else {
                  showToast('Nama kelas sudah terdaftar');
                }
              }}
              className="px-4 py-2.5 bg-[#2D5F52] text-white font-semibold rounded-xl hover:bg-[#1D4137] transition-colors"
            >
              + Tambah Kelas
            </button>
          </div>

          <div className="border border-[#D9E0D4] rounded-xl overflow-hidden divide-y max-h-64 overflow-y-auto">
            {allKelasNames.length === 0 ? (
              <p className="p-4 text-center text-gray-400">Belum ada kelas terdaftar.</p>
            ) : (
              allKelasNames.map((k) => {
                const defined = kelasList.find((item) => item.nama === k);
                const countSiswa = siswaList.filter((s) => s.kelas === k).length;

                return (
                  <div key={k} className="p-3 flex items-center justify-between bg-white hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1D4137]">Kelas {k}</span>
                      <span className="text-[10px] bg-emerald-50 text-[#1D4137] px-2 py-0.5 rounded-full border border-emerald-100 font-semibold">
                        {countSiswa} siswa
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {defined ? (
                        <button
                          onClick={() => {
                            setConfirmConfig({
                              isOpen: true,
                              title: 'Hapus Kelas',
                              message: (
                                <>
                                  Hapus kelas <strong>{k}</strong> dari daftar master kelas?
                                </>
                              ),
                              detailMessage: countSiswa > 0 ? `Perhatian: Ada ${countSiswa} siswa yang saat ini terdaftar di kelas ${k}.` : undefined,
                              confirmText: 'Ya, Hapus Kelas',
                              variant: 'danger',
                              onConfirm: () => {
                                onDeleteKelas(defined.id);
                                showToast(`Kelas ${k} berhasil dihapus`);
                              },
                            });
                          }}
                          className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-[11px] font-semibold transition-colors border border-red-200"
                        >
                          Hapus Kelas
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await onAddKelas(k);
                            showToast(`Kelas ${k} disimpan ke daftar master kelas`);
                          }}
                          className="px-2.5 py-1 text-[#1D4137] bg-[#DCE8E1] hover:bg-emerald-200 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          + Simpan Master
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Upload CSV / Excel Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setImportedPreview({ valid: [], duplicates: [] });
        }}
        title="Upload Data Siswa (Excel / CSV)"
        footer={
          importedPreview.valid.length > 0 ? (
            <button
              onClick={confirmImport}
              className="px-4 py-2 bg-[#2D5F52] text-white font-semibold rounded-xl hover:bg-[#1D4137] transition-colors"
            >
              Konfirmasi Impor ({importedPreview.valid.length} Siswa Baru)
            </button>
          ) : importedPreview.duplicates.length > 0 ? (
            <div className="text-xs font-bold text-rose-600">
              ⚠️ Tidak ada data baru yang dapat diimpor (semua terdeteksi duplikat)
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#F4F7F2] rounded-xl border border-[#D9E0D4] space-y-1">
            <p className="text-gray-700 font-medium">
              Unggah file <b>.xlsx</b>, <b>.xls</b>, atau <b>.csv</b> berisi data siswa (Kolom: NIS, Nama Siswa, Kelas, Jenis Kelamin, Ortu, No HP, Catatan).
            </p>
            <p className="text-[#2D5F52] text-[11px] font-semibold flex items-center gap-1">
              ✓ Siswa dengan nama yang sama pada kelas yang berbeda otomatis diizinkan dan tidak dianggap duplikat.
            </p>
          </div>

          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="w-full p-3 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl cursor-pointer"
          />

          {(importedPreview.valid.length > 0 || importedPreview.duplicates.length > 0) && (
            <div className="space-y-3">
              {/* Tab headers */}
              <div className="flex items-center gap-2 border-b border-[#D9E0D4]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('valid')}
                  className={`pb-2 px-3 font-bold border-b-2 text-xs transition-colors ${
                    previewTab === 'valid'
                      ? 'border-[#2D5F52] text-[#1D4137]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  🟢 Data Baru ({importedPreview.valid.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('duplicates')}
                  className={`pb-2 px-3 font-bold border-b-2 text-xs transition-colors ${
                    previewTab === 'duplicates'
                      ? 'border-amber-600 text-amber-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ⚠️ Duplikat Ditolak ({importedPreview.duplicates.length})
                </button>
              </div>

              {previewTab === 'valid' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <p className="font-bold text-[#1D4137]">
                    Terdapat {importedPreview.valid.length} data siswa baru yang siap diimpor:
                  </p>
                  {importedPreview.valid.length === 0 ? (
                    <p className="text-gray-500 italic py-2 text-center">Tidak ada data baru dalam file ini.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {importedPreview.valid.map((s, i) => (
                        <div key={i} className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-[#1D4137]">{s.nama}</span>
                            {s.nis && <span className="text-gray-500 ml-2 font-mono">NIS: {s.nis}</span>}
                          </div>
                          <span className="bg-emerald-100 text-[#1D4137] px-2 py-0.5 rounded font-semibold">
                            Kelas {s.kelas || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {previewTab === 'duplicates' && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                  <p className="font-bold text-rose-900">
                    Terdapat {importedPreview.duplicates.length} data duplikat yang ditolak/dilewati:
                  </p>
                  {importedPreview.duplicates.length === 0 ? (
                    <p className="text-gray-500 italic py-2 text-center">Tidak ada data duplikat terdeteksi.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {importedPreview.duplicates.map((item, i) => (
                        <div key={i} className="p-2 bg-white rounded-lg border border-rose-100 space-y-0.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-950">{item.data.nama}</span>
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-semibold text-[10px]">
                              Ditolak
                            </span>
                          </div>
                          <p className="text-rose-700 text-[10px] font-medium">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Custom Reusable Confirm Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig(null)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          detailMessage={confirmConfig.detailMessage}
          confirmText={confirmConfig.confirmText}
          variant={confirmConfig.variant}
        />
      )}
    </div>
  );
};
