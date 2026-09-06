import * as XLSX from 'xlsx';
import { Siswa, Kasus, Konseling, Terlambat, Absensi } from '../types';
import { fmtDate, todayISO } from './storage';

function fitToColumn(dataRows: Array<Record<string, any>>) {
  if (!dataRows || dataRows.length === 0) return [];
  const keys = Object.keys(dataRows[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (const row of dataRows) {
      const val = row[key];
      const strVal = val !== undefined && val !== null ? String(val) : '';
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
  });
}

/**
 * 1. Export Laporan Kasus & Pelanggaran ke Excel (.xlsx)
 */
export function exportKasusToExcel(
  kasusList: Kasus[],
  siswaList: Siswa[],
  filterInfo?: { periode?: string; kelas?: string }
) {
  const data = kasusList.map((k, idx) => {
    const s = siswaList.find((x) => x.id === k.siswaId);
    return {
      'No': idx + 1,
      'Tanggal': k.tanggal ? fmtDate(k.tanggal) : '-',
      'NIS': s?.nis || '-',
      'Nama Siswa': s?.nama || '-',
      'Kelas': s?.kelas || '-',
      'JK': s?.jk === 'P' ? 'Perempuan' : 'Laki-laki',
      'Tingkat Pelanggaran': (k.jenis || 'ringan').toUpperCase(),
      'Poin': Number(k.poin) || 0,
      'Uraian Kasus / Pelanggaran': k.deskripsi || '-',
      'Tindak Lanjut / Sanksi': k.tindakLanjut || '-',
      'Status Kasus': (k.status || 'baru').toUpperCase(),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ 'Pemberitahuan': 'Tidak ada data kasus pada filter ini' }]);
  if (data.length > 0) ws['!cols'] = fitToColumn(data);

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kasus');
  const filename = `Laporan_Kasus_Pelanggaran_${filterInfo?.kelas ? `Kelas_${filterInfo.kelas}_` : ''}${todayISO()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 2. Export Laporan Keterlambatan ke Excel (.xlsx)
 */
export function exportTerlambatToExcel(
  terlambatList: Terlambat[],
  siswaList: Siswa[],
  filterInfo?: { periode?: string; kelas?: string }
) {
  const data = terlambatList.map((t, idx) => {
    const s = siswaList.find((x) => x.id === t.siswaId);
    return {
      'No': idx + 1,
      'Tanggal': t.tanggal ? fmtDate(t.tanggal) : '-',
      'Jam Masuk': t.jam || '-',
      'NIS': s?.nis || '-',
      'Nama Siswa': s?.nama || '-',
      'Kelas': s?.kelas || '-',
      'JK': s?.jk === 'P' ? 'Perempuan' : 'Laki-laki',
      'Terlambat (Menit)': Number(t.menit) || 0,
      'Alasan / Keterangan': t.keterangan || 'Terlambat masuk sekolah',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ 'Pemberitahuan': 'Tidak ada data keterlambatan pada filter ini' }]);
  if (data.length > 0) ws['!cols'] = fitToColumn(data);

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keterlambatan');
  const filename = `Laporan_Keterlambatan_${filterInfo?.kelas ? `Kelas_${filterInfo.kelas}_` : ''}${todayISO()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 3. Export Laporan Siswa Pindah / Keluar / Berhenti ke Excel (.xlsx)
 */
export function exportSiswaKeluarToExcel(
  siswaKeluarList: Siswa[],
  kasusList: Kasus[] = [],
  konselingList: Konseling[] = []
) {
  const data = siswaKeluarList.map((s, idx) => {
    const totalKasus = kasusList.filter((k) => k.siswaId === s.id).length;
    const totalPoin = kasusList
      .filter((k) => k.siswaId === s.id)
      .reduce((sum, k) => sum + (Number(k.poin) || 0), 0);
    const totalKonseling = konselingList.filter((c) => c.siswaId === s.id).length;

    let statusStr = 'Non-Aktif';
    if (s.status === 'berhenti') statusStr = 'Berhenti Sekolah';
    else if (s.status === 'pindah') statusStr = 'Pindah Sekolah';
    else if (s.status === 'keluar') statusStr = 'Keluar';

    return {
      'No': idx + 1,
      'NIS': s.nis || '-',
      'Nama Siswa': s.nama,
      'Kelas Terakhir': s.kelas || '-',
      'JK': s.jk === 'P' ? 'Perempuan' : 'Laki-laki',
      'Status': statusStr,
      'Nama Orang Tua / Wali': s.ortu || '-',
      'No. Telepon / HP': s.hp || '-',
      'Catatan / Alasan': s.catatan || '-',
      'Total Kasus Tercatat': totalKasus,
      'Akumulasi Poin': totalPoin,
      'Total Sesi Konseling': totalKonseling,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ 'Pemberitahuan': 'Tidak ada data siswa keluar pada filter ini' }]);
  if (data.length > 0) ws['!cols'] = fitToColumn(data);

  XLSX.utils.book_append_sheet(wb, ws, 'Siswa Pindah & Keluar');
  const filename = `Laporan_Siswa_Pindah_Keluar_${todayISO()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 4. Export Rekap Lengkap Bulanan Siswa ke Excel (.xlsx)
 */
export function exportRekapBulananToExcel(
  siswaList: Siswa[],
  kasusList: Kasus[],
  konselingList: Konseling[],
  terlambatList: Terlambat[],
  absensiList: Absensi[],
  periodeTitle: string
) {
  const activeSiswa = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');
  const data = activeSiswa.map((s, idx) => {
    const kList = kasusList.filter((k) => k.siswaId === s.id);
    const kCount = kList.length;
    const poin = kList.reduce((sum, k) => sum + (Number(k.poin) || 0), 0);
    const cCount = konselingList.filter((c) => c.siswaId === s.id).length;
    const tCount = terlambatList.filter((t) => t.siswaId === s.id).length;
    const aSakit = absensiList.filter((a) => a.siswaId === s.id && a.status === 'sakit').length;
    const aIzin = absensiList.filter((a) => a.siswaId === s.id && a.status === 'izin').length;
    const aAlpa = absensiList.filter((a) => a.siswaId === s.id && a.status === 'alpa').length;

    return {
      'No': idx + 1,
      'NIS': s.nis || '-',
      'Nama Siswa': s.nama,
      'Kelas': s.kelas || '-',
      'JK': s.jk || 'L',
      'Total Kasus': kCount,
      'Poin Pelanggaran': poin,
      'Sesi Konseling': cCount,
      'Keterlambatan (x)': tCount,
      'Sakit (Hari)': aSakit,
      'Izin (Hari)': aIzin,
      'Alpa (Hari)': aAlpa,
      'Status Siswa': 'Aktif',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = fitToColumn(data);

  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Siswa');
  const filename = `Rekapitulasi_BK_${periodeTitle.replace(/[\s/]/g, '_')}_${todayISO()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 5. Export Semua Laporan ke 1 File Excel Multi-Sheet
 */
export function exportSemuaLaporanMultiSheet(data: {
  siswaList: Siswa[];
  kasusList: Kasus[];
  konselingList: Konseling[];
  terlambatList: Terlambat[];
  absensiList: Absensi[];
}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Kasus & Pelanggaran
  const sheetKasus = data.kasusList.map((k, idx) => {
    const s = data.siswaList.find((x) => x.id === k.siswaId);
    return {
      'No': idx + 1,
      'Tanggal': k.tanggal ? fmtDate(k.tanggal) : '-',
      'NIS': s?.nis || '-',
      'Nama Siswa': s?.nama || '-',
      'Kelas': s?.kelas || '-',
      'Tingkat': (k.jenis || 'ringan').toUpperCase(),
      'Poin': Number(k.poin) || 0,
      'Deskripsi Pelanggaran': k.deskripsi || '-',
      'Tindak Lanjut': k.tindakLanjut || '-',
      'Status': (k.status || 'baru').toUpperCase(),
    };
  });
  const wsKasus = XLSX.utils.json_to_sheet(sheetKasus.length > 0 ? sheetKasus : [{ 'Info': 'Tidak ada data kasus' }]);
  if (sheetKasus.length > 0) wsKasus['!cols'] = fitToColumn(sheetKasus);
  XLSX.utils.book_append_sheet(wb, wsKasus, 'Kasus Pelanggaran');

  // Sheet 2: Keterlambatan
  const sheetTerlambat = data.terlambatList.map((t, idx) => {
    const s = data.siswaList.find((x) => x.id === t.siswaId);
    return {
      'No': idx + 1,
      'Tanggal': t.tanggal ? fmtDate(t.tanggal) : '-',
      'Jam': t.jam || '-',
      'NIS': s?.nis || '-',
      'Nama Siswa': s?.nama || '-',
      'Kelas': s?.kelas || '-',
      'Durasi Menit': Number(t.menit) || 0,
      'Keterangan': t.keterangan || '-',
    };
  });
  const wsTerlambat = XLSX.utils.json_to_sheet(sheetTerlambat.length > 0 ? sheetTerlambat : [{ 'Info': 'Tidak ada data keterlambatan' }]);
  if (sheetTerlambat.length > 0) wsTerlambat['!cols'] = fitToColumn(sheetTerlambat);
  XLSX.utils.book_append_sheet(wb, wsTerlambat, 'Keterlambatan');

  // Sheet 3: Siswa Pindah & Keluar
  const inactive = data.siswaList.filter((s) => (s.status || 'aktif') !== 'aktif');
  const sheetKeluar = inactive.map((s, idx) => ({
    'No': idx + 1,
    'NIS': s.nis || '-',
    'Nama Siswa': s.nama,
    'Kelas': s.kelas || '-',
    'JK': s.jk || 'L',
    'Status': (s.status || 'nonaktif').toUpperCase(),
    'Orang Tua': s.ortu || '-',
    'No HP': s.hp || '-',
    'Catatan / Alasan': s.catatan || '-',
  }));
  const wsKeluar = XLSX.utils.json_to_sheet(sheetKeluar.length > 0 ? sheetKeluar : [{ 'Info': 'Tidak ada data siswa keluar' }]);
  if (sheetKeluar.length > 0) wsKeluar['!cols'] = fitToColumn(sheetKeluar);
  XLSX.utils.book_append_sheet(wb, wsKeluar, 'Siswa Pindah & Keluar');

  // Sheet 4: Rekap Siswa Aktif
  const activeSiswa = data.siswaList.filter((s) => (s.status || 'aktif') === 'aktif');
  const sheetRekap = activeSiswa.map((s, idx) => ({
    'No': idx + 1,
    'NIS': s.nis || '-',
    'Nama Siswa': s.nama,
    'Kelas': s.kelas || '-',
    'JK': s.jk || 'L',
    'Total Kasus': data.kasusList.filter((k) => k.siswaId === s.id).length,
    'Poin Pelanggaran': data.kasusList
      .filter((k) => k.siswaId === s.id)
      .reduce((sum, k) => sum + (Number(k.poin) || 0), 0),
    'Konseling': data.konselingList.filter((c) => c.siswaId === s.id).length,
    'Terlambat': data.terlambatList.filter((t) => t.siswaId === s.id).length,
  }));
  const wsRekap = XLSX.utils.json_to_sheet(sheetRekap);
  wsRekap['!cols'] = fitToColumn(sheetRekap);
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap Siswa Aktif');

  const filename = `Laporan_Lengkap_BK_Semua_Data_${todayISO()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
