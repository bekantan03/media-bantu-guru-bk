import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, AlertTriangle, FileSpreadsheet, Download, Printer } from 'lucide-react';
import { Siswa, Kasus, JenisKasusType, StatusKasusType } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { todayISO, fmtDate } from '../lib/storage';
import { exportKasusToExcel } from '../lib/excelExport';
import { exportKasusToPDF } from '../lib/pdfExport';
import { printDirectElement } from '../lib/printHelper';
import { useBranding } from '../lib/branding';

interface KasusViewProps {
  siswaList: Siswa[];
  kasusList: Kasus[];
  presetSiswaId?: string;
  onSaveKasus: (kasus: Partial<Kasus>, isEdit?: boolean) => void;
  onDeleteKasus: (id: string) => void;
  showToast: (msg: string) => void;
}

export const KasusView: React.FC<KasusViewProps> = ({
  siswaList,
  kasusList,
  presetSiswaId,
  onSaveKasus,
  onDeleteKasus,
  showToast,
}) => {
  const { branding } = useBranding();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKasus, setEditingKasus] = useState<Kasus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kasus | null>(null);

  const [formData, setFormData] = useState<Partial<Kasus>>({
    siswaId: presetSiswaId || siswaList[0]?.id || '',
    tanggal: todayISO(),
    jenis: 'ringan',
    poin: 10,
    deskripsi: '',
    tindakLanjut: '',
    status: 'baru',
  });

  const activeSiswa = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');

  const handlePrintKasus = () => {
    printDirectElement('kasusPrintArea', {
      title: `Daftar Kasus Pelanggaran Siswa - ${branding.schoolName || 'Sekolah'}`,
      orientation: 'landscape',
    });
  };

  const filtered = kasusList.filter((k) => {
    const s = activeSiswa.find((item) => item.id === k.siswaId);
    const q = search.toLowerCase().trim();
    const matchSearch = !q || (s && s.nama.toLowerCase().includes(q)) || k.deskripsi.toLowerCase().includes(q);
    const matchJenis = !filterJenis || k.jenis === filterJenis;
    const matchStatus = !filterStatus || k.status === filterStatus;
    return matchSearch && matchJenis && matchStatus;
  });

  const openAddModal = () => {
    setEditingKasus(null);
    setFormData({
      siswaId: presetSiswaId || activeSiswa[0]?.id || '',
      tanggal: todayISO(),
      jenis: 'ringan',
      poin: 10,
      deskripsi: '',
      tindakLanjut: '',
      status: 'baru',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (k: Kasus) => {
    setEditingKasus(k);
    setFormData({ ...k });
    setIsModalOpen(true);
  };

  const handleJenisChange = (jenis: JenisKasusType) => {
    const defaultPoin = jenis === 'ringan' ? 10 : jenis === 'sedang' ? 25 : 50;
    setFormData((prev) => ({ ...prev, jenis, poin: defaultPoin }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siswaId || !formData.deskripsi?.trim()) {
      showToast('Pilih siswa dan isi deskripsi kejadian');
      return;
    }

    if (editingKasus) {
      onSaveKasus({ ...editingKasus, ...formData }, true);
      showToast('Catatan kasus diperbarui');
    } else {
      onSaveKasus(formData, false);
      showToast('Kasus pelanggaran baru dicatat');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9E0D4] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau deskripsi kasus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-semibold text-[#1D4137]"
          >
            <option value="">Semua Tingkat</option>
            <option value="ringan">Ringan (10 pt)</option>
            <option value="sedang">Sedang (25 pt)</option>
            <option value="berat">Berat (50 pt)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-semibold text-[#1D4137]"
          >
            <option value="">Semua Status</option>
            <option value="baru">Baru</option>
            <option value="proses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintKasus}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-bold hover:bg-[#1D4137] shadow-xs transition-colors"
            title="Cetak langsung daftar kasus ke mesin printer tanpa harus mendownload file"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Langsung</span>
          </button>

          <button
            onClick={() => exportKasusToExcel(filtered, siswaList)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 shadow-xs transition-colors"
            title="Download data kasus & pelanggaran ke file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportKasusToPDF(filtered, siswaList)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-700 text-white rounded-xl text-xs font-semibold hover:bg-rose-800 shadow-xs transition-colors"
            title="Download data kasus & pelanggaran ke dokumen PDF (.pdf)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D4137] text-white rounded-xl text-xs font-semibold hover:bg-[#152E27] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Kasus Baru</span>
          </button>
        </div>
      </div>

      {/* Kasus List Table */}
      <div id="kasusPrintArea" className="print-area bg-white rounded-2xl border border-[#D9E0D4] shadow-xs overflow-hidden p-0 print:p-4">
        {/* Kop Surat saat Cetak */}
        <div className="hidden print:flex flex-col items-center justify-center pb-4 mb-4 border-b-2 border-black text-center">
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
            DAFTAR CATATAN KASUS &amp; PELANGGARAN SISWA
          </h3>
          <p className="text-[11px] text-gray-700 mt-0.5 font-medium">
            Tanggal Cetak: {fmtDate(todayISO())}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#C9862E] mx-auto opacity-60" />
            <p className="text-xs text-[#647169]">Belum ada catatan kasus / pelanggaran dicatat.</p>
            <button
              onClick={openAddModal}
              className="px-3.5 py-1.5 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold"
            >
              + Catat Kasus Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EFF2EA]/60 border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Siswa</th>
                  <th className="p-3">Tingkat</th>
                  <th className="p-3 text-right">Poin</th>
                  <th className="p-3">Deskripsi Kejadian</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0D4]/60">
                {filtered.map((k) => {
                  const s = activeSiswa.find((item) => item.id === k.siswaId);

                  return (
                    <tr key={k.id} className="hover:bg-[#EFF2EA]/50">
                      <td className="p-3 font-mono text-[#647169]">{fmtDate(k.tanggal)}</td>
                      <td className="p-3 font-bold text-[#1D4137]">
                        {s ? `${s.nama} (${s.kelas || '-'})` : '(Siswa Dihapus)'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            k.jenis === 'ringan'
                              ? 'bg-[#E1EFE7] text-[#4C8C6B]'
                              : k.jenis === 'sedang'
                              ? 'bg-[#F5E7CE] text-[#C9862E]'
                              : 'bg-[#F5DEDA] text-[#B5473A]'
                          }`}
                        >
                          {k.jenis}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#B5473A]">+{k.poin}</td>
                      <td className="p-3 max-w-xs truncate text-[#21322C]">{k.deskripsi}</td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                          {k.status}
                        </span>
                      </td>
                      <td className="p-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(k)}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(k)}
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteKasus(deleteTarget.id);
            showToast('Catatan kasus berhasil dihapus');
          }
        }}
        title="Hapus Catatan Kasus"
        message={
          <>
            Hapus catatan kasus untuk siswa{' '}
            <strong>
              {siswaList.find((s) => s.id === deleteTarget?.siswaId)?.nama || 'Siswa'}
            </strong>{' '}
            ({deleteTarget?.deskripsi})?
          </>
        }
        detailMessage="Poin pelanggaran terkait akan ikut terhapus dari riwayat siswa."
        confirmText="Ya, Hapus Kasus"
        variant="danger"
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingKasus ? 'Edit Catatan Kasus' : 'Catat Pelanggaran / Kasus Baru'}
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#2D5F52] text-white font-semibold text-xs rounded-xl hover:bg-[#1D4137]"
            >
              {editingKasus ? 'Simpan Perubahan' : 'Simpan Kasus'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Pilih Siswa *</label>
            <select
              required
              value={formData.siswaId || ''}
              onChange={(e) => setFormData({ ...formData, siswaId: e.target.value })}
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            >
              {activeSiswa.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} · Kelas {s.kelas || '-'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Tanggal Kejadian</label>
              <input
                type="date"
                required
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Bobot Poin</label>
              <input
                type="number"
                min="1"
                required
                value={formData.poin || 10}
                onChange={(e) => setFormData({ ...formData, poin: Number(e.target.value) })}
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Tingkat Pelanggaran</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'ringan', label: 'Ringan (10 pt)', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
                { type: 'sedang', label: 'Sedang (25 pt)', color: 'bg-amber-100 border-amber-300 text-amber-900' },
                { type: 'berat', label: 'Berat (50 pt)', color: 'bg-red-100 border-red-300 text-red-900' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => handleJenisChange(item.type as JenisKasusType)}
                  className={`p-2.5 border rounded-xl font-bold text-center transition-all ${
                    formData.jenis === item.type
                      ? `${item.color} ring-2 ring-[#2D5F52]`
                      : 'bg-[#EFF2EA] border-[#D9E0D4] text-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Deskripsi Kejadian *</label>
            <textarea
              required
              rows={3}
              value={formData.deskripsi || ''}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Uraikan bentuk pelanggaran yang terjadi..."
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Tindak Lanjut / Sanksi</label>
            <textarea
              rows={2}
              value={formData.tindakLanjut || ''}
              onChange={(e) => setFormData({ ...formData, tindakLanjut: e.target.value })}
              placeholder="Pembinaan, panggilan orang tua, atau kesepakatan tertulis..."
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Status Penanganan</label>
            <select
              value={formData.status || 'baru'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusKasusType })}
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            >
              <option value="baru">Baru</option>
              <option value="proses">Sedang Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
