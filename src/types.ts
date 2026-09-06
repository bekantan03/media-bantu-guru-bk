export type JkType = 'L' | 'P';
export type StatusSiswaType = 'aktif' | 'berhenti' | 'pindah' | 'keluar';
export type JenisKasusType = 'ringan' | 'sedang' | 'berat';
export type StatusKasusType = 'baru' | 'proses' | 'selesai';
export type StatusAbsensiType = 'hadir' | 'sakit' | 'izin' | 'alpa';
export type JenisKonselingType = 'individu' | 'kelompok' | 'klasikal';
export type UserStatus = 'aktif' | 'nonaktif' | 'menunggu';

export interface Siswa {
  id: string;
  nama: string;
  nis?: string;
  kelas?: string;
  jk?: JkType;
  alamat?: string;
  ortu?: string;
  hp?: string;
  catatan?: string;
  asuh?: boolean;
  status?: StatusSiswaType;
}

export interface Kasus {
  id: string;
  siswaId: string;
  tanggal: string;
  jenis: JenisKasusType;
  poin: number;
  deskripsi: string;
  tindakLanjut?: string;
  status: StatusKasusType;
}

export interface Konseling {
  id: string;
  siswaId?: string;
  siswaNama?: string;
  tanggal: string;
  jam?: string;
  jenis: JenisKonselingType;
  topik: string;
  catatan?: string;
  tindakLanjut?: string;
}

export interface Jadwal {
  id: string;
  tanggal: string;
  jam?: string;
  kegiatan: string;
  sasaran?: string;
  tempat?: string;
  catatan?: string;
  selesai: boolean;
}

export interface Terlambat {
  id: string;
  siswaId: string;
  tanggal: string;
  jam?: string;
  menit?: number | string;
  keterangan?: string;
}

export interface Absensi {
  id: string;
  siswaId: string;
  tanggal: string;
  status: StatusAbsensiType;
  keterangan?: string;
}

export interface KelasItem {
  id: string;
  nama: string;
}

export type UserRole = 'admin' | 'guru';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: UserRole;
  status: UserStatus;
  nip?: string;
  createdAt?: string;
}

export type PageKey =
  | 'dashboard'
  | 'siswa'
  | 'siswa_keluar'
  | 'absensi'
  | 'kasus'
  | 'terlambat'
  | 'konseling'
  | 'jadwal'
  | 'print_piket'
  | 'laporan'
  | 'users'
  | 'branding';

export interface RouteState {
  page: PageKey;
  params: {
    id?: string;
    tab?: 'kasus' | 'konseling' | 'terlambat';
    asuh?: string;
    kelas?: string;
    tanggal?: string;
    mode?: 'catatan' | 'rekap';
    jenis?: 'bulan' | 'semester' | 'tahun';
    bulan?: string;
    ta?: number;
    semester?: 'ganjil' | 'genap';
    format?: 'matriks' | 'bulanan';
    month?: string;
  };
}

export * from './types/header';
export * from './types/branding';
