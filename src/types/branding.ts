export interface AppBrandingConfig {
  appLogo: string; // Data URI (Base64) or URL path (defaults to '/logo.png')
  schoolLogo: string; // Data URI (Base64) or URL path (defaults to '/logo.png')
  appName: string; // Default: 'Media Bantu Guru'
  appTagline: string; // Default: 'BK & Kedisiplinan Siswa'
  appMotto: string; // Default: 'Membimbing • Mencerdaskan • Menginspirasi'
  schoolName: string; // Default: 'SMA Negeri 1 Alalak'
  schoolMotto: string; // Default: 'Unggul dalam Prestasi, Santun dalam Budi Pekerti'
  npsn?: string; // NPSN Sekolah
  kepsekNama?: string; // Nama Kepala Sekolah
  kepsekNip?: string; // NIP Kepala Sekolah
  guruNama?: string; // Nama Guru BK
  guruNip?: string; // NIP Guru BK
  kopInstansi: string; // Default: 'PEMERINTAH PROVINSI KALIMANTAN SELATAN\nDINAS PENDIDIKAN DAN KEBUDAYAAN'
  kopAlamat: string; // Default: 'Jl. Trans Kalimantan No. 12, Barito Kuala'
  kopSubHeader?: string; // Default: 'Bimbingan Konseling & Kedisiplinan Siswa'
  showLogoOnPrint: boolean; // default: false (hapus logo di surat / dokumen cetak)
  showBothLogosOnPrint: boolean; // default: false
  customFavicon: boolean; // default: true
}
