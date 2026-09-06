import { getStoredBrandingConfig } from './branding';

export interface GoogleSheetsConfig {
  appsScriptUrl: string;
  autoSync: boolean;
  apiToken: string;
}

const STORAGE_KEYS = {
  url: 'mbg_gsheets_url',
  autoSync: 'mbg_gsheets_autosync',
  token: 'mbg_gsheets_token',
};

/**
 * Generates a direct URL that other devices (smartphones, other laptops)
 * can open to automatically connect to this Google Sheets database.
 */
export function getShareableSyncUrl(appsScriptUrl: string, apiToken?: string): string {
  const base = window.location.origin + window.location.pathname;
  const configObj = { url: appsScriptUrl.trim(), token: (apiToken || '').trim() };
  return `${base}#sync=${encodeURIComponent(JSON.stringify(configObj))}`;
}

// URL & Token Google Apps Script baku (Cloud Database bersama untuk semua perangkat & pengguna)
export const DEFAULT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbyESqpBq5qMifRZMNx_Y3UZZ0db4wAIoInWjNM1OiJf4cspKf-EKCzNe4fE8tShJx4A/exec';

export const DEFAULT_API_TOKEN =
  '252f8bd8-01b0-41f1-a4ce-3f7931888474-a89ffcfb-dd00-4f8e-bd5e-10bc1e8c0dff';

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const storedAutoSync = localStorage.getItem(STORAGE_KEYS.autoSync);
  let storedUrl = (localStorage.getItem(STORAGE_KEYS.url) || '').trim();
  const storedToken = (localStorage.getItem(STORAGE_KEYS.token) || '').trim();

  // Bersihkan nilai mock /api/sheets-proxy peninggalan versi lama
  if (storedUrl === '/api/sheets-proxy') {
    storedUrl = '';
    localStorage.removeItem(STORAGE_KEYS.url);
  }

  // Gunakan URL & Token baku default jika belum disetel di perangkat saat ini
  const activeUrl = storedUrl || DEFAULT_WEB_APP_URL;
  const activeToken = storedToken || DEFAULT_API_TOKEN;

  return {
    appsScriptUrl: activeUrl,
    autoSync: storedAutoSync === null ? true : storedAutoSync === 'true',
    apiToken: activeToken,
  };
}

export function isGoogleSheetsConfigured(config?: GoogleSheetsConfig): boolean {
  const cfg = config || getGoogleSheetsConfig();
  const url = (cfg.appsScriptUrl || '').trim();
  return Boolean(url && url !== '/api/sheets-proxy' && !url.includes('docs.google.com/spreadsheets'));
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig) {
  let trimmedUrl = config.appsScriptUrl.trim();
  if (trimmedUrl === '/api/sheets-proxy') {
    trimmedUrl = '';
  }
  if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    trimmedUrl = 'https://' + trimmedUrl;
  }
  localStorage.setItem(STORAGE_KEYS.url, trimmedUrl);
  localStorage.setItem(STORAGE_KEYS.autoSync, config.autoSync ? 'true' : 'false');
  localStorage.setItem(STORAGE_KEYS.token, (config.apiToken || '').trim());
}

export async function testGoogleSheetsConnection(
  url: string,
  apiToken?: string
): Promise<{ success: boolean; message: string }> {
  const trimmed = (url || '').trim();
  if (!trimmed || trimmed === '/api/sheets-proxy') {
    return {
      success: false,
      message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.',
    };
  }

  if (trimmed.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      message:
        'URL yang Anda masukkan adalah link Google Spreadsheet, bukan link Web App Apps Script. Buka menu Extensions > Apps Script pada Spreadsheet, lalu klik Deploy > New Deployment > Web App, dan salin URL yang berakhiran /exec.',
    };
  }

  let formattedUrl = trimmed;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    const res = await fetch(formattedUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'test', token: apiToken || '' }),
    });

    const rawText = await res.text();

    // Deteksi jika Google me-redirect ke login HTML (karena izin deployment belum 'Anyone')
    if (
      rawText.trim().startsWith('<') ||
      rawText.includes('<!DOCTYPE') ||
      rawText.includes('accounts.google.com') ||
      rawText.includes('google-site-verification')
    ) {
      return {
        success: false,
        message:
          'Apps Script mengembalikan halaman HTML Google (butuh login). Mohon pastikan saat "Deploy" Web App:\n1. "Execute as" diatur ke "Me"\n2. "Who has access" diatur ke "Anyone" (Siapa saja, termasuk anonim)\n3. URL harus berakhiran /exec.',
      };
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        message: `Respon dari server tidak berformat JSON yang valid: ${rawText.slice(0, 100)}...`,
      };
    }

    if (data && (data.success || data.status === 'success')) {
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Apps Script & Google Sheets Berhasil!',
      };
    }

    return {
      success: false,
      message: data.message || 'Gagal memverifikasi respon dari Google Apps Script.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return {
        success: false,
        message:
          'Gagal terhubung (Network/CORS Error). Pastikan:\n1. URL berakhiran /exec\n2. "Who has access" pada deployment diset ke "Anyone" (Siapa saja)\n3. Koneksi internet aktif.',
      };
    }
    return {
      success: false,
      message: `Gagal koneksi ke Google Apps Script: ${msg}`,
    };
  }
}

export async function pushToGoogleSheets(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbData: Record<string, any>,
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usersData?: any[],
  apiToken?: string
): Promise<{ success: boolean; message: string }> {
  const trimmed = (url || '').trim();
  if (!trimmed || trimmed === '/api/sheets-proxy') {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi di Pengaturan Google Sheets.',
    };
  }

  if (trimmed.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      message: 'URL yang dimasukkan adalah link Spreadsheet, bukan Web App Apps Script (/exec).',
    };
  }

  let formattedUrl = trimmed;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const payloadDb = { ...dbData };
  if (usersData && Array.isArray(usersData)) {
    payloadDb.users = usersData;
  }
  // Automatically include school and app branding configuration
  if (!payloadDb.branding) {
    try {
      payloadDb.branding = getStoredBrandingConfig();
    } catch (e) {
      console.warn('Could not attach branding to payload:', e);
    }
  }

  try {
    const res = await fetch(formattedUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'push', db: payloadDb, data: payloadDb, token: apiToken || '' }),
    });

    const rawText = await res.text();

    if (
      rawText.trim().startsWith('<') ||
      rawText.includes('<!DOCTYPE') ||
      rawText.includes('accounts.google.com')
    ) {
      return {
        success: false,
        message:
          'Gagal mengirim: Google meminta login. Pastikan setelan "Who has access" di Web App adalah "Anyone" (Siapa saja).',
      };
    }

    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        message: `HTTP ${res.status}: Respon server bukan format JSON valid.`,
      };
    }

    if (result && (result.success || result.status === 'success')) {
      return {
        success: true,
        message: result.message || 'Data berhasil disimpan ke Google Sheets!',
      };
    }

    return {
      success: false,
      message: result.message || 'Gagal menyimpan data ke Google Sheets.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return {
        success: false,
        message: 'Gagal terhubung ke Google Apps Script. Pastikan akses Web App adalah "Anyone" dan URL /exec valid.',
      };
    }
    return { success: false, message: `Gagal koneksi: ${msg}` };
  }
}

export async function pullFromGoogleSheets(
  url: string,
  apiToken?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; message: string; data?: Record<string, any> }> {
  const trimmed = (url || '').trim();
  if (!trimmed || trimmed === '/api/sheets-proxy') {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi di Pengaturan Google Sheets.',
    };
  }

  if (trimmed.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      message: 'URL yang dimasukkan adalah link Spreadsheet, bukan Web App Apps Script (/exec).',
    };
  }

  let formattedUrl = trimmed;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractDbFromResponse = (result: any): Record<string, any> | null => {
    if (!result || typeof result !== 'object') return null;
    // Format 1: result.data
    if (result.data && typeof result.data === 'object') return result.data;
    // Format 2: result.db
    if (result.db && typeof result.db === 'object') return result.db;
    // Format 3: result.payload
    if (result.payload && typeof result.payload === 'object') return result.payload;
    // Format 4: data langsung di root level (versi lama)
    if (Array.isArray(result.siswa) || Array.isArray(result.kasus) || Array.isArray(result.kelas)) {
      return result;
    }
    return null;
  };

  try {
    // 1. Coba request pertama via POST
    const postRes = await fetch(formattedUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'pull', token: apiToken || '' }),
    });

    const rawPostText = await postRes.text();

    if (
      !rawPostText.trim().startsWith('<') &&
      !rawPostText.includes('<!DOCTYPE') &&
      !rawPostText.includes('accounts.google.com')
    ) {
      try {
        const postJson = JSON.parse(rawPostText);
        const data = extractDbFromResponse(postJson);
        if (postJson && (postJson.success || postJson.status === 'success') && data) {
          const countSiswa = Array.isArray(data.siswa) ? data.siswa.length : 0;
          const countKasus = Array.isArray(data.kasus) ? data.kasus.length : 0;
          return {
            success: true,
            message: `Berhasil sinkronisasi! Ditemukan ${countSiswa} data siswa & ${countKasus} catatan kasus dari Google Sheets.`,
            data: data,
          };
        }
      } catch {
        // Lanjutkan ke fallback GET jika parsing JSON gagal
      }
    }

    // 2. Fallback via GET (beberapa deployment Apps Script lama atau proxy CORS lebih stabil dengan GET)
    const getUrl = `${formattedUrl}${formattedUrl.includes('?') ? '&' : '?'}action=pull&token=${encodeURIComponent(apiToken || '')}&_t=${Date.now()}`;
    const getRes = await fetch(getUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    const rawGetText = await getRes.text();
    if (
      rawGetText.trim().startsWith('<') ||
      rawGetText.includes('<!DOCTYPE') ||
      rawGetText.includes('accounts.google.com')
    ) {
      return {
        success: false,
        message:
          'Gagal mengunduh: Google meminta login. Pastikan setelan "Who has access" di Web App adalah "Anyone" (Siapa saja).',
      };
    }

    let getJson: any;
    try {
      getJson = JSON.parse(rawGetText);
    } catch {
      return {
        success: false,
        message: `Respon server bukan format JSON valid. Pastikan skrip Code.gs di Spreadsheet sudah dideploy sebagai New Version.`,
      };
    }

    const data = extractDbFromResponse(getJson);
    if (getJson && (getJson.success || getJson.status === 'success') && data) {
      const countSiswa = Array.isArray(data.siswa) ? data.siswa.length : 0;
      const countKasus = Array.isArray(data.kasus) ? data.kasus.length : 0;
      return {
        success: true,
        message: `Berhasil sinkronisasi! Ditemukan ${countSiswa} data siswa & ${countKasus} catatan kasus dari Google Sheets.`,
        data: data,
      };
    }

    return {
      success: false,
      message: getJson?.message || 'Tidak ada data yang dapat dibaca dari Google Sheets.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return {
        success: false,
        message: 'Gagal terhubung ke Google Apps Script. Pastikan akses Web App adalah "Anyone" dan URL /exec valid.',
      };
    }
    return { success: false, message: `Gagal koneksi: ${msg}` };
  }
}

export const GOOGLE_APPS_SCRIPT_CODE = `// =========================================================================
// GOOGLE APPS SCRIPT - BACKEND SYSTEM "MEDIA BANTU GURU" (SISTEM KESISWAAN)
// VERSI DIPERBAIKI: token auth, validasi payload, anti formula-injection
// =========================================================================

// -------------------------------------------------------------------------
// KONFIGURASI TOKEN
// -------------------------------------------------------------------------
// JANGAN hardcode token di sini. Simpan lewat menu:
// Project Settings (ikon gerigi) -> Script Properties -> Add property
//   key   : API_TOKEN
//   value : (string acak yang panjang, misal hasil generate di bawah)
//
// Untuk generate token acak, jalankan sekali fungsi generateRandomToken()
// dari editor Apps Script (klik Run), lalu lihat hasilnya di Logger (Ctrl+Enter).
function generateRandomToken() {
  var token = Utilities.getUuid() + '-' + Utilities.getUuid();
  Logger.log(token);
  return token;
}

function getApiToken_() {
  return PropertiesService.getScriptProperties().getProperty('API_TOKEN');
}

// -------------------------------------------------------------------------
// ENTRY POINTS
// -------------------------------------------------------------------------
function doGet(e) {
  try {
    var configuredToken = getApiToken_();
    var suppliedToken = e && e.parameter ? e.parameter.token : null;

    if (configuredToken && suppliedToken !== configuredToken) {
      return jsonResponse({ status: 'error', message: 'Unauthorized: token tidak valid' }, 401);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = pullDataFromSheets(ss);

    return jsonResponse({
      status: 'success',
      message: 'Data berhasil diambil',
      data: data,
      db: data,
      siswa: data.siswa,
      kasus: data.kasus,
      konseling: data.konseling,
      jadwal: data.jadwal,
      terlambat: data.terlambat,
      absensi: data.absensi,
      kelas: data.kelas,
      users: data.users,
      branding: data.branding,
      timestamp: new Date().getTime()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Gagal mengambil data: ' + err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'Payload data kosong atau format tidak valid' });
    }

    var contents = e.postData.contents;
    var parsed;
    try {
      parsed = JSON.parse(contents);
    } catch (parseErr) {
      return jsonResponse({ status: 'error', message: 'Payload bukan JSON valid: ' + parseErr.toString() });
    }

    // ---------------------------------------------------------------
    // AUTH CHECK (dicek SEBELUM ambil lock / sentuh data apa pun)
    // ---------------------------------------------------------------
    var configuredToken = getApiToken_();
    if (configuredToken && parsed.token !== configuredToken) {
      return jsonResponse({ status: 'error', message: 'Unauthorized: token tidak valid' }, 401);
    }

    var action = parsed.action || parsed.command || parsed.type;
    var db = parsed.db || parsed.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Ambil lock BARU setelah auth lolos, agar request tak berizin tidak ikut antre
    lock.waitLock(10000);
    lockAcquired = true;

    // =======================================================
    // 0. JALUR PING / TEST KONEKSI
    // =======================================================
    if (action === 'test' || action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'Koneksi ke Google Apps Script & Google Sheets Berhasil!'
      });
    }

    // =======================================================
    // 1. JALUR KHUSUS PENGGUNA (UPDATE USERS)
    // =======================================================
    if (action === 'push_users') {
      var usersData = parsed.data || parsed.db;

      if (!Array.isArray(usersData) || usersData.length === 0) {
        return jsonResponse({
          status: 'error',
          message: 'Ditolak: data pengguna kosong/tidak valid, sheet Pengguna TIDAK diubah untuk mencegah kehilangan data.'
        });
      }

      var shU = getOrCreateSheet(ss, 'Pengguna');
      var rows = [['ID', 'Username', 'Password', 'Nama', 'Role', 'Status', 'NIP', 'Tanggal Dibuat']];

      usersData.forEach(function (u) {
        rows.push([
          sanitizeCell_(u.id || ''),
          sanitizeCell_(u.username || ''),
          sanitizeCell_(u.password || ''),
          sanitizeCell_(u.nama || ''),
          sanitizeCell_(u.role || 'guru'),
          sanitizeCell_(u.status || 'aktif'),
          sanitizeCell_(u.nip || ''),
          u.createdAt || ''
        ]);
      });

      shU.clearContents();
      var rangeU = shU.getRange(1, 1, rows.length, rows[0].length);
      rangeU.setNumberFormat('@'); // paksa format teks -> cegah formula injection
      rangeU.setValues(rows);

      SpreadsheetApp.flush();
      logNotification(ss, 'SUCCESS', 'Data pengguna berhasil diperbarui (' + usersData.length + ' user)');

      return jsonResponse({ status: 'success', message: 'Data pengguna berhasil diperbarui' });
    }

    // =======================================================
    // 2. JALUR TARIK DATA (PULL / GET / READ / SYNC)
    // =======================================================
    if (action === 'pull' || action === 'get' || action === 'read' || action === 'fetch' || action === 'sync' || action === 'download') {
      var dataPull = pullDataFromSheets(ss);
      return jsonResponse({
        status: 'success',
        message: 'Data berhasil diambil',
        data: dataPull,
        db: dataPull,
        siswa: dataPull.siswa,
        kasus: dataPull.kasus,
        konseling: dataPull.konseling,
        jadwal: dataPull.jadwal,
        terlambat: dataPull.terlambat,
        absensi: dataPull.absensi,
        kelas: dataPull.kelas,
        users: dataPull.users,
        branding: dataPull.branding
      });
    }

    // =======================================================
    // 3. JALUR UPDATE DATABASE UTAMA (PUSH: SISWA, KASUS, DLL)
    // =======================================================
    if ((action === 'push' || !action) && db) {
      if (typeof db !== 'object') {
        return jsonResponse({ status: 'error', message: 'Ditolak: struktur data (db) tidak valid.' });
      }

      pushDataToSheets(db, ss);
      logNotification(ss, 'SUCCESS', 'Data siswa dan catatan berhasil disimpan ke Google Sheets');

      return jsonResponse({ status: 'success', message: 'Data siswa dan catatan berhasil disimpan ke Google Sheets' });
    }

    return jsonResponse({ status: 'error', message: 'Aksi (' + action + ') tidak dikenal oleh server' });
  } catch (err) {
    try {
      var ssErr = SpreadsheetApp.getActiveSpreadsheet();
      logNotification(ssErr, 'ERROR', 'Terjadi kesalahan server: ' + err.toString());
    } catch (logErr) {}

    return jsonResponse({ status: 'error', message: 'Terjadi kesalahan server: ' + err.toString() });
  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {}
    }
  }
}

// -------------------------------------------------------------------------
// HELPERS UMUM
// -------------------------------------------------------------------------
function jsonResponse(obj, httpStatusIgnored) {
  // Catatan: Apps Script Web App selalu balas HTTP 200 di level transport;
  // status error/unauthorized dikirim lewat field "status" di body JSON.
  // Frontend harus cek data.status === 'error', bukan hanya res.ok.
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function logNotification(ss, level, message) {
  try {
    var logSheet = getOrCreateSheet(ss, 'LogNotifikasi');
    if (logSheet.getLastRow() === 0) {
      logSheet.getRange(1, 1, 1, 3).setValues([['Waktu', 'Level', 'Pesan Notifikasi']]);
    }
    logSheet.appendRow([new Date(), level, message]);

    // Jaga agar log tidak tumbuh tanpa batas (potensi lambat/RTO jangka panjang)
    if (logSheet.getLastRow() > 2000) {
      logSheet.deleteRows(2, 500);
    }
  } catch (e) {}
}

// Cegah formula injection: jika string diawali =,+,-,@ beri prefix apostrof
// (selain juga setNumberFormat('@') pada range terkait sebagai lapis kedua)
function sanitizeCell_(val) {
  if (typeof val !== 'string') return val;
  if (/^[=+\-@]/.test(val)) {
    return "'" + val;
  }
  return val;
}

// ==========================================
// FUNGSI PUSH (SIMPAN / HAPUS / SINKRON)
// ==========================================
function pushDataToSheets(db, ss) {
  var siswaMap = {};
  if (db.siswa && Array.isArray(db.siswa)) {
    db.siswa.forEach(function (s) {
      if (s.id) siswaMap[s.id] = { nama: s.nama || '', kelas: s.kelas || '' };
    });
  }

  function writeToSheet(sheetName, headers, dataList, rowMapper) {
    var sh = getOrCreateSheet(ss, sheetName);

    // Bangun dulu rows barunya SEBELUM clearContents, supaya kalau
    // rowMapper melempar error, sheet lama tidak sempat dikosongkan.
    var rows = [headers];
    if (dataList && Array.isArray(dataList)) {
      dataList.forEach(function (item) {
        var mapped = rowMapper(item).map(sanitizeCell_);
        rows.push(mapped);
      });
    }

    sh.clearContents();
    if (rows.length > 0) {
      var range = sh.getRange(1, 1, rows.length, rows[0].length);
      range.setNumberFormat('@');
      range.setValues(rows);
    }
  }

  // 1. Backup AppPayload JSON — HANYA jika muat utuh, jangan dipotong
  //    (JSON terpotong = invalid, akan gagal JSON.parse saat fallback)
  try {
    var payloadSheet = getOrCreateSheet(ss, 'AppPayload');
    var jsonString = JSON.stringify(db);

    if (jsonString.length <= 49000) {
      payloadSheet.clearContents();
      payloadSheet.getRange(1, 1, 2, 3).setNumberFormat('@');
      payloadSheet.getRange(1, 1, 2, 3).setValues([
        ['Key', 'Payload JSON', 'Updated At'],
        ['main', jsonString, new Date().toISOString()]
      ]);
    } else {
      payloadSheet.clearContents();
      payloadSheet.getRange(1, 1, 2, 3).setValues([
        ['Key', 'Payload JSON', 'Updated At'],
        ['main', '[TERLALU BESAR - backup dilewati, andalkan sheet per-tabel]', new Date().toISOString()]
      ]);
    }
  } catch (err) {}

  // 2. Data Siswa
  writeToSheet(
    'Siswa',
    ['ID', 'Nama', 'NIS', 'Kelas', 'Jenis Kelamin', 'Alamat', 'Orang Tua', 'No HP', 'Status', 'Siswa Asuh', 'Catatan'],
    db.siswa,
    function (s) {
      return [
        s.id || '',
        s.nama || '',
        s.nis || '',
        s.kelas || '',
        s.jk || 'L',
        s.alamat || '',
        s.ortu || '',
        s.hp || '',
        s.status || 'aktif',
        s.asuh ? 'Ya' : 'Tidak',
        s.catatan || ''
      ];
    }
  );

  // 3. Data Kasus
  writeToSheet(
    'Kasus',
    ['ID', 'ID Siswa', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jenis', 'Poin', 'Deskripsi', 'Tindak Lanjut', 'Status'],
    db.kasus,
    function (k) {
      var info = siswaMap[k.siswaId] || { nama: '', kelas: '' };
      return [k.id || '', k.siswaId || '', info.nama, info.kelas, k.tanggal || '', k.jenis || '', k.poin || 0, k.deskripsi || '', k.tindakLanjut || '', k.status || 'baru'];
    }
  );

  // 4. Data Konseling
  writeToSheet(
    'Konseling',
    ['ID', 'ID Siswa', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jam', 'Jenis', 'Topik', 'Catatan', 'Tindak Lanjut'],
    db.konseling,
    function (c) {
      var info = siswaMap[c.siswaId] || { nama: '', kelas: '' };
      return [c.id || '', c.siswaId || '', c.siswaNama || info.nama, info.kelas, c.tanggal || '', c.jam || '', c.jenis || '', c.topik || '', c.catatan || '', c.tindakLanjut || ''];
    }
  );

  // 5. Data Jadwal
  writeToSheet(
    'Jadwal',
    ['ID', 'Tanggal', 'Jam', 'Kegiatan', 'Sasaran', 'Tempat', 'Catatan', 'Selesai'],
    db.jadwal,
    function (j) {
      return [j.id || '', j.tanggal || '', j.jam || '', j.kegiatan || '', j.sasaran || '', j.tempat || '', j.catatan || '', j.selesai ? 'Ya' : 'Tidak'];
    }
  );

  // 6. Data Terlambat
  writeToSheet(
    'Terlambat',
    ['ID', 'ID Siswa', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jam', 'Menit Terlambat', 'Keterangan'],
    db.terlambat,
    function (t) {
      var info = siswaMap[t.siswaId] || { nama: '', kelas: '' };
      return [t.id || '', t.siswaId || '', info.nama, info.kelas, t.tanggal || '', t.jam || '', t.menit || 0, t.keterangan || ''];
    }
  );

  // 7. Data Absensi
  writeToSheet(
    'Absensi',
    ['ID', 'ID Siswa', 'Nama Siswa', 'Kelas', 'Tanggal', 'Status', 'Keterangan'],
    db.absensi,
    function (a) {
      var info = siswaMap[a.siswaId] || { nama: '', kelas: '' };
      return [a.id || '', a.siswaId || '', info.nama, info.kelas, a.tanggal || '', a.status || 'Hadir', a.keterangan || ''];
    }
  );

  // 8. Data Kelas
  writeToSheet('Kelas', ['ID', 'Nama Kelas'], db.kelas, function (k) {
    return [k.id || '', k.nama || ''];
  });

  // 9. Data Pengguna (hanya ditimpa lewat db.users jika memang dikirim & valid)
  if (db.users && Array.isArray(db.users) && db.users.length > 0) {
    writeToSheet(
      'Pengguna',
      ['ID', 'Username', 'Password', 'Nama', 'Role', 'Status', 'NIP', 'Tanggal Dibuat'],
      db.users,
      function (u) {
        return [u.id || '', u.username || '', u.password || '', u.nama || '', u.role || 'guru', u.status || 'aktif', u.nip || '', u.createdAt || ''];
      }
    );
  }

  // 10. Data Identitas & Logo Sekolah (Branding)
  if (db.branding && typeof db.branding === 'object') {
    try {
      var shB = getOrCreateSheet(ss, 'Branding');
      shB.clearContents();
      var b = db.branding;
      var bRows = [
        ['Field', 'Nilai', 'Keterangan'],
        ['appLogo', String(b.appLogo || '').substring(0, 49000), 'Logo Aplikasi (URL atau Base64)'],
        ['schoolLogo', String(b.schoolLogo || '').substring(0, 49000), 'Logo Sekolah (URL atau Base64)'],
        ['appName', String(b.appName || '').substring(0, 500), 'Nama Aplikasi'],
        ['appTagline', String(b.appTagline || '').substring(0, 500), 'Tagline Aplikasi'],
        ['appMotto', String(b.appMotto || '').substring(0, 500), 'Motto Aplikasi'],
        ['schoolName', String(b.schoolName || '').substring(0, 500), 'Nama Sekolah'],
        ['schoolMotto', String(b.schoolMotto || '').substring(0, 500), 'Motto Sekolah'],
        ['kopInstansi', String(b.kopInstansi || '').substring(0, 500), 'Header Instansi KOP'],
        ['kopAlamat', String(b.kopAlamat || '').substring(0, 1000), 'Alamat KOP'],
        ['kopSubHeader', String(b.kopSubHeader || '').substring(0, 500), 'Sub-header KOP'],
        ['showLogoOnPrint', b.showLogoOnPrint ? '1' : '0', 'Tampilkan Logo Sekolah saat Cetak'],
        ['showBothLogosOnPrint', b.showBothLogosOnPrint ? '1' : '0', 'Tampilkan Kedua Logo saat Cetak'],
        ['updatedAt', new Date().toISOString(), 'Waktu Sinkronisasi Terakhir']
      ];
      var rangeB = shB.getRange(1, 1, bRows.length, bRows[0].length);
      rangeB.setNumberFormat('@');
      rangeB.setValues(bRows);
    } catch (eB) {
      logNotification(ss, 'WARN', 'Gagal update sheet Branding: ' + eB.toString());
    }
  }

  SpreadsheetApp.flush();
}

// ==========================================
// FUNGSI PULL (MEMBACA DATA MURNI DARI SHEETS)
// ==========================================
function pullDataFromSheets(ss) {
  function getHeaderMap(sheet) {
    if (!sheet || sheet.getLastRow() < 1) return {};
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var map = {};
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || '').trim().toLowerCase();
      if (h) map[h] = i;
    }
    return map;
  }

  function findCol(mapH, aliases, defaultIdx) {
    if (!mapH) return defaultIdx;
    // 1. Exact match di aliases
    for (var i = 0; i < aliases.length; i++) {
      var key = aliases[i].toLowerCase().trim();
      if (mapH[key] !== undefined) return mapH[key];
    }
    // 2. Substring match di headers
    for (var h in mapH) {
      for (var j = 0; j < aliases.length; j++) {
        var alias = aliases[j].toLowerCase().trim();
        if (h === alias || h.indexOf(alias) !== -1 || alias.indexOf(h) !== -1) {
          return mapH[h];
        }
      }
    }
    return defaultIdx;
  }

  function findSheet(aliases) {
    var sheets = ss.getSheets();
    if (!sheets || sheets.length === 0) return null;

    // 1. Coba exact name
    for (var a = 0; a < aliases.length; a++) {
      var sh = ss.getSheetByName(aliases[a]);
      if (sh) return sh;
    }

    // 2. Coba case-insensitive match
    for (var a = 0; a < aliases.length; a++) {
      var target = aliases[a].toLowerCase().trim();
      for (var s = 0; s < sheets.length; s++) {
        var sName = sheets[s].getName().toLowerCase().trim();
        if (sName === target) return sheets[s];
      }
    }

    // 3. Coba substring match
    for (var a = 0; a < aliases.length; a++) {
      var target = aliases[a].toLowerCase().trim();
      for (var s = 0; s < sheets.length; s++) {
        var sName = sheets[s].getName().toLowerCase().trim();
        if (sName.indexOf(target) !== -1) return sheets[s];
      }
    }

    // 4. Jika sheet hanya 1 dan kita mencari Siswa, gunakan sheet itu
    if (sheets.length === 1 && aliases.indexOf('Siswa') !== -1) {
      return sheets[0];
    }

    return null;
  }

  function getColVal(row, colIdx, defaultVal) {
    if (colIdx === undefined || colIdx < 0 || colIdx >= row.length) {
      return defaultVal !== undefined ? defaultVal : '';
    }
    var v = row[colIdx];
    return v !== null && v !== undefined ? v : defaultVal !== undefined ? defaultVal : '';
  }

  function unescapeVal(v) {
    if (typeof v === 'string' && v.charAt(0) === "'" && /^'[=+\-@]/.test(v)) {
      return v.substring(1);
    }
    return v;
  }

  function fmtDate(v) {
    if (!v) return '';
    if (v instanceof Date) return Utilities.formatDate(v, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
    var s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    return s;
  }

  function fmtTime(v) {
    if (!v) return '';
    if (v instanceof Date) return Utilities.formatDate(v, ss.getSpreadsheetTimeZone(), 'HH:mm');
    var s = String(v).trim();
    if (/^\d{1,2}:\d{2}/.test(s)) return s.substring(0, 5);
    return s;
  }

  var db = { siswa: [], kasus: [], konseling: [], jadwal: [], terlambat: [], absensi: [], kelas: [], users: [] };

  function readFromSheet(sheetAliases, rowMapper) {
    var sheet = findSheet(sheetAliases);
    if (!sheet || sheet.getLastRow() < 2) return [];

    var mapH = getHeaderMap(sheet);
    var vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var results = [];

    for (var rIdx = 0; rIdx < vals.length; rIdx++) {
      var row = vals[rIdx];
      // Cek apakah ada isi teks di baris ini (jangan buang hanya gara-gara kolom ID kosong!)
      var hasAnyContent = false;
      for (var c = 0; c < row.length; c++) {
        var cellVal = row[c];
        if (cellVal !== null && cellVal !== undefined && String(cellVal).trim() !== '') {
          hasAnyContent = true;
          break;
        }
      }
      if (!hasAnyContent) continue;

      var mapped = rowMapper(row, mapH, rIdx + 1);
      if (mapped) {
        // Jika ID kosong, generate ID otomatis agar data tidak terbuang
        if (!mapped.id || String(mapped.id).trim() === '') {
          var prefix = sheetAliases[0].toLowerCase().substring(0, 3);
          var sub = mapped.nis || mapped.nama || mapped.kegiatan || ('row_' + (rIdx + 1));
          mapped.id = prefix + '_' + (rIdx + 1) + '_' + String(sub).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
        }
        results.push(mapped);
      }
    }
    return results;
  }

  // 1. SISWA
  db.siswa = readFromSheet(['Siswa', 'Data Siswa', 'Daftar Siswa', 'Peserta Didik', 'Data Murid', 'Murid', 'Sheet1'], function (r, m, rowNum) {
    var idxId = findCol(m, ['id', 'id siswa', 'kode', 'nomor id', 'no id', 'no.', 'no', 'nomor'], -1);
    var idxNama = findCol(m, ['nama', 'nama siswa', 'nama lengkap', 'nama peserta didik', 'peserta didik', 'siswa', 'murid', 'name'], -1);
    var idxNis = findCol(m, ['nis', 'nisn', 'no induk', 'no. induk', 'nomor induk', 'nis/nisn'], -1);
    var idxKelas = findCol(m, ['kelas', 'rombel', 'tingkat', 'kelas/rombel', 'ruang', 'class'], -1);
    var idxJk = findCol(m, ['jenis kelamin', 'jk', 'l/p', 'gender', 'kelamin', 'j.k.'], -1);
    var idxAlamat = findCol(m, ['alamat', 'alamat rumah', 'tempat tinggal', 'domisili', 'address'], -1);
    var idxOrtu = findCol(m, ['orang tua', 'ortu', 'wali', 'nama orang tua', 'nama ortu', 'nama wali', 'ayah', 'ibu'], -1);
    var idxHp = findCol(m, ['no hp', 'hp', 'no. hp', 'telepon', 'no telepon', 'no wa', 'whatsapp', 'wa', 'kontak', 'phone'], -1);
    var idxStatus = findCol(m, ['status', 'status siswa', 'kondisi'], -1);
    var idxAsuh = findCol(m, ['siswa asuh', 'asuh', 'anak asuh', 'bina'], -1);
    var idxCatatan = findCol(m, ['catatan', 'keterangan', 'catatan guru', 'notes'], -1);

    var rawNama = String(unescapeVal(getColVal(r, idxNama, ''))).trim();
    var rawNis = String(unescapeVal(getColVal(r, idxNis, ''))).trim();
    if (!rawNama && !rawNis) return null;

    var jkVal = String(getColVal(r, idxJk, 'L')).toUpperCase().trim();
    var jkClean = (jkVal.charAt(0) === 'P' || jkVal.indexOf('PEREMPUAN') !== -1 || jkVal.indexOf('WANITA') !== -1) ? 'P' : 'L';

    var statusVal = String(getColVal(r, idxStatus, 'aktif')).toLowerCase().trim();
    if (statusVal !== 'berhenti' && statusVal !== 'pindah' && statusVal !== 'keluar') {
      statusVal = 'aktif';
    }

    var asuhVal = String(getColVal(r, idxAsuh, '')).toLowerCase().trim();
    var isAsuh = asuhVal === 'ya' || asuhVal === 'true' || asuhVal === '1' || asuhVal === 'v';

    return {
      id: String(unescapeVal(getColVal(r, idxId, ''))).trim(),
      nama: rawNama || ('Siswa ' + (rawNis || rowNum)),
      nis: rawNis,
      kelas: String(unescapeVal(getColVal(r, idxKelas, ''))).trim(),
      jk: jkClean,
      alamat: String(unescapeVal(getColVal(r, idxAlamat, ''))).trim(),
      ortu: String(unescapeVal(getColVal(r, idxOrtu, ''))).trim(),
      hp: String(unescapeVal(getColVal(r, idxHp, ''))).trim(),
      status: statusVal,
      asuh: isAsuh,
      catatan: String(unescapeVal(getColVal(r, idxCatatan, ''))).trim()
    };
  });

  // Map untuk menghubungkan kasus/konseling/absensi ke siswa jika hanya ada nama / NIS
  var siswaByName = {};
  var siswaByNis = {};
  db.siswa.forEach(function (s) {
    if (s.nama) siswaByName[String(s.nama).trim().toLowerCase()] = s.id;
    if (s.nis) siswaByNis[String(s.nis).trim().toLowerCase()] = s.id;
  });

  function resolveSiswaId(currId, nameVal, nisVal) {
    if (currId && String(currId).trim() !== '') return String(currId).trim();
    if (nisVal && siswaByNis[String(nisVal).trim().toLowerCase()]) {
      return siswaByNis[String(nisVal).trim().toLowerCase()];
    }
    if (nameVal && siswaByName[String(nameVal).trim().toLowerCase()]) {
      return siswaByName[String(nameVal).trim().toLowerCase()];
    }
    return '';
  }

  // 2. KASUS
  db.kasus = readFromSheet(['Kasus', 'Data Kasus', 'Pelanggaran', 'Catatan Kasus', 'Cases'], function (r, m) {
    var idxId = findCol(m, ['id', 'no', 'nomor', 'kode'], -1);
    var idxSiswaId = findCol(m, ['id siswa', 'siswa id', 'nis', 'id_siswa'], -1);
    var idxSiswaNama = findCol(m, ['nama siswa', 'nama', 'siswa'], -1);
    var idxTgl = findCol(m, ['tanggal', 'tgl', 'date', 'waktu'], -1);
    var idxJenis = findCol(m, ['jenis', 'jenis kasus', 'kategori', 'klasifikasi', 'tingkat'], -1);
    var idxPoin = findCol(m, ['poin', 'skor', 'nilai', 'bobot'], -1);
    var idxDesk = findCol(m, ['deskripsi', 'uraian', 'kejadian', 'peristiwa', 'kronologi', 'kasus', 'pelanggaran'], -1);
    var idxTindak = findCol(m, ['tindak lanjut', 'solusi', 'penanganan', 'tindakan'], -1);
    var idxStatus = findCol(m, ['status', 'status kasus', 'kondisi'], -1);

    var rawSId = String(getColVal(r, idxSiswaId, ''));
    var rawSNama = String(getColVal(r, idxSiswaNama, ''));
    var sId = resolveSiswaId(rawSId, rawSNama, rawSId);

    var jVal = String(getColVal(r, idxJenis, 'ringan')).toLowerCase().trim();
    if (jVal !== 'sedang' && jVal !== 'berat') jVal = 'ringan';

    var stVal = String(getColVal(r, idxStatus, 'baru')).toLowerCase().trim();
    if (stVal !== 'proses' && stVal !== 'selesai') stVal = 'baru';

    return {
      id: String(getColVal(r, idxId, '')).trim(),
      siswaId: sId || rawSId,
      tanggal: fmtDate(getColVal(r, idxTgl, '')) || fmtDate(new Date()),
      jenis: jVal,
      poin: Number(getColVal(r, idxPoin, 0)) || 0,
      deskripsi: String(unescapeVal(getColVal(r, idxDesk, ''))).trim(),
      tindakLanjut: String(unescapeVal(getColVal(r, idxTindak, ''))).trim(),
      status: stVal
    };
  });

  // 3. KONSELING
  db.konseling = readFromSheet(['Konseling', 'Data Konseling', 'BK', 'Bimbingan Konseling', 'Counseling'], function (r, m) {
    var idxId = findCol(m, ['id', 'no', 'nomor', 'kode'], -1);
    var idxSiswaId = findCol(m, ['id siswa', 'siswa id', 'nis'], -1);
    var idxSiswaNama = findCol(m, ['nama siswa', 'nama', 'konseli', 'siswa'], -1);
    var idxTgl = findCol(m, ['tanggal', 'tgl', 'date'], -1);
    var idxJam = findCol(m, ['jam', 'waktu', 'pukul', 'time'], -1);
    var idxJenis = findCol(m, ['jenis', 'jenis konseling', 'layanan', 'tipe'], -1);
    var idxTopik = findCol(m, ['topik', 'masalah', 'permasalahan', 'hal', 'agenda', 'judul', 'pokok bahasan'], -1);
    var idxCatatan = findCol(m, ['catatan', 'hasil', 'uraian', 'proses', 'keterangan'], -1);
    var idxTindak = findCol(m, ['tindak lanjut', 'rekomendasi', 'rencana', 'kesepakatan'], -1);

    var rawSId = String(getColVal(r, idxSiswaId, ''));
    var rawSNama = String(getColVal(r, idxSiswaNama, ''));
    var sId = resolveSiswaId(rawSId, rawSNama, rawSId);

    var jVal = String(getColVal(r, idxJenis, 'individu')).toLowerCase().trim();
    if (jVal !== 'kelompok' && jVal !== 'klasikal') jVal = 'individu';

    return {
      id: String(getColVal(r, idxId, '')).trim(),
      siswaId: sId || rawSId,
      siswaNama: rawSNama,
      tanggal: fmtDate(getColVal(r, idxTgl, '')) || fmtDate(new Date()),
      jam: fmtTime(getColVal(r, idxJam, '')),
      jenis: jVal,
      topik: String(unescapeVal(getColVal(r, idxTopik, ''))).trim(),
      catatan: String(unescapeVal(getColVal(r, idxCatatan, ''))).trim(),
      tindakLanjut: String(unescapeVal(getColVal(r, idxTindak, ''))).trim()
    };
  });

  // 4. JADWAL
  db.jadwal = readFromSheet(['Jadwal', 'Data Jadwal', 'Agenda', 'Jadwal BK', 'Schedule'], function (r, m) {
    var idxId = findCol(m, ['id', 'no', 'nomor'], -1);
    var idxTgl = findCol(m, ['tanggal', 'tgl', 'date'], -1);
    var idxJam = findCol(m, ['jam', 'waktu', 'pukul'], -1);
    var idxKegiatan = findCol(m, ['kegiatan', 'nama kegiatan', 'acara', 'agenda', 'aktivitas'], -1);
    var idxSasaran = findCol(m, ['sasaran', 'peserta', 'target', 'kelas'], -1);
    var idxTempat = findCol(m, ['tempat', 'ruang', 'lokasi'], -1);
    var idxCatatan = findCol(m, ['catatan', 'keterangan'], -1);
    var idxSelesai = findCol(m, ['selesai', 'status', 'is_done', 'sudah'], -1);

    var selVal = String(getColVal(r, idxSelesai, '')).toLowerCase().trim();
    var isSelesai = selVal === 'ya' || selVal === 'true' || selVal === '1' || selVal === 'selesai';

    return {
      id: String(getColVal(r, idxId, '')).trim(),
      tanggal: fmtDate(getColVal(r, idxTgl, '')) || fmtDate(new Date()),
      jam: fmtTime(getColVal(r, idxJam, '')),
      kegiatan: String(unescapeVal(getColVal(r, idxKegiatan, ''))).trim(),
      sasaran: String(unescapeVal(getColVal(r, idxSasaran, ''))).trim(),
      tempat: String(unescapeVal(getColVal(r, idxTempat, ''))).trim(),
      catatan: String(unescapeVal(getColVal(r, idxCatatan, ''))).trim(),
      selesai: isSelesai
    };
  });

  // 5. TERLAMBAT
  db.terlambat = readFromSheet(['Terlambat', 'Data Terlambat', 'Keterlambatan', 'Disiplin', 'Late'], function (r, m) {
    var idxId = findCol(m, ['id', 'no', 'nomor'], -1);
    var idxSiswaId = findCol(m, ['id siswa', 'siswa id', 'nis'], -1);
    var idxSiswaNama = findCol(m, ['nama siswa', 'nama'], -1);
    var idxTgl = findCol(m, ['tanggal', 'tgl', 'date'], -1);
    var idxJam = findCol(m, ['jam', 'waktu', 'pukul'], -1);
    var idxMenit = findCol(m, ['menit terlambat', 'menit', 'durasi', 'lama'], -1);
    var idxKet = findCol(m, ['keterangan', 'alasan', 'penyebab', 'catatan'], -1);

    var rawSId = String(getColVal(r, idxSiswaId, ''));
    var rawSNama = String(getColVal(r, idxSiswaNama, ''));
    var sId = resolveSiswaId(rawSId, rawSNama, rawSId);

    return {
      id: String(getColVal(r, idxId, '')).trim(),
      siswaId: sId || rawSId,
      tanggal: fmtDate(getColVal(r, idxTgl, '')) || fmtDate(new Date()),
      jam: fmtTime(getColVal(r, idxJam, '')),
      menit: Number(getColVal(r, idxMenit, 0)) || 0,
      keterangan: String(unescapeVal(getColVal(r, idxKet, ''))).trim()
    };
  });

  // 6. ABSENSI
  db.absensi = readFromSheet(['Absensi', 'Data Absensi', 'Presensi', 'Kehadiran', 'Attendance'], function (r, m) {
    var idxId = findCol(m, ['id', 'no', 'nomor'], -1);
    var idxSiswaId = findCol(m, ['id siswa', 'siswa id', 'nis'], -1);
    var idxSiswaNama = findCol(m, ['nama siswa', 'nama'], -1);
    var idxTgl = findCol(m, ['tanggal', 'tgl', 'date'], -1);
    var idxStatus = findCol(m, ['status', 'kehadiran', 'status kehadiran', 'presensi'], -1);
    var idxKet = findCol(m, ['keterangan', 'alasan', 'catatan'], -1);

    var rawSId = String(getColVal(r, idxSiswaId, ''));
    var rawSNama = String(getColVal(r, idxSiswaNama, ''));
    var sId = resolveSiswaId(rawSId, rawSNama, rawSId);

    var stVal = String(getColVal(r, idxStatus, 'hadir')).toLowerCase().trim();
    if (stVal !== 'sakit' && stVal !== 'izin' && stVal !== 'alpa') stVal = 'hadir';

    return {
      id: String(getColVal(r, idxId, '')).trim(),
      siswaId: sId || rawSId,
      tanggal: fmtDate(getColVal(r, idxTgl, '')) || fmtDate(new Date()),
      status: stVal,
      keterangan: String(unescapeVal(getColVal(r, idxKet, ''))).trim()
    };
  });

  // 7. KELAS
  db.kelas = readFromSheet(['Kelas', 'Data Kelas', 'Rombel', 'Classes'], function (r, m) {
    var idxId = findCol(m, ['id', 'kode', 'no'], -1);
    var idxNama = findCol(m, ['nama kelas', 'nama', 'kelas', 'rombel'], -1);
    return {
      id: String(getColVal(r, idxId, '')).trim(),
      nama: String(unescapeVal(getColVal(r, idxNama, ''))).trim()
    };
  });

  // 8. PENGGUNA
  db.users = readFromSheet(['Pengguna', 'Data Pengguna', 'Users', 'User', 'Akun'], function (r, m) {
    var idxId = findCol(m, ['id', 'no'], -1);
    var idxUser = findCol(m, ['username', 'user', 'nama pengguna', 'email', 'login'], -1);
    var idxPass = findCol(m, ['password', 'pass', 'kata sandi'], -1);
    var idxNama = findCol(m, ['nama', 'nama lengkap', 'nama guru'], -1);
    var idxRole = findCol(m, ['role', 'peran', 'jabatan', 'level'], -1);
    var idxStatus = findCol(m, ['status'], -1);
    var idxNip = findCol(m, ['nip', 'nik'], -1);
    var idxTgl = findCol(m, ['tanggal dibuat', 'created at', 'dibuat'], -1);

    var rVal = String(getColVal(r, idxRole, 'guru')).toLowerCase().trim();
    if (rVal !== 'admin') rVal = 'guru';

    var stVal = String(getColVal(r, idxStatus, 'aktif')).toLowerCase().trim();
    if (stVal !== 'nonaktif' && stVal !== 'menunggu') stVal = 'aktif';

    return {
      id: String(getColVal(r, idxId, '')).trim(),
      username: String(unescapeVal(getColVal(r, idxUser, ''))).trim(),
      password: String(getColVal(r, idxPass, '')),
      nama: String(unescapeVal(getColVal(r, idxNama, ''))).trim(),
      role: rVal,
      status: stVal,
      nip: String(getColVal(r, idxNip, '')).trim(),
      createdAt: String(getColVal(r, idxTgl, ''))
    };
  });

  // Pastikan semua kelas dari data siswa juga terdaftar di db.kelas
  var existKls = {};
  db.kelas.forEach(function (k) {
    if (k.nama) existKls[String(k.nama).trim().toLowerCase()] = true;
  });
  db.siswa.forEach(function (s) {
    if (s.kelas && String(s.kelas).trim() !== '') {
      var kName = String(s.kelas).trim();
      var key = kName.toLowerCase();
      if (!existKls[key]) {
        existKls[key] = true;
        db.kelas.push({ id: 'kls_' + (db.kelas.length + 1), nama: kName });
      }
    }
  });

  // 9. DATA BRANDING (IDENTITAS & LOGO)
  var shB = findSheet(['Branding', 'Identitas', 'Sekolah', 'Profil Sekolah']);
  if (shB && shB.getLastRow() >= 2) {
    try {
      var bVals = shB.getRange(2, 1, shB.getLastRow() - 1, Math.min(shB.getLastColumn(), 2)).getValues();
      var bMap = {};
      for (var bi = 0; bi < bVals.length; bi++) {
        var fld = String(bVals[bi][0] || '').trim();
        var val = bVals[bi][1] !== undefined && bVals[bi][1] !== null ? String(bVals[bi][1]) : '';
        if (fld) bMap[fld] = val;
      }
      if (Object.keys(bMap).length > 0) {
        db.branding = {
          appLogo: bMap['appLogo'] || '',
          schoolLogo: bMap['schoolLogo'] || '',
          appName: bMap['appName'] || '',
          appTagline: bMap['appTagline'] || '',
          appMotto: bMap['appMotto'] || '',
          schoolName: bMap['schoolName'] || '',
          schoolMotto: bMap['schoolMotto'] || '',
          kopInstansi: bMap['kopInstansi'] || '',
          kopAlamat: bMap['kopAlamat'] || '',
          kopSubHeader: bMap['kopSubHeader'] || '',
          showLogoOnPrint: bMap['showLogoOnPrint'] === '1' || bMap['showLogoOnPrint'] === 'true',
          showBothLogosOnPrint: bMap['showBothLogosOnPrint'] === '1' || bMap['showBothLogosOnPrint'] === 'true'
        };
      }
    } catch (errB) {}
  }

  // 10. PEMULIHAN DARI AppPayload (BACKUP CADANGAN TERDAHULU)
  // Jika siswa kosong di sheet tabel ATAU jika AppPayload menyimpan data yang lebih lengkap
  var shPayload = findSheet(['AppPayload', 'Payload', 'Backup', 'JsonBackup', 'DataBackup']);
  if (shPayload && shPayload.getLastRow() >= 2) {
    try {
      var val = shPayload.getRange(2, 2).getValue();
      if (val && typeof val === 'string' && val.trim() !== '' && val.indexOf('[TERLALU BESAR') !== 0) {
        var parsedPayload = JSON.parse(val);
        if (parsedPayload && typeof parsedPayload === 'object') {
          // Pulihkan tabel jika di sheet tabel kosong atau belum termuat
          if ((!db.siswa || db.siswa.length === 0) && Array.isArray(parsedPayload.siswa) && parsedPayload.siswa.length > 0) {
            db.siswa = parsedPayload.siswa;
          }
          if ((!db.kasus || db.kasus.length === 0) && Array.isArray(parsedPayload.kasus) && parsedPayload.kasus.length > 0) {
            db.kasus = parsedPayload.kasus;
          }
          if ((!db.konseling || db.konseling.length === 0) && Array.isArray(parsedPayload.konseling) && parsedPayload.konseling.length > 0) {
            db.konseling = parsedPayload.konseling;
          }
          if ((!db.jadwal || db.jadwal.length === 0) && Array.isArray(parsedPayload.jadwal) && parsedPayload.jadwal.length > 0) {
            db.jadwal = parsedPayload.jadwal;
          }
          if ((!db.terlambat || db.terlambat.length === 0) && Array.isArray(parsedPayload.terlambat) && parsedPayload.terlambat.length > 0) {
            db.terlambat = parsedPayload.terlambat;
          }
          if ((!db.absensi || db.absensi.length === 0) && Array.isArray(parsedPayload.absensi) && parsedPayload.absensi.length > 0) {
            db.absensi = parsedPayload.absensi;
          }
          if ((!db.kelas || db.kelas.length === 0) && Array.isArray(parsedPayload.kelas) && parsedPayload.kelas.length > 0) {
            db.kelas = parsedPayload.kelas;
          }
          if ((!db.users || db.users.length === 0) && Array.isArray(parsedPayload.users) && parsedPayload.users.length > 0) {
            db.users = parsedPayload.users;
          }
          if (!db.branding && parsedPayload.branding) {
            db.branding = parsedPayload.branding;
          }
        }
      }
    } catch (ePayload) {}
  }

  return db;
}
`;

export async function pushUsersOnlyToGoogleSheets(
  usersData: any[],
  url: string,
  apiToken?: string
): Promise<{ success: boolean; message: string }> {
  const trimmed = (url || '').trim();
  if (!trimmed || trimmed === '/api/sheets-proxy') {
    return { success: false, message: 'URL Google Apps Script belum diisi.' };
  }
  let formattedUrl = trimmed;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }
  try {
    const res = await fetch(formattedUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'push_users', data: usersData, token: apiToken || '' }),
    });
    const rawText = await res.text();
    if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE') || rawText.includes('accounts.google.com')) {
      return { success: false, message: 'Gagal update akun: Google meminta login. Cek izin deployment "Anyone".' };
    }
    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch {
      return { success: false, message: 'Respon server bukan JSON valid.' };
    }
    return { success: result && (result.success || result.status === 'success'), message: result.message || 'Sukses' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal koneksi: ${msg}` };
  }
}