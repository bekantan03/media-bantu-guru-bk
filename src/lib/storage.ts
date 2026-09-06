import { Siswa, Kasus, Konseling, Jadwal, Terlambat, Absensi, KelasItem, UserAccount } from '../types';

const KEYS = {
  siswa: 'mbg_siswa',
  kasus: 'mbg_kasus',
  konseling: 'mbg_konseling',
  jadwal: 'mbg_jadwal',
  terlambat: 'mbg_terlambat',
  absensi: 'mbg_absensi',
  kelas: 'mbg_kelas',
  users: 'mbg_users',
  currentUser: 'mbg_current_user',
  version: 'mbg_storage_version',
};

const CURRENT_STORAGE_VERSION = 'v3_empty_clean';

function checkAndMigrateStorage(): void {
  try {
    const ver = localStorage.getItem(KEYS.version);
    if (ver !== CURRENT_STORAGE_VERSION) {
      // Flush previous dummy data from localStorage while preserving user credentials & sheets config
      localStorage.removeItem(KEYS.siswa);
      localStorage.removeItem(KEYS.kasus);
      localStorage.removeItem(KEYS.konseling);
      localStorage.removeItem(KEYS.jadwal);
      localStorage.removeItem(KEYS.terlambat);
      localStorage.removeItem(KEYS.absensi);
      localStorage.removeItem(KEYS.kelas);
      localStorage.setItem(KEYS.version, CURRENT_STORAGE_VERSION);
    }
  } catch (e) {
    console.error('Storage version check failed:', e);
  }
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function thisMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function fmtDate(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtDateFull(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function currentTahunAjaran(): number {
  const d = new Date();
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? y : y - 1;
}

export function currentSemester(): 'ganjil' | 'genap' {
  const m = new Date().getMonth();
  return m >= 6 ? 'ganjil' : 'genap';
}

export function initials(name?: string): string {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

export function escapeHtml(str?: string | number | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Initial Clean Data (Empty database)
const INITIAL_SISWA: Siswa[] = [];
const INITIAL_KASUS: Kasus[] = [];
const INITIAL_KONSELING: Konseling[] = [];
const INITIAL_JADWAL: Jadwal[] = [];
const INITIAL_TERLAMBAT: Terlambat[] = [];
const INITIAL_KELAS: KelasItem[] = [];

export function getStoredData<T>(key: string, defaultData: T): T {
  checkAndMigrateStorage();
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return defaultData;
    if (Array.isArray(defaultData) && !Array.isArray(parsed)) return defaultData;
    return parsed as T;
  } catch (e) {
    console.error('Failed to parse storage key:', key, e);
    return defaultData;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to set storage key:', key, e);
  }
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-admin',
    username: 'admin',
    password: '8Delapan',
    nama: 'Administrator BK Utama',
    role: 'admin',
    status: 'aktif',
    nip: '198501012010011001',
    createdAt: '2026-01-01',
  },
  {
    id: 'u-guru1',
    username: 'guru',
    password: 'guru123',
    nama: 'Ahmad Fauzi, S.Pd.',
    role: 'guru',
    status: 'aktif',
    nip: '199003152015021002',
    createdAt: '2026-01-05',
  },
  {
    id: 'u-guru2',
    username: 'siti',
    password: 'siti123',
    nama: 'Siti Rahmawati, S.Psi.',
    role: 'guru',
    status: 'aktif',
    nip: '199207202018032001',
    createdAt: '2026-02-10',
  },
];

export function getFactoryDefaultDatabase() {
  return {
    siswa: INITIAL_SISWA,
    kasus: INITIAL_KASUS,
    konseling: INITIAL_KONSELING,
    jadwal: INITIAL_JADWAL,
    terlambat: INITIAL_TERLAMBAT,
    absensi: [],
    kelas: INITIAL_KELAS,
    users: INITIAL_USERS,
  };
}

export function loadInitialDatabase() {
  return {
    siswa: getStoredData<Siswa[]>(KEYS.siswa, INITIAL_SISWA),
    kasus: getStoredData<Kasus[]>(KEYS.kasus, INITIAL_KASUS),
    konseling: getStoredData<Konseling[]>(KEYS.konseling, INITIAL_KONSELING),
    jadwal: getStoredData<Jadwal[]>(KEYS.jadwal, INITIAL_JADWAL),
    terlambat: getStoredData<Terlambat[]>(KEYS.terlambat, INITIAL_TERLAMBAT),
    absensi: getStoredData<Absensi[]>(KEYS.absensi, []),
    kelas: getStoredData<KelasItem[]>(KEYS.kelas, INITIAL_KELAS),
    users: getStoredData<UserAccount[]>(KEYS.users, INITIAL_USERS),
  };
}

export function getStoredCurrentUser(): UserAccount | null {
  try {
    const item = localStorage.getItem(KEYS.currentUser);
    if (!item) return null;
    return JSON.parse(item) as UserAccount;
  } catch {
    return null;
  }
}

export function setStoredCurrentUser(user: UserAccount | null): void {
  try {
    if (!user) {
      localStorage.removeItem(KEYS.currentUser);
    } else {
      localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to set current user:', e);
  }
}

export function getStoredUsers(): UserAccount[] {
  const users = getStoredData<UserAccount[]>(KEYS.users, INITIAL_USERS);
  // Auto-update admin password if it's still old default admin123
  let updated = false;
  const migrated = users.map((u) => {
    if (u.username.toLowerCase() === 'admin' && u.password === 'admin123') {
      updated = true;
      return { ...u, password: '8Delapan' };
    }
    return u;
  });

  if (updated) {
    setStoredUsers(migrated);
  }
  return migrated;
}

export function setStoredUsers(users: UserAccount[]): void {
  setStoredData(KEYS.users, users);
}

// ---------------------------------------------------------------------------
// Student Duplicate Detection & Normalization Utilities
// ---------------------------------------------------------------------------

/**
 * Checks if a string represents a valid, non-placeholder NIS (Nomor Induk Siswa).
 * Empty, dash '-', zero '0', or 'n/a' are considered non-valid placeholders and
 * should NOT be used as unique identifiers for duplicate detection.
 */
export function isValidNis(nis?: string | number | null): boolean {
  if (nis === undefined || nis === null) return false;
  let clean = String(nis).trim().toLowerCase();
  if (!clean) return false;
  // Strip leading apostrophes/quotes
  clean = clean.replace(/^['"]+/, '').trim();
  const invalidPlaceholders = [
    '-', '--', '---', '0', '00', '000', '0000', '00000',
    'null', 'undefined', 'n/a', 'na', 'none', 'tidak ada', 'belum ada', 'belum', '?', '.',
    'l', 'p', 'laki', 'laki-laki', 'perempuan', 'pria', 'wanita', 'gender', 'jk'
  ];
  if (invalidPlaceholders.includes(clean)) return false;

  // NIS/NISN asli di Indonesia minimal 5 digit (umumnya NISN = 10 digit).
  // Angka pendek 1-4 digit (mis. "1", "2", "01", "12") hampir pasti kode gender,
  // nomor urut, atau kolom yang salah terbaca — bukan NIS sungguhan.
  if (/^\d{1,4}$/.test(clean)) return false;

  return true;
}

/**
 * Normalizes student name by trimming and collapsing multiple spaces.
 */
export function normalizeNama(name?: string | null): string {
  if (!name) return '';
  return String(name).trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Normalizes class name for comparison (e.g. "7 A", " 7A ", "VII-A").
 */
export function normalizeKelas(kelas?: string | null): string {
  if (!kelas) return '';
  return String(kelas).trim().replace(/[\s\-_]+/g, '').toLowerCase();
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
}

/**
 * Checks if two student records represent the exact same person.
 *
 * CRITICAL RULE:
 * 1. They are duplicates IF both have a VALID (non-placeholder, non-empty) NIS and the NIS is identical.
 * 2. OR they are duplicates IF they have the SAME Name AND the SAME Class.
 *
 * If two students have the SAME Name but DIFFERENT Classes, they are DIFFERENT students
 * and MUST NOT be marked as duplicate!
 * If NIS is empty or invalid (e.g. 'L', 'P', '-'), comparison MUST fall back ONLY to Name + Class!
 */
export function isDuplicateSiswa(
  a: { nama?: string; nis?: string; kelas?: string },
  b: { nama?: string; nis?: string; kelas?: string }
): DuplicateCheckResult {
  const aNis = (a.nis || '').trim();
  const bNis = (b.nis || '').trim();
  const aNama = normalizeNama(a.nama);
  const bNama = normalizeNama(b.nama);
  const aKelas = normalizeKelas(a.kelas);
  const bKelas = normalizeKelas(b.kelas);

  if (!aNama || !bNama) {
    return { isDuplicate: false };
  }

  // 1. If both records have valid unique NIS (real student IDs, not gender/blank/placeholder) and they match
  if (isValidNis(aNis) && isValidNis(bNis) && aNis.toLowerCase() === bNis.toLowerCase()) {
    return {
      isDuplicate: true,
      reason: `NIS "${aNis}" sudah terdaftar atas nama ${b.nama || 'siswa lain'}`,
    };
  }

  // 2. If both records have the SAME Name AND the SAME Class
  if (aNama === bNama && aKelas === bKelas && aKelas !== '') {
    return {
      isDuplicate: true,
      reason: `Nama "${a.nama}" di Kelas "${a.kelas || b.kelas}" sudah ada di database`,
    };
  }

  // Same name in DIFFERENT classes is completely ALLOWED!
  return { isDuplicate: false };
}

/**
 * Robust extractor for Excel / tabular row objects supporting various Indonesian column names.
 */
export function extractSiswaFromRow(row: Record<string, any>, defaultKelas = ''): Partial<Siswa> | null {
  if (!row || typeof row !== 'object') return null;

  const rowKeys = Object.keys(row);

  const findValue = (possibleKeys: string[], excludePatterns: RegExp[] = []): string => {
    // 1. Direct exact match (case-insensitive)
    for (const key of possibleKeys) {
      for (const rk of rowKeys) {
        if (rk.trim().toLowerCase() === key.toLowerCase()) {
          // Check exclusion
          if (excludePatterns.some((p) => p.test(rk.trim().toLowerCase()))) continue;
          const val = row[rk];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
    }

    // 2. Normalized alphanumeric key match
    for (const target of possibleKeys) {
      const targetClean = target.toLowerCase().replace(/[\s_\-\/.]+/g, '');
      for (const rk of rowKeys) {
        const rkLower = rk.toLowerCase().trim();
        if (excludePatterns.some((p) => p.test(rkLower))) continue;
        const rkClean = rkLower.replace(/[\s_\-\/.]+/g, '');
        if (rkClean === targetClean) {
          const val = row[rk];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
    }

    // 3. Exact word boundary match in column header (e.g. column "NIS" or "NO NISN")
    for (const target of possibleKeys) {
      const targetLower = target.toLowerCase().trim();
      for (const rk of rowKeys) {
        const rkLower = rk.toLowerCase().trim();
        if (excludePatterns.some((p) => p.test(rkLower))) continue;

        const wordRegex = new RegExp(`(^|[^a-z0-9])${targetLower}([^a-z0-9]|$)`, 'i');
        if (wordRegex.test(rkLower) || rkLower === targetLower) {
          const val = row[rk];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
    }
    return '';
  };

  // Find Nama (avoid matching parent/ortu/wali)
  const nama = findValue([
    'nama', 'nama siswa', 'nama_siswa', 'namasiswa', 'nama lengkap', 'nama_lengkap',
    'nama peserta didik', 'peserta didik', 'nama murid', 'murid', 'student name', 'name'
  ], [/ortu/i, /wali/i, /ayah/i, /ibu/i, /parent/i, /kelas/i]);

  if (!nama) return null;

  // Find NIS / NISN (CRITICAL: exclude columns like "Jenis Kelamin", "Jenis Kelar", "Kelamin", "Gender", "JK", "No Urut")
  const nisRaw = findValue([
    'nisn', 'nis', 'nis / nisn', 'nis/nisn', 'no induk', 'nomor induk', 'no. induk',
    'no_induk', 'id siswa', 'student id', 'nomor induk siswa', 'nomor induk siswa nasional'
  ], [/jenis/i, /kelam/i, /gender/i, /^\s*jk\s*$/i, /^\s*no\s*$/i, /nomor\s*urut/i, /nama/i, /kelas/i]);

  // Find Jenis Kelamin
  // PENTING: JANGAN pakai /nis/i sebagai exclude di sini — kata "Jenis" itu sendiri
  // mengandung substring "nis" (je-NIS-Kelamin), jadi /nis/i akan ikut memblokir
  // header "Jenis Kelamin" yang justru ingin kita baca. Cukup exclude /nama/i dan /kelas/i.
  const jkRaw = findValue([
    'jenis kelamin', 'jenis kelam', 'jenis kelar', 'jeniskelamin', 'jk', 'j/k', 'l/p', 'gender', 'kelamin', 'sex'
  ], [/nama/i, /kelas/i]) || 'L';

  const jkClean = jkRaw.toUpperCase().trim();
  const jk =
    jkClean === '2' ||
    jkClean.startsWith('P') ||
    jkClean.startsWith('W') ||
    jkClean.includes('PEREMPUAN')
      ? 'P'
      : 'L';

  // Find Kelas
  const kelas = findValue([
    'kelas', 'rombel', 'rombongan belajar', 'tingkat', 'ruang', 'kelas / rombel',
    'kelas/rombel', 'nama kelas', 'nama_kelas', 'class', 'grade'
  ], [/nama siswa/i, /wali/i]) || defaultKelas;

  // Find Orang Tua / Wali
  const ortu = findValue([
    'nama orang tua/wali', 'nama orang tua', 'orang tua', 'ortu', 'wali', 'nama wali',
    'orang tua/wali', 'ayah', 'ibu', 'parent', 'nama ayah', 'nama ibu'
  ], [/nama siswa/i]);

  // Find Kontak HP
  const hp = findValue([
    'no hp orang tua/wali', 'no hp orang tua', 'no hp', 'hp', 'no telepon', 'telepon',
    'no wa', 'whatsapp', 'kontak', 'no. hp', 'no_hp', 'phone', 'phone number'
  ]);

  // Find Catatan
  const catatan = findValue([
    'catatan khusus', 'catatan', 'keterangan', 'alamat', 'note', 'notes', 'keterangan lain'
  ]);

  // Ensure NIS is actually valid, otherwise leave it empty so it won't trigger fake duplicate collision
  const validNisVal = isValidNis(nisRaw) ? String(nisRaw).trim() : '';

  return {
    nama,
    nis: validNisVal,
    kelas: kelas || defaultKelas || '',
    jk,
    ortu,
    hp,
    catatan,
    asuh: false,
    status: 'aktif',
  };
}

/**
 * Robust CSV parser that handles comma, semicolon, tab delimiters and quoted values.
 */
export function parseCSVToRows(text: string): Record<string, string>[] {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const countSemi = (headerLine.match(/;/g) || []).length;
  const countComma = (headerLine.match(/,/g) || []).length;
  const countTab = (headerLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (countSemi > countComma && countSemi >= countTab) delimiter = ';';
  else if (countTab > countComma && countTab > countSemi) delimiter = '\t';

  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = splitLine(headerLine);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return rows;
}