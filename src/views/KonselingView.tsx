import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, MessageSquare, Printer } from 'lucide-react';
import { Siswa, Konseling, JenisKonselingType } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { todayISO, fmtDate } from '../lib/storage';
import { printDirectElement } from '../lib/printHelper';
import { useBranding } from '../lib/branding';

interface KonselingViewProps {
  siswaList: Siswa[];
  konselingList: Konseling[];
  presetSiswaId?: string;
  onSaveKonseling: (k: Partial<Konseling>, isEdit?: boolean) => void;
  onDeleteKonseling: (id: string) => void;
  showToast: (msg: string) => void;
}

export const KonselingView: React.FC<KonselingViewProps> = ({
  siswaList,
  konselingList,
  presetSiswaId,
  onSaveKonseling,
  onDeleteKonseling,
  showToast,
}) => {
  const { branding } = useBranding();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Konseling | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Konseling | null>(null);

  const activeSiswa = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');

  const [formData, setFormData] = useState<Partial<Konseling>>({
    siswaId: presetSiswaId || activeSiswa[0]?.id || '',
    siswaNama: '',
    tanggal: todayISO(),
    jam: '09:00',
    jenis: 'individu',
    topik: '',
    catatan: '',
    tindakLanjut: '',
  });

  const filtered = konselingList.filter((k) => {
    const s = k.siswaId ? activeSiswa.find((item) => item.id === k.siswaId) : null;
    const nameStr = (s ? s.nama : k.siswaNama || '').toLowerCase();
    const q = search.toLowerCase().trim();
    const matchSearch = !q || nameStr.includes(q) || k.topik.toLowerCase().includes(q);
    const matchJenis = !filterJenis || k.jenis === filterJenis;
    return matchSearch && matchJenis;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      siswaId: presetSiswaId || activeSiswa[0]?.id || '',
      siswaNama: '',
      tanggal: todayISO(),
      jam: '09:00',
      jenis: 'individu',
      topik: '',
      catatan: '',
      tindakLanjut: '',
    });
    setIsModalOpen(true);
  };

  const handlePrintKonseling = () => {
    printDirectElement('konselingPrintArea', {
      title: `Jurnal Konseling BK - ${branding.schoolName || 'Sekolah'}`,
      orientation: 'landscape',
    });
  };

  const openEditModal = (k: Konseling) => {
    setEditingItem(k);
    setFormData({ ...k });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topik?.trim()) {
      showToast('Topik konseling wajib diisi');
      return;
    }

    if (editingItem) {
      onSaveKonseling({ ...editingItem, ...formData }, true);
      showToast('Sesi konseling diperbarui');
    } else {
      onSaveKonseling(formData, false);
      showToast('Sesi konseling baru dicatat');
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
              placeholder="Cari siswa atau topik konseling..."
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
            <option value="">Semua Layanan</option>
            <option value="individu">Individu</option>
            <option value="kelompok">Kelompok</option>
            <option value="klasikal">Klasikal</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintKonseling}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-bold hover:bg-[#1D4137] shadow-xs transition-colors"
            title="Cetak langsung jurnal sesi konseling ke mesin printer tanpa harus mendownload file"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Langsung</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D4137] text-white rounded-xl text-xs font-semibold hover:bg-[#152E27] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Sesi Konseling</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div id="konselingPrintArea" className="print-area bg-white rounded-2xl border border-[#D9E0D4] shadow-xs overflow-hidden p-0 print:p-4">
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
            JURNAL &amp; CATATAN SESI KONSELING SISWA
          </h3>
          <p className="text-[11px] text-gray-700 mt-0.5 font-medium">
            Tanggal Cetak: {fmtDate(todayISO())}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <MessageSquare className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-xs text-[#647169]">Belum ada sesi konseling BK dicatat.</p>
            <button
              onClick={openAddModal}
              className="px-3.5 py-1.5 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold"
            >
              + Catat Sesi Konseling Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EFF2EA]/60 border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Siswa / Sasaran</th>
                  <th className="p-3">Jenis Layanan</th>
                  <th className="p-3">Topik Konseling</th>
                  <th className="p-3">Tindak Lanjut</th>
                  <th className="p-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0D4]/60">
                {filtered.map((k) => {
                  const s = k.siswaId ? activeSiswa.find((item) => item.id === k.siswaId) : null;
                  const sasaranStr = s ? `${s.nama} (${s.kelas || '-'})` : k.siswaNama || '-';

                  return (
                    <tr key={k.id} className="hover:bg-[#EFF2EA]/50">
                      <td className="p-3 font-mono text-[#647169]">
                        {fmtDate(k.tanggal)} {k.jam ? `(${k.jam})` : ''}
                      </td>
                      <td className="p-3 font-bold text-[#1D4137]">{sasaranStr}</td>
                      <td className="p-3">
                        <span className="capitalize px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#1D4137]">
                          {k.jenis}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#21322C]">{k.topik}</td>
                      <td className="p-3 text-[#647169]">{k.tindakLanjut || '-'}</td>
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
            onDeleteKonseling(deleteTarget.id);
            showToast('Sesi konseling berhasil dihapus');
          }
        }}
        title="Hapus Sesi Konseling"
        message={
          <>
            Hapus sesi konseling dengan topik{' '}
            <strong>"{deleteTarget?.topik}"</strong>?
          </>
        }
        detailMessage="Catatan proses dan rencana tindak lanjut pada sesi ini akan terhapus."
        confirmText="Ya, Hapus Sesi"
        variant="danger"
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Sesi Konseling' : 'Catat Sesi Konseling BK'}
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
              {editingItem ? 'Simpan Perubahan' : 'Simpan Sesi Konseling'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Jenis Layanan Konseling</label>
            <select
              value={formData.jenis || 'individu'}
              onChange={(e) => setFormData({ ...formData, jenis: e.target.value as JenisKonselingType })}
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none font-bold"
            >
              <option value="individu">Konseling Individu</option>
              <option value="kelompok">Konseling Kelompok</option>
              <option value="klasikal">Bimbingan Klasikal (Kelas)</option>
            </select>
          </div>

          {formData.jenis === 'individu' ? (
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Siswa Target *</label>
              <select
                required
                value={formData.siswaId || ''}
                onChange={(e) => setFormData({ ...formData, siswaId: e.target.value, siswaNama: '' })}
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              >
                {activeSiswa.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} · Kelas {s.kelas || '-'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Nama Kelompok / Kelas Sasaran *</label>
              <input
                type="text"
                required
                value={formData.siswaNama || ''}
                onChange={(e) => setFormData({ ...formData, siswaNama: e.target.value, siswaId: '' })}
                placeholder="Misal: Kelompok Belajar Kelas 8A / Kelas 7B"
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Jam Sesi</label>
              <input
                type="time"
                value={formData.jam || ''}
                onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Topik / Masalah / Materi *</label>
            <input
              type="text"
              required
              value={formData.topik || ''}
              onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
              placeholder="Misal: Manajemen Stres, Penyesuaian Diri, Bahaya Bullying..."
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Catatan Proses Konseling</label>
            <textarea
              rows={3}
              value={formData.catatan || ''}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Garis besar pembimbingan, dinamika siswa, dan respons..."
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Rencana Tindak Lanjut</label>
            <textarea
              rows={2}
              value={formData.tindakLanjut || ''}
              onChange={(e) => setFormData({ ...formData, tindakLanjut: e.target.value })}
              placeholder="Sesi lanjutan, konseling kelompok, atau koordinasi wali kelas..."
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
