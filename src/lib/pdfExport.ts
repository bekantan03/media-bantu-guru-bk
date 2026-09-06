import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { Siswa, Kasus, Terlambat, UserAccount } from '../types';
import { fmtDate, todayISO, currentTahunAjaran, currentSemester, BULAN } from './storage';

interface MetaPDF {
  title?: string;
  periode?: string;
  kelas?: string;
  currentUser?: UserAccount;
  sekolahNama?: string;
  kepalaSekolahNama?: string;
  kepalaSekolahNip?: string;
  guruBkNama?: string;
  guruBkNip?: string;
}

function drawKopSurat(doc: jsPDF, title: string, meta?: MetaPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(29, 65, 55); // #1D4137
  doc.text(meta?.sekolahNama || 'SMA NEGERI 1 ALALAK', pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(33, 50, 44);
  doc.text('LAPORAN BIMBINGAN DAN KONSELING (BK)', pageWidth / 2, 19, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(60, 70, 65);
  doc.text(title.toUpperCase(), pageWidth / 2, 24.5, { align: 'center' });

  // Metadata Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const infoText = `Tahun Ajaran ${currentTahunAjaran()} • Semester ${currentSemester()}${
    meta?.periode ? ` • Periode: ${meta.periode}` : ' • Periode: Semua Waktu'
  }${meta?.kelas ? ` • Kelas: ${meta.kelas}` : ''}`;
  doc.text(infoText, pageWidth / 2, 29.5, { align: 'center' });

  // Double Line Separator
  doc.setDrawColor(29, 65, 55);
  doc.setLineWidth(0.8);
  doc.line(12, 33, pageWidth - 12, 33);
  doc.setLineWidth(0.2);
  doc.line(12, 34.2, pageWidth - 12, 34.2);
}

function drawSignatureSection(doc: jsPDF, startY: number, meta?: MetaPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Check if enough room for signature block (needs ~38mm)
  let finalY = startY + 10;
  if (finalY + 36 > pageHeight - 15) {
    doc.addPage();
    finalY = 22;
  }

  const leftX = 45;
  const rightX = pageWidth - 60;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  // Left Sign: Kepala Sekolah
  const kepsekNip = meta?.kepalaSekolahNip
    ? `NIP. ${meta.kepalaSekolahNip}`
    : 'NIP. .........................................';

  doc.text('Mengetahui,', leftX, finalY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', leftX, finalY + 5, { align: 'center' });
  doc.line(leftX - 25, finalY + 24, leftX + 25, finalY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (meta?.kepalaSekolahNama) {
    doc.text(meta.kepalaSekolahNama, leftX, finalY + 21, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(kepsekNip, leftX, finalY + 28, { align: 'center' });

  // Right Sign: Guru BK
  const guruNama = meta?.guruBkNama || meta?.currentUser?.nama || '';
  const guruNip = meta?.guruBkNip
    ? `NIP. ${meta.guruBkNip}`
    : meta?.currentUser?.nip
    ? `NIP. ${meta.currentUser.nip}`
    : 'NIP. .........................................';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Guru Bimbingan & Konseling,', rightX, finalY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Guru BK', rightX, finalY + 5, { align: 'center' });
  doc.line(rightX - 25, finalY + 24, rightX + 25, finalY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (guruNama) {
    doc.text(guruNama, rightX, finalY + 21, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(guruNip, rightX, finalY + 28, { align: 'center' });
}

function addPageNumbers(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Media Bantu Guru • Layanan BK & Kedisiplinan Siswa • Halaman ${i} dari ${pageCount}`, pageWidth / 2, pageHeight - 6, {
      align: 'center',
    });
  }
}

/**
 * 1. Export Laporan Kasus & Pelanggaran Siswa ke PDF
 */
export function exportKasusToPDF(
  kasusList: Kasus[],
  siswaList: Siswa[],
  meta?: MetaPDF
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const title = 'Laporan Kasus & Pelanggaran Siswa';
  drawKopSurat(doc, title, meta);

  const totalPoin = kasusList.reduce((sum, k) => sum + (Number(k.poin) || 0), 0);

  const tableBody: RowInput[] = kasusList.map((k, idx) => {
    const s = siswaList.find((x) => x.id === k.siswaId);
    return [
      String(idx + 1),
      k.tanggal ? fmtDate(k.tanggal) : '-',
      s?.nis || '-',
      s?.nama || '(Siswa Tidak Diketahui)',
      s?.kelas || '-',
      (k.jenis || 'ringan').toUpperCase(),
      `${k.poin || 0} pt`,
      k.deskripsi || '-',
      k.tindakLanjut || '-',
      (k.status || 'baru').toUpperCase(),
    ];
  });

  const bodyData: RowInput[] = tableBody.length > 0 
    ? tableBody 
    : [[{ content: 'Tidak ada data catatan kasus & pelanggaran pada periode / filter ini.', colSpan: 10, styles: { halign: 'center' as const, fontStyle: 'italic' as const, textColor: [120, 120, 120], minCellHeight: 12 } }]];

  const footData: RowInput[] | undefined = tableBody.length > 0 ? [[
    { content: 'TOTAL KASUS & POIN', colSpan: 6, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: `${totalPoin} pt`, styles: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [180, 40, 40] } },
    { content: `${kasusList.length} Kasus Tercatat`, colSpan: 3, styles: { fontStyle: 'bold' as const } },
  ]] : undefined;

  autoTable(doc, {
    startY: 37,
    margin: { left: 12, right: 12 },
    head: [[
      'No',
      'Tanggal',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Tingkat',
      'Poin',
      'Uraian Kasus / Pelanggaran',
      'Tindak Lanjut / Sanksi',
      'Status',
    ]],
    body: bodyData,
    foot: footData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [33, 40, 36],
      lineColor: [190, 195, 190],
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [29, 65, 55], // #1D4137
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [240, 245, 240],
      textColor: [29, 65, 55],
      fontStyle: 'bold',
      lineColor: [190, 195, 190],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 },
      3: { cellWidth: 42, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      7: { cellWidth: 65 },
      8: { cellWidth: 52 },
      9: { halign: 'center', cellWidth: 20 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  drawSignatureSection(doc, finalY, meta);
  addPageNumbers(doc);

  const filename = `Laporan_Kasus_Pelanggaran_${meta?.kelas ? `Kelas_${meta.kelas}_` : ''}${todayISO()}.pdf`;
  doc.save(filename);
}

/**
 * 2. Export Laporan Keterlambatan Siswa ke PDF
 */
export function exportTerlambatToPDF(
  terlambatList: Terlambat[],
  siswaList: Siswa[],
  meta?: MetaPDF
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const title = 'Laporan Keterlambatan Masuk Siswa';
  drawKopSurat(doc, title, meta);

  const totalMenit = terlambatList.reduce((sum, t) => sum + (Number(t.menit) || 0), 0);

  const tableBody: RowInput[] = terlambatList.map((t, idx) => {
    const s = siswaList.find((x) => x.id === t.siswaId);
    return [
      String(idx + 1),
      t.tanggal ? fmtDate(t.tanggal) : '-',
      t.jam || '-',
      s?.nis || '-',
      s?.nama || '(Siswa Tidak Diketahui)',
      s?.kelas || '-',
      s?.jk || 'L',
      t.menit ? `${t.menit} mnt` : '-',
      t.keterangan || 'Terlambat masuk sekolah',
    ];
  });

  const bodyData: RowInput[] = tableBody.length > 0 
    ? tableBody 
    : [[{ content: 'Tidak ada data keterlambatan yang tercatat pada filter ini.', colSpan: 9, styles: { halign: 'center' as const, fontStyle: 'italic' as const, textColor: [120, 120, 120], minCellHeight: 12 } }]];

  const footData: RowInput[] | undefined = tableBody.length > 0 ? [[
    { content: 'TOTAL KETERLAMBATAN', colSpan: 7, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: `${totalMenit} mnt`, styles: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [190, 80, 20] } },
    { content: `${terlambatList.length} Kejadian`, styles: { fontStyle: 'bold' as const } },
  ]] : undefined;

  autoTable(doc, {
    startY: 37,
    margin: { left: 12, right: 12 },
    head: [[
      'No',
      'Tanggal',
      'Jam',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'JK',
      'Durasi',
      'Alasan / Keterangan',
    ]],
    body: bodyData,
    foot: footData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [33, 40, 36],
      lineColor: [190, 195, 190],
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [29, 65, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [240, 245, 240],
      textColor: [29, 65, 55],
      fontStyle: 'bold',
      lineColor: [190, 195, 190],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'center', cellWidth: 18 },
      4: { cellWidth: 42, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 10 },
      7: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      8: { cellWidth: 42 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  drawSignatureSection(doc, finalY, meta);
  addPageNumbers(doc);

  const filename = `Laporan_Keterlambatan_${meta?.kelas ? `Kelas_${meta.kelas}_` : ''}${todayISO()}.pdf`;
  doc.save(filename);
}

/**
 * 3. Export Laporan Siswa Pindah / Keluar / Berhenti ke PDF
 */
export function exportSiswaKeluarToPDF(
  siswaKeluarList: Siswa[],
  kasusList: Kasus[] = [],
  meta?: MetaPDF
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const title = 'Laporan Siswa Pindah / Keluar / Non-Aktif';
  drawKopSurat(doc, title, meta);

  const tableBody: RowInput[] = siswaKeluarList.map((s, idx) => {
    const kList = kasusList.filter((k) => k.siswaId === s.id);
    const totalPoin = kList.reduce((sum, k) => sum + (Number(k.poin) || 0), 0);

    let statusStr = 'Non-Aktif';
    if (s.status === 'berhenti') statusStr = 'Berhenti';
    else if (s.status === 'pindah') statusStr = 'Pindah';
    else if (s.status === 'keluar') statusStr = 'Keluar';

    return [
      String(idx + 1),
      s.nis || '-',
      s.nama,
      s.kelas || '-',
      s.jk === 'P' ? 'P' : 'L',
      statusStr.toUpperCase(),
      `${s.ortu || '-'}${s.hp ? ` (${s.hp})` : ''}`,
      s.catatan || '-',
      `${kList.length} kasus (${totalPoin} pt)`,
    ];
  });

  const bodyData: RowInput[] = tableBody.length > 0 
    ? tableBody 
    : [[{ content: 'Tidak ada data siswa pindah/keluar/berhenti yang tercatat.', colSpan: 9, styles: { halign: 'center' as const, fontStyle: 'italic' as const, textColor: [120, 120, 120], minCellHeight: 12 } }]];

  const footData: RowInput[] | undefined = tableBody.length > 0 ? [[
    { content: 'TOTAL SISWA NON-AKTIF', colSpan: 5, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: `${siswaKeluarList.length} Siswa`, colSpan: 4, styles: { fontStyle: 'bold' as const, textColor: [180, 40, 40] } },
  ]] : undefined;

  autoTable(doc, {
    startY: 37,
    margin: { left: 12, right: 12 },
    head: [[
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas Terakhir',
      'JK',
      'Status',
      'Nama Orang Tua / Kontak',
      'Alasan / Catatan Keluar',
      'Riwayat Kasus',
    ]],
    body: bodyData,
    foot: footData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [33, 40, 36],
      lineColor: [190, 195, 190],
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [29, 65, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [240, 245, 240],
      textColor: [29, 65, 55],
      fontStyle: 'bold',
      lineColor: [190, 195, 190],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 46, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 10 },
      5: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      6: { cellWidth: 48 },
      7: { cellWidth: 65 },
      8: { halign: 'center', cellWidth: 34 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  drawSignatureSection(doc, finalY, meta);
  addPageNumbers(doc);

  const filename = `Laporan_Siswa_Pindah_Keluar_${todayISO()}.pdf`;
  doc.save(filename);
}

/**
 * 4. Export Rekap Bulanan Siswa ke PDF
 */
export function exportRekapBulananToPDF(
  siswaList: Siswa[],
  kasusList: Kasus[],
  terlambatList: Terlambat[],
  meta?: MetaPDF
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const title = `Rekapitulasi Kedisiplinan & Bimbingan Konseling (${meta?.periode || 'Semua Periode'})`;
  drawKopSurat(doc, title, meta);

  const activeSiswa = siswaList.filter((s) => (s.status || 'aktif') === 'aktif');
  const tableBody: RowInput[] = activeSiswa.map((s, idx) => {
    const kList = kasusList.filter((k) => k.siswaId === s.id);
    const poin = kList.reduce((sum, k) => sum + (Number(k.poin) || 0), 0);
    const tCount = terlambatList.filter((t) => t.siswaId === s.id).length;

    return [
      String(idx + 1),
      s.nis || '-',
      s.nama,
      s.kelas || '-',
      s.jk || 'L',
      String(kList.length),
      `${poin} pt`,
      `${tCount}x`,
    ];
  });

  const bodyData: RowInput[] = tableBody.length > 0 
    ? tableBody 
    : [[{ content: 'Tidak ada data siswa aktif.', colSpan: 8, styles: { halign: 'center' as const, fontStyle: 'italic' as const, textColor: [120, 120, 120], minCellHeight: 12 } }]];

  autoTable(doc, {
    startY: 37,
    margin: { left: 12, right: 12 },
    head: [[
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'JK',
      'Total Kasus',
      'Poin Pelanggaran',
      'Terlambat',
    ]],
    body: bodyData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [33, 40, 36],
      lineColor: [190, 195, 190],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [29, 65, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22 },
      2: { cellWidth: 62, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
      7: { halign: 'center', cellWidth: 20 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  drawSignatureSection(doc, finalY, meta);
  addPageNumbers(doc);

  const filename = `Rekapitulasi_BK_${meta?.periode?.replace(/[\s/]/g, '_') || todayISO()}.pdf`;
  doc.save(filename);
}