import React, { useState } from 'react';
import { Save, CheckCircle2, Trash2 } from 'lucide-react';
import { Siswa, Absensi, KelasItem, StatusAbsensiType } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { todayISO, fmtDate } from '../lib/storage';

interface AbsensiViewProps {
  siswaList: Siswa[];
  kelasList: KelasItem[];
  absensiList: Absensi[];
  onSaveAbsensi: (records: { siswaId: string; tanggal: string; status: StatusAbsensiType; keterangan?: string }[]) => void;
  showToast: (msg: string) => void;
}

export const AbsensiView: React.FC<AbsensiViewProps> = ({
  siswaList,
  kelasList,
  absensiList,
  onSaveAbsensi,
  showToast,
}) => {
  const allKelasNames = Array.from(
    new Set([...kelasList.map((k) => k.nama), ...siswaList.map((s) => s.kelas || '')].filter(Boolean))
  ).sort();

  const [selectedKelas, setSelectedKelas] = useState(allKelasNames[0] || '7A');
  const [selectedTanggal, setSelectedTanggal] = useState(todayISO());
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const activeSiswa = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');
  const siswaKelas = activeSiswa
    .filter((s) => (s.kelas || '') === selectedKelas)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  // Local state for attendance records in this session
  const [localAbsensi, setLocalAbsensi] = useState<Record<string, { status: StatusAbsensiType; keterangan: string }>>({});

  // Sync localAbsensi whenever selectedKelas, selectedTanggal, absensiList or siswaKelas changes
  React.useEffect(() => {
    const initialMap: Record<string, { status: StatusAbsensiType; keterangan: string }> = {};
    siswaKelas.forEach((s) => {
      const rec = absensiList.find((a) => a.siswaId === s.id && a.tanggal === selectedTanggal);
      initialMap[s.id] = {
        status: rec ? rec.status : 'hadir',
        keterangan: rec?.keterangan || '',
      };
    });
    setLocalAbsensi(initialMap);
  }, [selectedKelas, selectedTanggal, absensiList, siswaList]);

  const handleStatusChange = (siswaId: string, status: StatusAbsensiType) => {
    setLocalAbsensi((prev) => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || { status: 'hadir', keterangan: '' }),
        status,
      },
    }));
  };

  const handleKeteranganChange = (siswaId: string, keterangan: string) => {
    setLocalAbsensi((prev) => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || { status: 'hadir', keterangan: '' }),
        keterangan,
      },
    }));
  };

  const handleSaveAll = () => {
    const recordsToSave = siswaKelas.map((s) => {
      const record = localAbsensi[s.id] || { status: 'hadir' as StatusAbsensiType, keterangan: '' };
      return {
        siswaId: s.id,
        tanggal: selectedTanggal,
        status: record.status,
        keterangan: record.keterangan,
      };
    });

    onSaveAbsensi(recordsToSave);
    showToast(`Absensi kelas ${selectedKelas} (${fmtDate(selectedTanggal)}) tersimpan`);
  };

  const handleResetAll = () => {
    const resetMap: Record<string, { status: StatusAbsensiType; keterangan: string }> = {};
    siswaKelas.forEach((s) => {
      resetMap[s.id] = { status: 'hadir', keterangan: '' };
    });
    setLocalAbsensi(resetMap);
    showToast(`Presensi kelas ${selectedKelas} di-reset ke Hadir`);
  };

  // Recalculate stats
  const stats = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  siswaKelas.forEach((s) => {
    const st = localAbsensi[s.id]?.status || 'hadir';
    if (stats[st] !== undefined) stats[st]++;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9E0D4] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] font-bold uppercase text-[#647169] block mb-1">Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-bold text-[#1D4137]"
            >
              {allKelasNames.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#647169] block mb-1">Tanggal</label>
            <input
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="px-3 py-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs font-bold text-[#1D4137]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl font-semibold text-xs hover:bg-red-50 transition-all"
            title="Reset/Kosongkan Presensi"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5F52] text-white rounded-xl font-bold text-xs hover:bg-[#1D4137] shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Absensi Kelas</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 border-l-4 border-l-[#4C8C6B] shadow-2xs">
          <span className="text-xs font-bold text-[#4C8C6B] uppercase">Hadir</span>
          <span className="font-serif font-bold text-2xl text-[#1D4137] block mt-1">{stats.hadir}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-amber-200 border-l-4 border-l-[#C9862E] shadow-2xs">
          <span className="text-xs font-bold text-[#C9862E] uppercase">Sakit</span>
          <span className="font-serif font-bold text-2xl text-[#C9862E] block mt-1">{stats.sakit}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-amber-200 border-l-4 border-l-[#C9862E] shadow-2xs">
          <span className="text-xs font-bold text-[#8F5F1C] uppercase">Izin</span>
          <span className="font-serif font-bold text-2xl text-[#8F5F1C] block mt-1">{stats.izin}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-red-200 border-l-4 border-l-[#B5473A] shadow-2xs">
          <span className="text-xs font-bold text-[#B5473A] uppercase">Alpa</span>
          <span className="font-serif font-bold text-2xl text-[#B5473A] block mt-1">{stats.alpa}</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-[#D9E0D4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#EFF2EA]/60 border-b border-[#D9E0D4] flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#1D4137] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D5F52]" />
            Daftar Presensi Kelas {selectedKelas} — {fmtDate(selectedTanggal)}
          </h3>
          <span className="text-xs text-[#647169] font-mono">{siswaKelas.length} Siswa</span>
        </div>

        {siswaKelas.length === 0 ? (
          <p className="text-center py-12 text-xs text-[#647169]">
            Belum ada siswa aktif terdaftar di Kelas {selectedKelas}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D9E0D4] text-[#647169] uppercase font-bold tracking-wider">
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3 w-48">Status Kehadiran</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0D4]/60">
                {siswaKelas.map((siswa, idx) => {
                  const rec = localAbsensi[siswa.id] || { status: 'hadir', keterangan: '' };

                  return (
                    <tr key={siswa.id} className="hover:bg-[#EFF2EA]/50">
                      <td className="p-3 text-center font-mono text-[#647169]">{idx + 1}</td>
                      <td className="p-3 font-bold text-[#1D4137]">
                        {siswa.nama} {siswa.asuh && <span className="text-amber-500">★</span>}
                      </td>
                      <td className="p-3 font-mono text-[#647169]">{siswa.nis || '-'}</td>
                      <td className="p-3">
                        <select
                          value={rec.status}
                          onChange={(e) => handleStatusChange(siswa.id, e.target.value as StatusAbsensiType)}
                          className={`w-full p-2 rounded-xl text-xs font-bold border ${
                            rec.status === 'hadir'
                              ? 'bg-emerald-50 text-[#4C8C6B] border-emerald-200'
                              : rec.status === 'sakit' || rec.status === 'izin'
                              ? 'bg-amber-50 text-[#C9862E] border-amber-200'
                              : 'bg-red-50 text-[#B5473A] border-red-200'
                          }`}
                        >
                          <option value="hadir">Hadir</option>
                          <option value="sakit">Sakit</option>
                          <option value="izin">Izin</option>
                          <option value="alpa">Alpa</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Alasan / catatan (opsional)"
                          value={rec.keterangan}
                          onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                          className="w-full p-2 bg-[#EFF2EA]/60 border border-[#D9E0D4] rounded-xl text-xs focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetAll}
        title="Reset Presensi Kelas"
        message={
          <>
            Apakah Anda yakin ingin me-reset seluruh catatan presensi untuk kelas{' '}
            <strong>{selectedKelas}</strong> pada tanggal <strong>{fmtDate(selectedTanggal)}</strong> ke status <em>'Hadir'</em>?
          </>
        }
        detailMessage="Catatan status absen (sakit, izin, alpa) dan keterangan pada sesi ini akan dikembalikan."
        confirmText="Ya, Reset Presensi"
        variant="warning"
      />
    </div>
  );
};
