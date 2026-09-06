import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Search,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  Clock,
  Palette,
  Sparkles,
  Sliders,
  Image as ImageIcon,
} from 'lucide-react';
import { UserAccount, UserRole, UserStatus, PageKey } from '../types';
import { uid, initials, todayISO } from '../lib/storage';
import { Modal } from '../components/Modal';
import { getStoredHeaderConfig, HEADER_PRESETS } from '../lib/headerTheme';

interface UsersViewProps {
  currentUser: UserAccount | null;
  users: UserAccount[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onNavigate: (page: PageKey) => void;
  showToast?: (message: string) => void;
  onOpenHeaderCustomizer?: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  currentUser,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onNavigate,
  showToast,
  onOpenHeaderCustomizer
}) => {
  // Access Control Guard
  const isAdmin = currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'semua' | UserRole>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | UserStatus>('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('guru');
  const [formStatus, setFormStatus] = useState<UserStatus>('aktif');
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm Delete State
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-[#1D4137] dark:text-[#6EE7B7]">
            Akses Ditolak (Khusus Administrator)
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
            Halaman Kelola Pengguna hanya dapat diakses oleh akun dengan role <strong>Administrator</strong>. Akun Anda terdaftar sebagai <strong>Guru BK</strong>.
          </p>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl text-xs transition-all shadow-md inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Utama</span>
        </button>
      </div>
    );
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormNama('');
    setFormNip('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('guru');
    setFormStatus('aktif');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (u: UserAccount) => {
    setEditingUser(u);
    setFormNama(u.nama);
    setFormNip(u.nip || '');
    setFormUsername(u.username);
    setFormPassword(''); // Empty means don't change
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nama = formNama.trim();
    const nip = formNip.trim();
    const username = formUsername.trim().toLowerCase();
    const password = formPassword.trim();

    if (!nama || !username) {
      setFormError('Nama lengkap dan Username wajib diisi.');
      return;
    }

    if (!editingUser && !password) {
      setFormError('Kata sandi wajib diisi untuk akun baru.');
      return;
    }

    // Check duplicate username
    const duplicate = users.find(
      (u) => u.username.toLowerCase() === username && u.id !== editingUser?.id
    );
    if (duplicate) {
      setFormError('Username tersebut sudah digunakan oleh akun lain.');
      return;
    }

    if (editingUser) {
      // Update existing
      const updated: UserAccount = {
        ...editingUser,
        nama,
        nip: nip || undefined,
        username,
        role: formRole,
        status: formStatus,
        password: password ? password : editingUser.password,
      };
      onUpdateUser(updated);
      if (showToast) showToast(`Akun ${nama} berhasil diperbarui`);
    } else {
      // Create new
      const newUser: UserAccount = {
        id: `u-${uid()}`,
        nama,
        nip: nip || undefined,
        username,
        password,
        role: formRole,
        status: formStatus,
        createdAt: todayISO(),
      };
      onAddUser(newUser);
      if (showToast) showToast(`Akun pengguna ${nama} berhasil dibuat`);
    }
    setIsModalOpen(false);
  };

  // Toggle User Status Quick Action
  const handleToggleStatus = (u: UserAccount) => {
    if (u.id === currentUser?.id) {
      if (showToast) showToast('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }
    const newStatus: UserStatus = u.status === 'aktif' ? 'nonaktif' : 'aktif';
    const updated: UserAccount = { ...u, status: newStatus };
    onUpdateUser(updated);
    if (showToast)
      showToast(
        `Status akun ${u.nama} diubah menjadi ${newStatus.toUpperCase()}`
      );
  };

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === currentUser?.id) {
      if (showToast) showToast('Anda tidak dapat menghapus akun Anda sendiri.');
      setDeleteTarget(null);
      return;
    }
    onDeleteUser(deleteTarget.id);
    if (showToast) showToast(`Akun ${deleteTarget.nama} berhasil dihapus.`);
    setDeleteTarget(null);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.nip && u.nip.includes(search));
    const matchesRole = roleFilter === 'semua' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'semua' || u.status === statusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  // Summary Metrics
  const totalUsers = users.length;
  const totalAdmin = users.filter((u) => u.role === 'admin').length;
  const totalGuru = users.filter((u) => u.role === 'guru').length;
  const totalNonaktif = users.filter((u) => u.status === 'nonaktif').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[#1D4137] to-[#2D5F52] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Panel Hak Akses Administrator</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Kelola Akun Pengguna &amp; Guru BK
          </h1>
          <p className="text-xs text-emerald-100/80 max-w-xl">
            Tambah akun guru baru, atur role administrator/guru, perbarui profil, dan kontrol status aktif pengguna aplikasi.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('branding')}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
          >
            <ImageIcon className="w-4 h-4 text-emerald-300" />
            <span>Upload Logo &amp; Identitas</span>
          </button>
          {onOpenHeaderCustomizer && (
            <button
              onClick={onOpenHeaderCustomizer}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
            >
              <Palette className="w-4 h-4 text-amber-300" />
              <span>Edit Latar Header</span>
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#C9862E] hover:bg-[#b07323] text-white font-bold rounded-2xl text-xs transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Akun Pengguna</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Action: Branding Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/25 via-emerald-900/20 to-teal-950/20 dark:from-[#13251F] dark:to-[#172E27] border border-emerald-600/30 dark:border-emerald-500/30 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#1D4137] text-white flex items-center justify-center shadow-md shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#1D4137] dark:text-[#6EE7B7]">
                Upload Logo Sekolah &amp; Logo Aplikasi
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Fitur Admin
              </span>
            </div>
            <p className="text-xs text-[#647169] dark:text-gray-300 mt-0.5">
              Unggah logo resmi sekolah (PNG transparan), logo aplikasi Media Bantu Guru, serta atur nama instansi pada kop dokumen cetak.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('branding')}
          className="w-full md:w-auto px-4 py-2.5 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Buka Menu Upload Logo</span>
        </button>
      </div>

      {/* Admin Quick Action: Header & Visual Customization Card */}
      {onOpenHeaderCustomizer && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/30 via-emerald-900/20 to-amber-950/20 dark:from-[#13251F] dark:to-[#1D2B23] border border-emerald-600/30 dark:border-emerald-500/30 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-[#C9862E] text-white flex items-center justify-center shadow-md shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#1D4137] dark:text-[#6EE7B7]">
                  Pengaturan Latar Belakang &amp; Banner Header
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Fitur Admin
                </span>
              </div>
              <p className="text-xs text-[#647169] dark:text-gray-300 mt-0.5">
                Ubah warna gradien, pola geometris, unggah gambar/banner sekolah, dan atur identitas nama sekolah pada bilah atas.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenHeaderCustomizer}
            className="w-full md:w-auto px-4 py-2.5 bg-[#2D5F52] hover:bg-[#1D4137] dark:bg-[#6EE7B7] dark:hover:bg-[#58D3A2] text-white dark:text-[#0D201B] font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Sliders className="w-4 h-4" />
            <span>Buka Panel Edit Header</span>
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Total Pengguna</p>
            <p className="text-2xl font-bold font-serif text-[#1D4137] dark:text-[#6EE7B7] mt-1">{totalUsers}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Tercatat di database</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1D4137] dark:text-[#6EE7B7] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Administrator</p>
            <p className="text-2xl font-bold font-serif text-amber-700 dark:text-amber-400 mt-1">{totalAdmin}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Hak akses penuh</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Guru BK</p>
            <p className="text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-400 mt-1">{totalGuru}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Akses Operasional BK</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Akun Nonaktif</p>
            <p className="text-2xl font-bold font-serif text-rose-700 dark:text-rose-400 mt-1">{totalNonaktif}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Akses diblokir sementara</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama, username, atau NIP..."
              className="w-full pl-9 pr-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs text-[#1D4137] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            />
          </div>
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            >
              <option value="semua">Semua Role</option>
              <option value="admin">Administrator</option>
              <option value="guru">Guru BK</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-semibold text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Status Aktif</option>
              <option value="nonaktif">Status Nonaktif</option>
              <option value="menunggu">Menunggu Approve</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white dark:bg-[#1A2E27] border border-[#D9E0D4] dark:border-[#2D483F] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D9E0D4] dark:border-[#2D483F] bg-[#F7F9F6] dark:bg-[#142520] flex items-center justify-between">
          <h3 className="font-bold text-xs text-[#1D4137] dark:text-[#6EE7B7]">
            Daftar Akun Pengguna ({filteredUsers.length})
          </h3>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            *Akun yang Anda gunakan saat ini diberi penanda khusus
          </span>
        </div>
        {filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <UserX className="w-8 h-8 mx-auto text-gray-300" />
            <p>Tidak ada pengguna yang cocok dengan kriteria pencarian/filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#EFF2EA]/50 dark:bg-[#12211C] text-[#1D4137] dark:text-gray-300 font-bold border-b border-[#D9E0D4] dark:border-[#2D483F]">
                  <th className="p-3.5 pl-5">Pengguna &amp; NIP</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Role (Hak Akses)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Tgl Dibuat</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                      {/* Name & NIP */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            }`}
                          >
                            {initials(u.nama)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1D4137] dark:text-gray-100">
                                {u.nama}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded-full">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                              {u.nip ? `NIP: ${u.nip}` : 'NIP: -'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="p-3.5">
                        <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          @{u.username}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-[10px] font-bold rounded-full">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold rounded-full">
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            Guru BK
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {u.status === 'aktif' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Aktif
                          </span>
                        ) : u.status === 'menunggu' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold rounded-full">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Menunggu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold rounded-full">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="p-3.5 text-gray-500 dark:text-gray-400 text-[11px]">
                        {u.createdAt || '-'}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Approve (Khusus Status Menunggu) */}
                          {u.status === 'menunggu' && (
                            <button
                              onClick={() => {
                                onUpdateUser({ ...u, status: 'aktif' });
                                if (showToast) showToast(`Akun ${u.nama} berhasil di-approve.`);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 dark:text-emerald-200 dark:border-emerald-700 transition-colors"
                              title="Approve Pendaftaran"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Toggle Status Button (Khusus Status Aktif/Nonaktif) */}
                          {u.status !== 'menunggu' && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isCurrent}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                u.status === 'aktif'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                              title={
                                isCurrent
                                  ? 'Tidak bisa mengubah status sendiri'
                                  : u.status === 'aktif'
                                  ? 'Nonaktifkan Akun'
                                  : 'Aktifkan Akun'
                              }
                            >
                              {u.status === 'aktif' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Edit User Button */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-colors"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User Button */}
                          <button
                            onClick={() => setDeleteTarget(u)}
                            disabled={isCurrent}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              isCurrent
                                ? 'Tidak bisa menghapus akun sendiri'
                                : 'Hapus Akun Pengguna'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Data Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">
              Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: Dra. Haryanti, M.Pd."
              className="w-full px-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs text-[#1D4137] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">
                NIP / NIK (Opsional)
              </label>
              <input
                type="text"
                value={formNip}
                onChange={(e) => setFormNip(e.target.value)}
                placeholder="19850..."
                className="w-full px-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs text-[#1D4137] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="Contoh: haryanti.bk"
                className="w-full px-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs text-[#1D4137] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">
              Kata Sandi {editingUser ? '(Kosongkan jika tidak ingin mengubah)' : <span className="text-rose-500">*</span>}
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? 'Ketik kata sandi baru...' : 'Masukkan kata sandi...'}
                className="w-full pl-9 pr-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs text-[#1D4137] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">
                Role (Hak Akses)
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              >
                <option value="guru">Guru BK (Layanan BK Operasional)</option>
                <option value="admin">Administrator (Hak Akses Penuh + Kelola User)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#1D4137] dark:text-gray-200 mb-1">
                Status Akun
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 bg-[#F7F9F6] dark:bg-[#12211C] border border-[#D9E0D4] dark:border-[#2D483F] rounded-xl text-xs font-bold text-[#1D4137] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F52]"
              >
                <option value="aktif">Aktif (Bisa Login)</option>
                <option value="nonaktif">Nonaktif (Akses Diblokir)</option>
                <option value="menunggu">Menunggu Approve</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2D5F52] hover:bg-[#1D4137] text-white font-bold rounded-xl transition-all shadow-md"
            >
              {editingUser ? 'Simpan Perubahan' : 'Buat Akun Pengguna'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Akun"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun <strong>{deleteTarget?.nama}</strong> (@{deleteTarget?.username}) secara permanen?
          </p>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-[11px]">
            Tindakan ini tidak dapat dibatalkan. Pengguna ini tidak akan bisa login lagi ke dalam sistem.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-md"
            >
              Ya, Hapus Akun
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};