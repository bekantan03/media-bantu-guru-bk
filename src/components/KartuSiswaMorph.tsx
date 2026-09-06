import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, ArrowLeft, AlertTriangle, MessageSquare, Clock, Trash2, UserX } from 'lucide-react';
import { Siswa, Kasus, Konseling, Terlambat } from '../types';
import { initials, fmtDate } from '../lib/storage';
import { ConfirmModal } from './ConfirmModal';

interface KartuSiswaMorphProps {
  siswa: Siswa;
  poin: number;
  kasusList: Kasus[];
  konselingList: Konseling[];
  terlambatList: Terlambat[];
  activeTab: 'kasus' | 'konseling' | 'terlambat';
  onChangeTab: (tab: 'kasus' | 'konseling' | 'terlambat') => void;
  onBack: () => void;
  onToggleAsuh: (siswaId: string) => void;
  onDeleteSiswa?: (siswaId: string) => void;
  onChangeStatus?: (siswaId: string, status: 'berhenti' | 'keluar' | 'pindah' | 'aktif') => void;
  onDeleteKasus?: (id: string) => void;
  onDeleteKonseling?: (id: string) => void;
  onDeleteTerlambat?: (id: string) => void;
}

export const KartuSiswaMorph: React.FC<KartuSiswaMorphProps> = ({
  siswa,
  poin,
  kasusList,
  konselingList,
  terlambatList,
  activeTab,
  onChangeTab,
  onBack,
  onToggleAsuh,
  onDeleteSiswa,
  onChangeStatus,
  onDeleteKasus,
  onDeleteKonseling,
  onDeleteTerlambat,
}) => {
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    detailMessage?: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  return (
    <div className="space-y-6 pt-2">
      {/* Back link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#647169] hover:text-[#1D4137] transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Kembali ke Data Siswa</span>
      </button>

      {/* Main Student Card Container with Morph Animation */}
      <motion.div
        layoutId={`siswa-card-${siswa.id}`}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative bg-white dark:bg-[#1A2E27] rounded-2xl rounded-tl-none border border-[#D9E0D4] dark:border-[#2D483F] border-t-4 border-t-[#1D4137] shadow-xl overflow-hidden p-4 sm:p-6 mt-3"
      >
        {/* Folder tab accent on top */}
        <div className="absolute -top-[33px] left-0 bg-[#1D4137] text-white text-[11px] font-mono font-bold tracking-wider uppercase px-4 py-1.5 rounded-t-lg">
          KARTU SISWA {siswa.asuh ? '· SISWA ASUH' : ''}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
          <div className="flex items-start sm:items-center gap-4">
            <motion.div
              layoutId={`siswa-avatar-${siswa.id}`}
              className="w-16 h-16 rounded-2xl bg-[#F3E3C8] text-[#C9862E] font-serif text-2xl font-bold flex items-center justify-center border-2 border-[#C9862E] shrink-0 shadow-sm"
            >
              {initials(siswa.nama)}
            </motion.div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <motion.h2
                  layoutId={`siswa-nama-${siswa.id}`}
                  className="font-serif font-bold text-xl sm:text-2xl text-[#1D4137]"
                >
                  {siswa.nama}
                </motion.h2>

                {siswa.asuh && (
                  <span className="inline-flex items-center gap-1 bg-[#EBE4F5] text-[#7B5EA7] text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                    <Star className="w-3 h-3 fill-current" />
                    Siswa Asuh
                  </span>
                )}
              </div>

              <p className="text-xs font-mono text-[#647169]">
                NIS {siswa.nis || '-'} · Kelas {siswa.kelas || '-'}
              </p>

              <div className="flex items-center gap-4 text-xs text-[#647169] pt-1 flex-wrap">
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] block">Jenis Kelamin</span>
                  <span className="font-medium text-gray-800">{siswa.jk === 'L' ? 'Laki-laki' : siswa.jk === 'P' ? 'Perempuan' : '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] block">Orang Tua / Wali</span>
                  <span className="font-medium text-gray-800">{siswa.ortu || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] block">No. HP</span>
                  <span className="font-medium text-gray-800">{siswa.hp || '-'}</span>
                </div>
              </div>

              {siswa.catatan && (
                <div className="pt-2 text-xs text-[#647169] border-t border-gray-100 mt-2">
                  <span className="font-bold text-gray-700">Catatan Khusus: </span>
                  <span>{siswa.catatan}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-[#EFF2EA] px-6 py-3.5 rounded-2xl border border-[#D9E0D4] self-stretch md:self-auto text-center shrink-0">
            <span className={`font-serif text-3xl font-bold ${poin >= 50 ? 'text-[#B5473A]' : poin >= 25 ? 'text-[#C9862E]' : 'text-[#1D4137]'}`}>
              {poin}
            </span>
            <span className="text-[10px] font-bold tracking-wider text-[#647169] uppercase mt-0.5">
              Poin Pelanggaran
            </span>
          </div>
        </div>

        {/* Action toolbar */}
        <div className="mt-5 pt-4 border-t border-[#D9E0D4] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onToggleAsuh(siswa.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                siswa.asuh
                  ? 'bg-[#EBE4F5] text-[#7B5EA7] hover:bg-purple-200'
                  : 'bg-[#F3E3C8] text-[#2A1B04] hover:bg-amber-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${siswa.asuh ? 'fill-current' : ''}`} />
              <span>{siswa.asuh ? 'Hapus Tanda Siswa Asuh' : 'Tandai sebagai Siswa Asuh'}</span>
            </button>

            {onChangeStatus && (
              <button
                onClick={() => {
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Ubah Status Siswa',
                    message: (
                      <>
                        Ubah status siswa <strong>{siswa.nama}</strong> menjadi <strong>BERHENTI / KELUAR</strong>?
                      </>
                    ),
                    detailMessage: 'Data siswa ini akan dipindahkan dari daftar aktif ke daftar Siswa Keluar.',
                    confirmText: 'Ya, Set Berhenti/Keluar',
                    variant: 'warning',
                    onConfirm: () => {
                      onChangeStatus(siswa.id, 'berhenti');
                      onBack();
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Set Berhenti / Keluar</span>
              </button>
            )}
          </div>

          {onDeleteSiswa && (
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
                  detailMessage: 'Semua riwayat kasus, konseling, keterlambatan, dan presensi siswa akan dihapus.',
                  confirmText: 'Ya, Hapus Siswa',
                  variant: 'danger',
                  onConfirm: () => {
                    onDeleteSiswa(siswa.id);
                    onBack();
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Data Siswa</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D9E0D4] pb-px">
        {[
          { key: 'kasus', label: `Riwayat Kasus (${kasusList.length})`, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { key: 'konseling', label: `Riwayat Konseling (${konselingList.length})`, icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { key: 'terlambat', label: `Riwayat Terlambat (${terlambatList.length})`, icon: <Clock className="w-3.5 h-3.5" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key as any)}
              className={`relative px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors ${
                isActive ? 'text-[#1D4137]' : 'text-[#647169] hover:text-black'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9862E]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-[#D9E0D4] p-5 shadow-sm">
        {activeTab === 'kasus' && (
          <div className="space-y-3">
            {kasusList.length === 0 ? (
              <p className="text-sm text-center py-8 text-[#647169]">Belum ada riwayat kasus/pelanggaran untuk siswa ini.</p>
            ) : (
              kasusList.map((k) => (
                <div key={k.id} className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-[#EFF2EA]/50 border border-[#D9E0D4]/70">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#647169]">{fmtDate(k.tanggal)}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        k.jenis === 'ringan' ? 'bg-[#E1EFE7] text-[#4C8C6B]' : k.jenis === 'sedang' ? 'bg-[#F5E7CE] text-[#C9862E]' : 'bg-[#F5DEDA] text-[#B5473A]'
                      }`}>
                        {k.jenis.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1D4137]">{k.deskripsi}</p>
                    {k.tindakLanjut && (
                      <p className="text-xs text-[#647169]">Tindak lanjut: {k.tindakLanjut}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-sm text-[#B5473A] bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                      +{k.poin} pt
                    </span>
                    {onDeleteKasus && (
                      <button
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Hapus Catatan Kasus',
                            message: (
                              <>
                                Hapus catatan kasus <strong>"{k.deskripsi}"</strong> dari riwayat siswa?
                              </>
                            ),
                            confirmText: 'Ya, Hapus Kasus',
                            variant: 'danger',
                            onConfirm: () => onDeleteKasus(k.id),
                          });
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Kasus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'konseling' && (
          <div className="space-y-3">
            {konselingList.length === 0 ? (
              <p className="text-sm text-center py-8 text-[#647169]">Belum ada sesi konseling tercatat untuk siswa ini.</p>
            ) : (
              konselingList.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-[#EFF2EA]/50 border border-[#D9E0D4]/70 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#647169]">{fmtDate(c.tanggal)} {c.jam ? `(${c.jam})` : ''}</span>
                      <span className="bg-[#DCE8E1] text-[#1D4137] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {c.jenis}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1D4137]">{c.topik}</p>
                    {c.catatan && <p className="text-xs text-[#647169]">Catatan: {c.catatan}</p>}
                  </div>
                  {onDeleteKonseling && (
                    <button
                      onClick={() => {
                        setConfirmConfig({
                          isOpen: true,
                          title: 'Hapus Sesi Konseling',
                          message: (
                            <>
                              Hapus sesi konseling <strong>"{c.topik}"</strong> dari riwayat siswa?
                            </>
                          ),
                          confirmText: 'Ya, Hapus Sesi',
                          variant: 'danger',
                          onConfirm: () => onDeleteKonseling(c.id),
                        });
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Hapus Sesi Konseling"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'terlambat' && (
          <div className="space-y-3">
            {terlambatList.length === 0 ? (
              <p className="text-sm text-center py-8 text-[#647169]">Belum ada riwayat keterlambatan untuk siswa ini.</p>
            ) : (
              terlambatList.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#EFF2EA]/50 border border-[#D9E0D4]/70">
                  <div>
                    <div className="text-xs font-mono text-[#647169]">{fmtDate(t.tanggal)}</div>
                    <p className="text-sm font-semibold text-[#1D4137]">Datang pukul {t.jam || '-'}</p>
                    {t.keterangan && <p className="text-xs text-[#647169]">{t.keterangan}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.menit && (
                      <span className="bg-[#F5E7CE] text-[#8F5F1C] text-xs font-bold px-2.5 py-1 rounded-lg">
                        {t.menit} mnt
                      </span>
                    )}
                    {onDeleteTerlambat && (
                      <button
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Hapus Keterlambatan',
                            message: (
                              <>
                                Hapus catatan keterlambatan tanggal <strong>{fmtDate(t.tanggal)}</strong>?
                              </>
                            ),
                            confirmText: 'Ya, Hapus Catatan',
                            variant: 'danger',
                            onConfirm: () => onDeleteTerlambat(t.id),
                          });
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Keterlambatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Reusable Confirm Modal */}
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
