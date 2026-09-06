import React, { useState } from 'react';
import { Search, RotateCcw, Trash2, FileSpreadsheet, Download } from 'lucide-react';
import { Siswa, KelasItem } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { exportSiswaKeluarToExcel } from '../lib/excelExport';
import { exportSiswaKeluarToPDF } from '../lib/pdfExport';

interface SiswaKeluarViewProps {
  siswaList: Siswa[];
  kelasList: KelasItem[];
  onRestoreSiswa: (id: string) => void;
  onDeleteSiswaPermanent: (id: string) => void;
  showToast: (msg: string) => void;
}

export const SiswaKeluarView: React.FC<SiswaKeluarViewProps> = ({
  siswaList,
  kelasList,
  onRestoreSiswa,
  onDeleteSiswaPermanent,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null);

  const inactiveList = siswaList.filter((s) => (s.status || 'aktif') !== 'aktif');

  const filtered = inactiveList.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || s.nama.toLowerCase().includes(q) || (s.nis || '').toLowerCase().includes(q);
    const matchKelas = !selectedKelas || s.kelas === selectedKelas;
    const matchStatus = !selectedStatus || s.status === selectedStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  const allKelasNames = Array.from(
    new Set([...kelasList.map((k) => k.nama), ...siswaList.map((s) => s.kelas || '')].filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9E0D4] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-semibold text-[#1D4137]"
          >
            <option value="">Semua Kelas</option>
            {allKelasNames.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-semibold text-[#1D4137]"
          >
            <option value="">Semua Status Non-Aktif</option>
            <option value="berhenti">Berhenti</option>
            <option value="pindah">Pindah Sekolah</option>
            <option value="keluar">Keluar</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSiswaKeluarToExcel(filtered)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 shadow-xs transition-colors"
            title="Download data siswa pindah/keluar/berhenti ke file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportSiswaKeluarToPDF(filtered)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 text-white rounded-xl text-xs font-semibold hover:bg-rose-800 shadow-xs transition-colors"
            title="Download data siswa pindah/keluar/berhenti ke dokumen PDF (.pdf)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
        <strong>Catatan:</strong> Siswa di halaman ini sudah tidak aktif (berhenti, pindah, atau keluar) dan dipisahkan agar tidak mengganggu pencatatan presensi atau kasus siswa aktif.
      </div>

      <div className="bg-white rounded-2xl border border-[#D9E0D4] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-xs text-[#647169]">
            Tidak ada siswa dalam kategori non-aktif/keluar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EFF2EA]/60 border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">Kelas Terakhir</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0D4]/60">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#EFF2EA]/50">
                    <td className="p-3 font-bold text-[#1D4137]">{s.nama}</td>
                    <td className="p-3 font-mono text-[#647169]">{s.nis || '-'}</td>
                    <td className="p-3">Kelas {s.kelas || '-'}</td>
                    <td className="p-3">
                      <span className="capitalize px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            onRestoreSiswa(s.id);
                            showToast(`Siswa ${s.nama} dikembalikan ke data aktif`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#DCE8E1] text-[#1D4137] rounded-lg font-semibold hover:bg-emerald-200 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Kembalikan ke Aktif</span>
                        </button>

                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Permanent Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteSiswaPermanent(deleteTarget.id);
            showToast('Data siswa berhasil dihapus secara permanen');
          }
        }}
        title="Hapus Data Siswa Permanen"
        message={
          <>
            Apakah Anda yakin ingin menghapus data siswa <strong>{deleteTarget?.nama}</strong> ({deleteTarget?.nis || 'Tanpa NIS'}) secara permanen?
          </>
        }
        detailMessage="PERINGATAN: Seluruh riwayat kasus, konseling, keterlambatan, dan presensi siswa ini akan dihapus permanen dari sistem dan tidak dapat dipulihkan."
        confirmText="Ya, Hapus Permanen"
        variant="danger"
      />
    </div>
  );
};
