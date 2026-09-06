import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save } from 'lucide-react';
import {
  Siswa,
  Kasus,
  Konseling,
  Jadwal,
  Terlambat,
  Absensi,
  KelasItem,
  PageKey,
  RouteState,
  StatusAbsensiType,
  UserAccount
} from './types';
import {
  loadInitialDatabase,
  setStoredData,
  uid,
  getStoredUsers,
  setStoredUsers,
  getStoredCurrentUser,
  setStoredCurrentUser,
  isDuplicateSiswa,
  isValidNis,
  todayISO,
} from './lib/storage';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast } from './components/Toast';
import { KalselBodyBackdrop } from './components/KalselBodyBackdrop';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { SiswaView } from './views/SiswaView';
import { SiswaKeluarView } from './views/SiswaKeluarView';
import { AbsensiView } from './views/AbsensiView';
import { KasusView } from './views/KasusView';
import { TerlambatView } from './views/TerlambatView';
import { KonselingView } from './views/KonselingView';
import { JadwalView } from './views/JadwalView';
import { CetakView } from './views/CetakView';
import { PrintPiketView } from './views/PrintPiketView';
import { LaporanView } from './views/LaporanView';
import { UsersView } from './views/UsersView';
import { BrandingView } from './views/BrandingView';
import { saveStoredBrandingConfig } from './lib/branding';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  pushToGoogleSheets,
  pullFromGoogleSheets,
  pushUsersOnlyToGoogleSheets
} from './lib/googleSheets';

export default function App() {
  const [db, setDb] = useState(() => loadInitialDatabase());
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getStoredCurrentUser());

  const [route, setRoute] = useState<RouteState>({
    page: 'dashboard',
    params: {},
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeaderCustomizerOpen, setIsHeaderCustomizerOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoSaveToast, setAutoSaveToast] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isFirstRender = useRef(true);
  const mainScrollRef = useRef<HTMLElement>(null);
  // true selama proses TARIK (pull) data dari Google Sheets sedang berjalan.
  // Dipakai agar hasil pull tidak langsung memicu auto-push balik ke Sheets.
  const isRestoring = useRef(false);

  // Auto-scroll area data ke paling atas setiap kali halaman berpindah
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [route.page, route.params]);

  // Dark Mode Theme State & Persistence
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('mbg_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('mbg_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('mbg_theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark((prev) => !prev);

  // On startup, check for Google Sheets config and pull latest data
  useEffect(() => {
    // Check if opened via shareable auto-connect link (from phone or other device)
    try {
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      let incomingUrl = search.get('sheetsUrl');
      let incomingToken = search.get('sheetsToken');

      if (!incomingUrl && hash && hash.includes('sync=')) {
        const raw = decodeURIComponent(hash.split('sync=')[1]);
        const parsed = JSON.parse(raw);
        if (parsed && parsed.url) {
          incomingUrl = parsed.url;
          incomingToken = parsed.token || '';
        }
      }

      if (incomingUrl) {
        saveGoogleSheetsConfig({
          appsScriptUrl: incomingUrl,
          apiToken: incomingToken || '',
          autoSync: true,
        });
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch (e) {
      console.warn('Gagal membaca parameter auto-sync URL:', e);
    }

    const gcfg = getGoogleSheetsConfig();
    if (gcfg.autoSync && gcfg.appsScriptUrl) {
      isRestoring.current = true;
      pullFromGoogleSheets(gcfg.appsScriptUrl, gcfg.apiToken)
        .then((res) => {
          if (res.success && res.data) {
            handleRestoreDatabase(res.data);
          } else {
            isRestoring.current = false;
          }
        })
        .catch((err) => {
          console.warn('Gagal memuat data awal dari Google Sheets:', err);
          isRestoring.current = false;
        });
    }
  }, []);

  // Auto-save effect: Whenever db state changes, save to localStorage and trigger syncs
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Jangan auto-push ke Google Sheets saat perubahan db ini berasal dari
    // hasil TARIK (pull) data dari Sheets itu sendiri
    if (isRestoring.current) {
      isRestoring.current = false;
      setStoredData('mbg_siswa', db.siswa);
      setStoredData('mbg_kasus', db.kasus);
      setStoredData('mbg_konseling', db.konseling);
      setStoredData('mbg_jadwal', db.jadwal);
      setStoredData('mbg_terlambat', db.terlambat);
      setStoredData('mbg_absensi', db.absensi);
      setStoredData('mbg_kelas', db.kelas);
      return;
    }

    // Selalu simpan ke localStorage secara instan & sinkron
    setStoredData('mbg_siswa', db.siswa);
    setStoredData('mbg_kasus', db.kasus);
    setStoredData('mbg_konseling', db.konseling);
    setStoredData('mbg_jadwal', db.jadwal);
    setStoredData('mbg_terlambat', db.terlambat);
    setStoredData('mbg_absensi', db.absensi);
    setStoredData('mbg_kelas', db.kelas);

    setAutoSaveToast(true);
    const toastTimer = setTimeout(() => {
      setAutoSaveToast(false);
    }, 2000);

    // AutoSync Google Sheets dengan Debounce (1200ms)
    // Mencegah benturan lock concurrency pada Google Apps Script saat pengguna mengedit cepat
    const gcfg = getGoogleSheetsConfig();
    let pushTimer: any = null;
    if (gcfg.autoSync && gcfg.appsScriptUrl) {
      pushTimer = setTimeout(() => {
        pushToGoogleSheets(db, gcfg.appsScriptUrl, users, gcfg.apiToken)
          .then((res) => {
            if (!res.success) {
              showToast(`Auto-sync gagal: ${res.message || 'periksa URL/token di Pengaturan Google Sheets'}`);
            }
          })
          .catch((err) => {
            console.error('Auto-sync Google Sheets error:', err);
            showToast('Auto-sync gagal: kesalahan jaringan saat menghubungi Google Sheets');
          });
      }, 1200);
    }

    return () => {
      clearTimeout(toastTimer);
      if (pushTimer) clearTimeout(pushTimer);
    };
  }, [db, users]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Restore entire DB handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRestoreDatabase = (newDb: Record<string, any>) => {
    isRestoring.current = true;
    const data = newDb.data || newDb.db || newDb;

    const unpack = (arr: any) => (Array.isArray(arr) && arr.length > 0 ? arr : null);

    const incomingSiswa = unpack(data.siswa);
    const incomingKasus = unpack(data.kasus);
    const incomingKonseling = unpack(data.konseling);
    const incomingJadwal = unpack(data.jadwal);
    const incomingTerlambat = unpack(data.terlambat);
    const incomingAbsensi = unpack(data.absensi);
    const incomingKelas = unpack(data.kelas);

    const normalizedSiswa = incomingSiswa
      ? incomingSiswa.map((s: any, idx: number) => ({
          ...s,
          id: s.id ? String(s.id).trim() : `sis_${idx + 1}_${(s.nis || s.nama || 'auto').toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`,
          nama: String(s.nama || `Siswa ${idx + 1}`).trim(),
          jk: String(s.jk || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
          status: s.status || 'aktif',
        }))
      : null;

    const safeDb = {
      siswa: normalizedSiswa !== null ? normalizedSiswa : db.siswa,
      kasus: incomingKasus !== null ? incomingKasus : db.kasus,
      konseling: incomingKonseling !== null ? incomingKonseling : db.konseling,
      jadwal: incomingJadwal !== null ? incomingJadwal : db.jadwal,
      terlambat: incomingTerlambat !== null ? incomingTerlambat : db.terlambat,
      absensi: incomingAbsensi !== null ? incomingAbsensi : db.absensi,
      kelas: incomingKelas !== null ? incomingKelas : db.kelas,
    };

    setDb(safeDb);
    setStoredData('mbg_siswa', safeDb.siswa);
    setStoredData('mbg_kasus', safeDb.kasus);
    setStoredData('mbg_konseling', safeDb.konseling);
    setStoredData('mbg_jadwal', safeDb.jadwal);
    setStoredData('mbg_terlambat', safeDb.terlambat);
    setStoredData('mbg_absensi', safeDb.absensi);
    setStoredData('mbg_kelas', safeDb.kelas);

    const incomingUsers = unpack(data.users);
    if (incomingUsers) {
      setUsers(incomingUsers);
      setStoredUsers(incomingUsers);
    }

    // Pulihkan pengaturan logo dan identitas sekolah jika diterima dari Google Sheets
    const incomingBranding = data.branding || newDb.branding;
    if (incomingBranding && typeof incomingBranding === 'object') {
      try {
        saveStoredBrandingConfig(incomingBranding);
      } catch (e) {
        console.warn('Gagal memulihkan branding dari Google Sheets:', e);
      }
    }
  };

  const handleManualPush = async () => {
    setIsSyncing(true);
    const gcfg = getGoogleSheetsConfig();
    const res = await pushToGoogleSheets(db, gcfg.appsScriptUrl, users, gcfg.apiToken);
    setIsSyncing(false);
    if (!res.success) {
      showToast(res.message || 'Gagal mengirim data ke Google Sheets');
    } else {
      showToast(res.message || 'Data berhasil dikirim ke Google Sheets!');
    }
    return res;
  };

  const handleManualPull = async () => {
    setIsSyncing(true);
    const gcfg = getGoogleSheetsConfig();
    const res = await pullFromGoogleSheets(gcfg.appsScriptUrl, gcfg.apiToken);
    setIsSyncing(false);
    if (res.success && res.data) {
      handleRestoreDatabase(res.data);
      showToast(res.message || 'Data berhasil diperbarui dari Google Sheets!');
    } else {
      showToast(res.message || 'Gagal mengunduh data dari Google Sheets');
    }
    return res;
  };

  // Sync helpers to localStorage
  const updateSiswa = (newSiswa: Siswa[]) => {
    setDb((prev) => ({ ...prev, siswa: newSiswa }));
    setStoredData('mbg_siswa', newSiswa);
  };

  const updateKasus = (newKasus: Kasus[]) => {
    setDb((prev) => ({ ...prev, kasus: newKasus }));
    setStoredData('mbg_kasus', newKasus);
  };

  const updateKonseling = (newKonseling: Konseling[]) => {
    setDb((prev) => ({ ...prev, konseling: newKonseling }));
    setStoredData('mbg_konseling', newKonseling);
  };

  const updateJadwal = (newJadwal: Jadwal[]) => {
    setDb((prev) => ({ ...prev, jadwal: newJadwal }));
    setStoredData('mbg_jadwal', newJadwal);
  };

  const updateTerlambat = (newTerlambat: Terlambat[]) => {
    setDb((prev) => ({ ...prev, terlambat: newTerlambat }));
    setStoredData('mbg_terlambat', newTerlambat);
  };

  const updateAbsensi = (newAbsensi: Absensi[]) => {
    setDb((prev) => ({ ...prev, absensi: newAbsensi }));
    setStoredData('mbg_absensi', newAbsensi);
  };

  const updateKelas = (newKelas: KelasItem[]) => {
    setDb((prev) => ({ ...prev, kelas: newKelas }));
    setStoredData('mbg_kelas', newKelas);
  };

  const navigate = (page: PageKey, params: any = {}) => {
    // Menu Pengaturan System (users, branding) hanya dapat diakses oleh Admin
    if ((page === 'users' || page === 'branding') && currentUser?.role !== 'admin') {
      showToast('Akses Dibatasi: Menu Pengaturan System hanya dapat diakses oleh Administrator');
      setRoute({ page: 'dashboard', params: {} });
      return;
    }
    setRoute({ page, params });
  };

  // Siswa handlers
  const handleSaveSiswa = (sData: Partial<Siswa>, isEdit = false) => {
    if (isEdit && sData.id) {
      const updated = db.siswa.map((item) => (item.id === sData.id ? { ...item, ...sData } as Siswa : item));
      updateSiswa(updated);
    } else {
      const newS: Siswa = {
        id: uid(),
        nama: sData.nama || '',
        nis: sData.nis || '',
        kelas: sData.kelas || '',
        jk: sData.jk || 'L',
        alamat: sData.alamat || '',
        ortu: sData.ortu || '',
        hp: sData.hp || '',
        catatan: sData.catatan || '',
        asuh: sData.asuh || false,
        status: sData.status || 'aktif',
      };
      updateSiswa([...db.siswa, newS]);
    }
  };

  const handleDeleteSiswa = (id: string) => {
    updateSiswa(db.siswa.filter((s) => s.id !== id));
  };

  const handleBulkDeleteSiswa = (ids: string[]) => {
    updateSiswa(db.siswa.filter((s) => !ids.includes(s.id)));
  };

  const handleDeleteAllSiswa = () => {
    updateSiswa([]);
  };

  const handleRestoreSiswa = (id: string) => {
    updateSiswa(
      db.siswa.map((s) => (s.id === id ? { ...s, status: 'aktif' } : s))
    );
  };

  const handleToggleAsuh = (id: string) => {
    const target = db.siswa.find((s) => s.id === id);
    if (!target) return;
    const isNowAsuh = !target.asuh;
    updateSiswa(
      db.siswa.map((s) => (s.id === id ? { ...s, asuh: isNowAsuh } : s))
    );
    showToast(isNowAsuh ? `Siswa ${target.nama} ditandai Siswa Asuh` : `Tanda Siswa Asuh ${target.nama} dihapus`);
  };

  const handleAddKelas = async (nama: string): Promise<boolean> => {
    const exists = db.kelas.some((k) => k.nama.toLowerCase() === nama.toLowerCase());
    if (exists) return false;
    const newK: KelasItem = { id: uid(), nama };
    updateKelas([...db.kelas, newK]);
    return true;
  };

  const handleDeleteKelas = (id: string) => {
    updateKelas(db.kelas.filter((k) => k.id !== id));
  };

  const handleImportSiswa = (importedList: Partial<Siswa>[]) => {
    const existing = db.siswa;
    const newSiswaItems: Siswa[] = [];
    const newClassesFound: string[] = [];

    importedList.forEach((item) => {
      const nama = (item.nama || '').trim();
      if (!nama) return;

      const isDupInDb = existing.some((s) => isDuplicateSiswa(item, s).isDuplicate);
      const isDupInBatch = newSiswaItems.some((s) => isDuplicateSiswa(item, s).isDuplicate);

      if (!isDupInDb && !isDupInBatch) {
        const itemKelas = (item.kelas || '').trim();
        if (itemKelas && !db.kelas.some((k) => k.nama.toLowerCase() === itemKelas.toLowerCase()) && !newClassesFound.includes(itemKelas)) {
          newClassesFound.push(itemKelas);
        }

        newSiswaItems.push({
          id: uid(),
          nama,
          nis: isValidNis(item.nis) ? String(item.nis).trim() : '',
          kelas: itemKelas,
          jk: item.jk === 'P' ? 'P' : 'L',
          alamat: item.alamat || '',
          ortu: item.ortu || '',
          hp: item.hp || '',
          catatan: item.catatan || '',
          asuh: false,
          status: 'aktif',
        });
      }
    });

    if (newClassesFound.length > 0) {
      const addedClasses: KelasItem[] = newClassesFound.map((kName) => ({
        id: uid(),
        nama: kName,
      }));
      updateKelas([...db.kelas, ...addedClasses]);
    }

    if (newSiswaItems.length > 0) {
      updateSiswa([...db.siswa, ...newSiswaItems]);
    }
  };

  // Kasus Handlers
  const handleSaveKasus = (kData: Partial<Kasus>, isEdit = false) => {
    if (isEdit && kData.id) {
      updateKasus(
        db.kasus.map((item) => (item.id === kData.id ? ({ ...item, ...kData } as Kasus) : item))
      );
    } else {
      const newK: Kasus = {
        id: uid(),
        siswaId: kData.siswaId || '',
        tanggal: kData.tanggal || todayISO(),
        jenis: kData.jenis || 'ringan',
        poin: kData.poin || 10,
        deskripsi: kData.deskripsi || '',
        tindakLanjut: kData.tindakLanjut || '',
        status: kData.status || 'baru',
      };
      updateKasus([...db.kasus, newK]);
    }
  };

  const handleDeleteKasus = (id: string) => {
    updateKasus(db.kasus.filter((k) => k.id !== id));
  };

  // Konseling Handlers
  const handleSaveKonseling = (cData: Partial<Konseling>, isEdit = false) => {
    if (isEdit && cData.id) {
      updateKonseling(
        db.konseling.map((item) => (item.id === cData.id ? ({ ...item, ...cData } as Konseling) : item))
      );
    } else {
      const newC: Konseling = {
        id: uid(),
        siswaId: cData.siswaId || '',
        siswaNama: cData.siswaNama || '',
        tanggal: cData.tanggal || todayISO(),
        jam: cData.jam || '',
        jenis: cData.jenis || 'individu',
        topik: cData.topik || '',
        catatan: cData.catatan || '',
        tindakLanjut: cData.tindakLanjut || '',
      };
      updateKonseling([...db.konseling, newC]);
    }
  };

  const handleDeleteKonseling = (id: string) => {
    updateKonseling(db.konseling.filter((c) => c.id !== id));
  };

  // Terlambat Handlers
  const handleSaveTerlambat = (tData: Partial<Terlambat>, isEdit = false) => {
    if (isEdit && tData.id) {
      updateTerlambat(
        db.terlambat.map((item) => (item.id === tData.id ? ({ ...item, ...tData } as Terlambat) : item))
      );
    } else {
      const newT: Terlambat = {
        id: uid(),
        siswaId: tData.siswaId || '',
        tanggal: tData.tanggal || todayISO(),
        jam: tData.jam || '',
        menit: tData.menit || '',
        keterangan: tData.keterangan || '',
      };
      updateTerlambat([...db.terlambat, newT]);
    }
  };

  const handleDeleteTerlambat = (id: string) => {
    updateTerlambat(db.terlambat.filter((t) => t.id !== id));
  };

  // Jadwal Handlers
  const handleSaveJadwal = (jData: Partial<Jadwal>, isEdit = false) => {
    if (isEdit && jData.id) {
      updateJadwal(
        db.jadwal.map((item) => (item.id === jData.id ? ({ ...item, ...jData } as Jadwal) : item))
      );
    } else {
      const newJ: Jadwal = {
        id: uid(),
        tanggal: jData.tanggal || todayISO(),
        jam: jData.jam || '',
        kegiatan: jData.kegiatan || '',
        sasaran: jData.sasaran || '',
        tempat: jData.tempat || '',
        catatan: jData.catatan || '',
        selesai: false,
      };
      updateJadwal([...db.jadwal, newJ]);
    }
  };

  const handleDeleteJadwal = (id: string) => {
    updateJadwal(db.jadwal.filter((j) => j.id !== id));
  };

  const handleToggleJadwalStatus = (id: string) => {
    updateJadwal(
      db.jadwal.map((j) => (j.id === id ? { ...j, selesai: !j.selesai } : j))
    );
  };

  // Absensi Handler
  const handleSaveAbsensiRecords = (
    records: { siswaId: string; tanggal: string; status: StatusAbsensiType; keterangan?: string }[]
  ) => {
    let currentAbs = [...db.absensi];

    records.forEach((r) => {
      const idx = currentAbs.findIndex((a) => a.siswaId === r.siswaId && a.tanggal === r.tanggal);
      if (idx >= 0) {
        currentAbs[idx] = { ...currentAbs[idx], status: r.status, keterangan: r.keterangan || '' };
      } else {
        currentAbs.push({
          id: uid(),
          siswaId: r.siswaId,
          tanggal: r.tanggal,
          status: r.status,
          keterangan: r.keterangan || '',
        });
      }
    });

    updateAbsensi(currentAbs);
  };

  // Auth & User Management Handlers
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setStoredCurrentUser(user);
    setRoute({ page: 'dashboard', params: {} });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStoredCurrentUser(null);
    showToast('Anda telah keluar (logout) dari sistem');
  };

  const updateUsers = (updated: UserAccount[]) => {
    setUsers(updated);
    setStoredUsers(updated);
    const gcfg = getGoogleSheetsConfig();
    if (gcfg.autoSync && gcfg.appsScriptUrl) {
      // KINI MENGGUNAKAN JALUR KHUSUS PENGGUNA (Tidak membawa data Siswa)
      pushUsersOnlyToGoogleSheets(updated, gcfg.appsScriptUrl, gcfg.apiToken).catch((err) =>
        console.error('Auto-sync users to Google Sheets error:', err)
      );
    }
  };

  const handleRegisterUser = (newUser: UserAccount) => {
    const updated = [...users, newUser];
    updateUsers(updated);
  };

  const handleAddUser = (user: UserAccount) => {
    const updated = [...users, user];
    updateUsers(updated);
  };

  const handleUpdateUser = (user: UserAccount) => {
    const updated = users.map((u) => (u.id === user.id ? user : u));
    updateUsers(updated);

    // If current logged-in user edited their own profile, update state
    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
      setStoredCurrentUser(user);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    updateUsers(updated);
  };

  const activeSiswaAsuhCount = db.siswa.filter(
    (s) => (s.status || 'aktif') === 'aktif' && s.asuh
  ).length;

  // Unauthenticated user -> render Login & Registration Screen
  if (!currentUser) {
    return (
      <>
        <Toast message={toastMessage} />
        <LoginView
          users={users}
          onLogin={handleLogin}
          onRegisterUser={handleRegisterUser}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1613] flex flex-col md:flex-row font-sans text-[#1E293B] dark:text-gray-100 antialiased relative selection:bg-amber-400/30 selection:text-emerald-950 overflow-hidden">
      {/* Latar Belakang Khas Kalimantan Selatan (Pasar Terapung, Rumah Banjar, Sasirangan) */}
      <KalselBodyBackdrop isDark={isDark} />

      {/* Aksen Pita Tradisional Khas Kalimantan Selatan (Sasirangan Gigi Haruan & Martapura Gold) */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D4137] via-[#C9862E] via-50% to-[#2D5F52] z-50 pointer-events-none shadow-xs"
        title="Aksen Khas Kalimantan Selatan - Sasirangan"
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Auto-Save Notification in Corner */}
      <AnimatePresence>
        {autoSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1D4137] text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-600/40 text-xs font-semibold"
          >
            <Save className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Perubahan tersimpan</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation: Tetap di samping */}
      <Sidebar
        activePage={route.page}
        onNavigate={(p) => navigate(p)}
        siswaAsuhCount={activeSiswaAsuhCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenHeaderCustomizer={() => {
          if (currentUser?.role === 'admin') {
            setIsHeaderCustomizerOpen(true);
          } else {
            showToast('Akses Dibatasi: Hanya Administrator yang dapat mengubah kustomisasi header');
          }
        }}
        onOpenSheetsModal={() => {
          if (currentUser?.role === 'admin') {
            setIsSheetsModalOpen(true);
          } else {
            showToast('Akses Dibatasi: Hanya Administrator yang dapat mengubah konfigurasi Google Sheets');
          }
        }}
      />

      {/* Main Column (Header tetap di posisi atas, hanya data yang bergerak/scroll) */}
      <div className="flex-1 min-w-0 h-full max-h-full flex flex-col overflow-hidden relative z-10">
        {/* Header (Topbar): Tetap pada posisinya (shrink-0) */}
        <div className="shrink-0 z-30">
          <Topbar
            page={route.page}
            onOpenSidebar={() => setIsSidebarOpen((prev) => !prev)}
            siswaList={db.siswa}
            onNavigate={navigate}
            isDark={isDark}
            onToggleDark={toggleDark}
            onSyncPush={handleManualPush}
            onSyncPull={handleManualPull}
            isSyncing={isSyncing}
            showToast={showToast}
            currentUser={currentUser}
            isCustomizerOpen={isHeaderCustomizerOpen}
            onOpenCustomizer={() => {
              if (currentUser?.role === 'admin') {
                setIsHeaderCustomizerOpen(true);
              } else {
                showToast('Akses Dibatasi: Hanya Administrator yang dapat mengubah kustomisasi header');
              }
            }}
            onCloseCustomizer={() => setIsHeaderCustomizerOpen(false)}
            isSheetsModalOpen={isSheetsModalOpen}
            onOpenSheetsModal={() => {
              if (currentUser?.role === 'admin') {
                setIsSheetsModalOpen(true);
              } else {
                showToast('Akses Dibatasi: Hanya Administrator yang dapat mengubah konfigurasi Google Sheets');
              }
            }}
            onCloseSheetsModal={() => setIsSheetsModalOpen(false)}
          />
        </div>

        {/* Data Container: Yang bergerak hanya data yg ditampilkan (flex-1 overflow-y-auto) */}
        <main
          ref={mainScrollRef}
          id="main-content-scroll"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col"
        >
          <div className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {/* Crisp Page Transitions without subpixel blur or scaling */}
            <AnimatePresence mode="wait">
              <motion.div
                key={route.page + (route.params.id || '') + (route.params.asuh || '')}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
              {route.page === 'dashboard' && (
                <DashboardView
                  siswaList={db.siswa}
                  kasusList={db.kasus}
                  konselingList={db.konseling}
                  jadwalList={db.jadwal}
                  terlambatList={db.terlambat}
                  absensiList={db.absensi}
                  onNavigate={navigate}
                />
              )}

              {route.page === 'users' && currentUser?.role === 'admin' && (
                <UsersView
                  currentUser={currentUser}
                  users={users}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onNavigate={navigate}
                  showToast={showToast}
                  onOpenHeaderCustomizer={() => setIsHeaderCustomizerOpen(true)}
                />
              )}

              {route.page === 'branding' && currentUser?.role === 'admin' && (
                <BrandingView
                  currentUser={currentUser}
                  onNavigate={navigate}
                  showToast={showToast}
                  onSyncPush={handleManualPush}
                />
              )}

              {route.page === 'siswa' && (
                <SiswaView
                  siswaList={db.siswa}
                  kelasList={db.kelas}
                  kasusList={db.kasus}
                  konselingList={db.konseling}
                  terlambatList={db.terlambat}
                  selectedSiswaId={route.params.id}
                  selectedTab={route.params.tab}
                  filterAsuhOnly={route.params.asuh === '1'}
                  onSelectSiswa={(id, tab) => navigate('siswa', { id, tab })}
                  onSaveSiswa={handleSaveSiswa}
                  onDeleteSiswa={handleDeleteSiswa}
                  onBulkDeleteSiswa={handleBulkDeleteSiswa}
                  onDeleteAllSiswa={handleDeleteAllSiswa}
                  onToggleAsuh={handleToggleAsuh}
                  onAddKelas={handleAddKelas}
                  onDeleteKelas={handleDeleteKelas}
                  onImportSiswa={handleImportSiswa}
                  onQuickAction={(type, sid) => {
                    if (type === 'kasus') navigate('kasus', { id: sid });
                    else if (type === 'konseling') navigate('konseling', { id: sid });
                    else if (type === 'terlambat') navigate('terlambat', { id: sid });
                    else if (type === 'absensi') navigate('absensi', { id: sid });
                  }}
                  onPrintPresensi={(kelasName) => navigate('print_piket', { kelas: kelasName })}
                  onDeleteKasus={handleDeleteKasus}
                  onDeleteKonseling={handleDeleteKonseling}
                  onDeleteTerlambat={handleDeleteTerlambat}
                  showToast={showToast}
                />
              )}

              {route.page === 'siswa_keluar' && (
                <SiswaKeluarView
                  siswaList={db.siswa}
                  kelasList={db.kelas}
                  onRestoreSiswa={handleRestoreSiswa}
                  onDeleteSiswaPermanent={handleDeleteSiswa}
                  showToast={showToast}
                />
              )}

              {route.page === 'absensi' && (
                <AbsensiView
                  siswaList={db.siswa}
                  kelasList={db.kelas}
                  absensiList={db.absensi}
                  onSaveAbsensi={handleSaveAbsensiRecords}
                  showToast={showToast}
                />
              )}

              {route.page === 'kasus' && (
                <KasusView
                  siswaList={db.siswa}
                  kasusList={db.kasus}
                  presetSiswaId={route.params.id || route.params.siswaId}
                  onSaveKasus={handleSaveKasus}
                  onDeleteKasus={handleDeleteKasus}
                  showToast={showToast}
                />
              )}

              {route.page === 'terlambat' && (
                <TerlambatView
                  siswaList={db.siswa}
                  kelasList={db.kelas}
                  terlambatList={db.terlambat}
                  presetSiswaId={route.params.id || route.params.siswaId}
                  onSaveTerlambat={handleSaveTerlambat}
                  onDeleteTerlambat={handleDeleteTerlambat}
                  showToast={showToast}
                />
              )}

              {route.page === 'konseling' && (
                <KonselingView
                  siswaList={db.siswa}
                  konselingList={db.konseling}
                  presetSiswaId={route.params.id || route.params.siswaId}
                  onSaveKonseling={handleSaveKonseling}
                  onDeleteKonseling={handleDeleteKonseling}
                  showToast={showToast}
                />
              )}

              {route.page === 'jadwal' && (
                <JadwalView
                  jadwalList={db.jadwal}
                  onSaveJadwal={handleSaveJadwal}
                  onDeleteJadwal={handleDeleteJadwal}
                  onToggleStatus={handleToggleJadwalStatus}
                  showToast={showToast}
                />
              )}

              {(route.page === 'print_piket' || route.page === 'laporan') && (
                <CetakView
                  siswaList={db.siswa}
                  kasusList={db.kasus}
                  konselingList={db.konseling}
                  terlambatList={db.terlambat}
                  absensiList={db.absensi}
                  kelasList={db.kelas}
                  currentUser={currentUser}
                  defaultSubmenu={route.page === 'laporan' ? 'rekap' : ((route.params?.tab as any) || 'rekap')}
                  initialParams={route.params}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Aplikasi (Berada di dasar scroll data) */}
        <footer className="py-4 px-6 border-t border-[#D9E0D4] dark:border-[#203830] text-center text-xs text-[#647169] dark:text-[#8AA399] print:hidden mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="font-semibold text-[#1D4137] dark:text-emerald-400">Media Bantu Guru</span>
              <span>&bull;</span>
              <span>BK &amp; Kedisiplinan Siswa</span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Hak Cipta Terlindungi
            </div>
          </div>
        </footer>
      </main>
    </div>
  </div>
);
}