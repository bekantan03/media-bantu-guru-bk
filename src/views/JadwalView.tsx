import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Jadwal } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { todayISO, fmtDate } from '../lib/storage';

interface JadwalViewProps {
  jadwalList: Jadwal[];
  onSaveJadwal: (j: Partial<Jadwal>, isEdit?: boolean) => void;
  onDeleteJadwal: (id: string) => void;
  onToggleStatus: (id: string) => void;
  showToast: (msg: string) => void;
}

export const JadwalView: React.FC<JadwalViewProps> = ({
  jadwalList,
  onSaveJadwal,
  onDeleteJadwal,
  onToggleStatus,
  showToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Jadwal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Jadwal | null>(null);

  const [formData, setFormData] = useState<Partial<Jadwal>>({
    tanggal: todayISO(),
    jam: '08:00',
    kegiatan: '',
    sasaran: '',
    tempat: '',
    catatan: '',
    selesai: false,
  });

  const sortedJadwal = [...jadwalList].sort((a, b) =>
    (a.tanggal + (a.jam || '')).localeCompare(b.tanggal + (b.jam || ''))
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      tanggal: todayISO(),
      jam: '08:00',
      kegiatan: '',
      sasaran: '',
      tempat: '',
      catatan: '',
      selesai: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (j: Jadwal) => {
    setEditingItem(j);
    setFormData({ ...j });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kegiatan?.trim()) {
      showToast('Nama kegiatan wajib diisi');
      return;
    }

    if (editingItem) {
      onSaveJadwal({ ...editingItem, ...formData }, true);
      showToast('Jadwal diperbarui');
    } else {
      onSaveJadwal(formData, false);
      showToast('Jadwal kegiatan baru ditambahkan');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9E0D4] shadow-xs flex justify-between items-center">
        <h3 className="font-serif font-bold text-base text-[#1D4137] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2D5F52]" />
          Agenda Layanan &amp; Kegiatan BK
        </h3>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold hover:bg-[#1D4137] shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah Agenda Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#D9E0D4] shadow-xs overflow-hidden">
        {sortedJadwal.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-xs text-[#647169]">Belum ada jadwal kegiatan BK.</p>
            <button
              onClick={openAddModal}
              className="px-3.5 py-1.5 bg-[#2D5F52] text-white rounded-xl text-xs font-semibold"
            >
              + Tambah Agenda Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EFF2EA]/60 border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Jam</th>
                  <th className="p-3">Nama Kegiatan</th>
                  <th className="p-3">Sasaran</th>
                  <th className="p-3">Tempat</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0D4]/60">
                {sortedJadwal.map((j) => (
                  <tr key={j.id} className="hover:bg-[#EFF2EA]/50">
                    <td className="p-3 font-mono text-[#647169]">{fmtDate(j.tanggal)}</td>
                    <td className="p-3 font-mono font-bold text-[#1D4137]">{j.jam || '-'}</td>
                    <td className="p-3 font-bold text-[#1D4137]">{j.kegiatan}</td>
                    <td className="p-3 text-[#647169]">{j.sasaran || '-'}</td>
                    <td className="p-3 text-[#647169]">{j.tempat || '-'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          onToggleStatus(j.id);
                          showToast(j.selesai ? 'Jadwal ditandai belum selesai' : 'Jadwal selesai');
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          j.selesai
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {j.selesai ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Selesai</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Terjadwal</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(j)}
                          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(j)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteJadwal(deleteTarget.id);
            showToast('Jadwal berhasil dihapus');
          }
        }}
        title="Hapus Jadwal Kegiatan"
        message={
          <>
            Apakah Anda yakin ingin menghapus jadwal <strong>{deleteTarget?.kegiatan}</strong> ({deleteTarget ? fmtDate(deleteTarget.tanggal) : ''})?
          </>
        }
        detailMessage="Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Jadwal"
        variant="danger"
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Jadwal' : 'Tambah Agenda Kegiatan BK'}
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
              {editingItem ? 'Simpan Perubahan' : 'Tambah Agenda'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Nama Kegiatan *</label>
            <input
              type="text"
              required
              value={formData.kegiatan || ''}
              onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
              placeholder="Misal: Bimbingan Klasikal 8A / Home Visit Siswa A"
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            />
          </div>

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
              <label className="block font-bold text-[#1D4137] mb-1">Jam Pelaksanaan</label>
              <input
                type="time"
                value={formData.jam || ''}
                onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Target / Sasaran</label>
              <input
                type="text"
                value={formData.sasaran || ''}
                onChange={(e) => setFormData({ ...formData, sasaran: e.target.value })}
                placeholder="Kelas / nama siswa"
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1D4137] mb-1">Tempat Lokasi</label>
              <input
                type="text"
                value={formData.tempat || ''}
                onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                placeholder="Ruang BK, Kelas, Rumah Siswa..."
                className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] mb-1">Catatan Persiapan</label>
            <textarea
              rows={2}
              value={formData.catatan || ''}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Perlengkapan yang perlu disiapkan..."
              className="w-full p-2.5 bg-[#EFF2EA] border border-[#D9E0D4] rounded-xl focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
