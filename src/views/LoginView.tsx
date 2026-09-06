import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount } from '../types';
import { uid, todayISO } from '../lib/storage';
import { useBranding } from '../lib/branding';
import kalselHeritageBg from '../assets/images/kalsel_heritage_bg_1788531476330.jpg';
import sasiranganPattern from '../assets/images/sasirangan_pattern_1788531504140.jpg';
import {
  SasiranganRibbon,
  KalselCornerOrnament,
  RumahBanjarGraphic,
} from '../components/KalselAccents';

interface LoginViewProps {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
  onRegisterUser: (newUser: UserAccount) => void;
  showToast?: (message: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLogin,
  onRegisterUser,
  showToast,
}) => {
  const { branding } = useBranding();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login Form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form state
  const [regNama, setRegNama] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUsername = loginUsername.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError('Harap isi username dan kata sandi.');
      return;
    }

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
    );

    if (!foundUser) {
      setLoginError('Username atau kata sandi tidak cocok. Silakan coba lagi.');
      return;
    }

    if (foundUser.status === 'nonaktif') {
      setLoginError('Akun ini dalam status NONAKTIF. Harap hubungi Administrator BK.');
      return;
    }

    if (foundUser.status === 'menunggu') {
      setLoginError('Akun Anda masih MENUNGGU PERSETUJUAN Administrator.');
      return;
    }

    if (showToast) showToast(`Selamat datang kembali, ${foundUser.nama}!`);
    onLogin(foundUser);
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const nama = regNama.trim();
    const nip = regNip.trim();
    const username = regUsername.trim().toLowerCase();
    const password = regPassword.trim();

    if (!nama || !username || !password) {
      setRegError('Harap lengkapi semua bidang bertanda (*).');
      return;
    }

    if (username.length < 3) {
      setRegError('Username minimal 3 karakter.');
      return;
    }

    if (password.length < 4) {
      setRegError('Kata sandi minimal 4 karakter.');
      return;
    }

    if (password !== regConfirmPassword.trim()) {
      setRegError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const exists = users.some((u) => u.username.toLowerCase() === username);
    if (exists) {
      setRegError('Username tersebut sudah digunakan.');
      return;
    }

    const newUser: UserAccount = {
      id: `u-${uid()}`,
      username,
      password,
      nama,
      role: 'guru',
      status: 'menunggu',
      nip: nip || undefined,
      createdAt: todayISO(),
    };

    onRegisterUser(newUser);

    setRegSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Administrator.');
    if (showToast) showToast('Pendaftaran sukses. Menunggu approve Admin.');
  };

  return (
    <div className="min-h-screen bg-[#0E1F1A] text-gray-100 flex flex-col items-center justify-center p-3 sm:p-4 transition-colors relative overflow-x-hidden">
      {/* Gambar Latar Belakang Penuh */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
        style={{ backgroundImage: `url(${kalselHeritageBg})` }}
      />
      {/* Overlay Gradasi Halus */}
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-[#091512]/95 via-[#0E1F1A]/85 to-[#17382F]/90 pointer-events-none" />

      {/* Kartu Login: Ukuran Sedang, Pas di Layar, Gambar & Ilustrasi Lengkap */}
      <div className="relative z-10 w-full max-w-[760px] rounded-2xl shadow-2xl overflow-hidden border border-[#2D5F52]/60 bg-[#142621] flex flex-col md:flex-row my-auto">
        {/* Ornamen Sudut Artistik */}
        <KalselCornerOrnament position="top-left" className="absolute top-1 left-1 z-20 opacity-70" />
        <KalselCornerOrnament position="bottom-right" className="absolute bottom-1 right-1 z-20 opacity-70" />

        {/* ================= KOLOM KIRI: PANEL GAMBAR & ILUSTRASI ================= */}
        <div className="relative md:w-[42%] p-4 sm:p-5 md:p-6 flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-[#244A3F]/70">
          {/* Latar Belakang Gambar Kolom */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{ backgroundImage: `url(${kalselHeritageBg})` }}
          />
          {/* Aksen Latar Pola Kain Sasirangan */}
          <div
            className="absolute inset-0 opacity-15 mix-blend-soft-light bg-repeat"
            style={{ backgroundImage: `url(${sasiranganPattern})`, backgroundSize: '160px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#142D26]/90 via-[#193A31]/95 to-[#0E201B]/95 pointer-events-none" />

          {/* Konten Atas: Logo & Nama Aplikasi */}
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-xl bg-white/95 p-1 border border-amber-400/60 shadow-md shrink-0 flex items-center justify-center">
                <img
                  src={branding.appLogo}
                  alt={branding.appName || 'Logo Media Bantu Guru'}
                  className="w-full h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-serif font-bold text-base sm:text-lg leading-snug text-white tracking-wide truncate">
                  {branding.appName || 'Media Bantu Guru'}
                </h1>
                <p className="text-[11px] text-emerald-300/85 truncate">
                  Bimbingan &amp; Kedisiplinan Siswa
                </p>
              </div>
            </div>

            {/* Pita Motif Halus */}
            <SasiranganRibbon className="h-1.5 rounded-full opacity-80" />
          </div>

          {/* Konten Tengah: Ilustrasi Rumah Banjar Artistik - Ditampilkan di Tablet & Desktop */}
          <div className="hidden md:flex relative z-10 py-3 my-auto flex-col items-center justify-center">
            <RumahBanjarGraphic className="scale-95 sm:scale-100 drop-shadow-lg" />
          </div>

          {/* Konten Bawah: Identitas Ringkas Aplikasi - Ditampilkan di Tablet & Desktop */}
          <div className="hidden md:block relative z-10 pt-2 border-t border-emerald-800/40 text-center">
            <p className="text-[11px] text-emerald-300/70 font-medium">
              Sistem Bimbingan &amp; Kedisiplinan Siswa
            </p>
          </div>
        </div>

        {/* ================= KOLOM KANAN: FORM LOGIN & REGISTER ================= */}
        <div className="relative md:w-[58%] p-4 sm:p-5 md:p-6 flex flex-col justify-center bg-[#162B25]/90">
          {/* Switcher Tab Ringkas */}
          <div className="flex items-center p-1 bg-[#0E1E19] rounded-xl border border-[#2D5F52]/60 mb-4">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'login'
                  ? 'bg-[#244E43] text-white shadow-xs font-bold border border-emerald-600/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'register'
                  ? 'bg-[#244E43] text-white shadow-xs font-bold border border-emerald-600/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>Daftar Akun</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onSubmit={handleLoginSubmit}
                className="space-y-3"
              >
                {loginError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block font-medium text-emerald-200 mb-1">
                      Username
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-emerald-400/60 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Masukkan username Anda"
                        className="w-full pl-9 pr-3 py-2 bg-[#0E1E19] border border-[#2D5F52] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-emerald-200 mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-emerald-400/60 absolute left-3 pointer-events-none" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        className="w-full pl-9 pr-9 py-2 bg-[#0E1E19] border border-[#2D5F52] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute right-3 text-gray-400 hover:text-white cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-[#C9862E] via-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-[#142D26] font-bold rounded-lg transition-all shadow-md hover:shadow-lg text-xs mt-1 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk ke Sistem</span>
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-2.5"
              >
                {regError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-600/60 rounded-lg text-emerald-200 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block font-medium text-emerald-200 mb-0.5">
                      Nama Lengkap Guru <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      placeholder="Nama lengkap beserta gelar"
                      className="w-full px-3 py-1.5 bg-[#0E1E19] border border-[#2D5F52] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-emerald-200 mb-0.5">
                        NIP (Opsional)
                      </label>
                      <input
                        type="text"
                        value={regNip}
                        onChange={(e) => setRegNip(e.target.value)}
                        placeholder="NIP"
                        className="w-full px-2.5 py-1.5 bg-[#0E1E19] border border-[#2D5F52] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-emerald-200 mb-0.5">
                        Username <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full px-2.5 py-1.5 bg-[#0E1E19] border border-[#2D5F52] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-emerald-200 mb-0.5">
                        Sandi <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 4 kar"
                          className="w-full pl-2.5 pr-7 py-1.5 bg-[#0E1E19] border border-[#2D5F52] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((prev) => !prev)}
                          className="absolute right-2 text-gray-400 hover:text-white cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium text-emerald-200 mb-0.5">
                        Ulangi Sandi <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi"
                        className="w-full px-2.5 py-1.5 bg-[#0E1E19] border border-[#2D5F52] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-emerald-950/40 border border-emerald-700/40 rounded-lg text-[10.5px] text-emerald-300">
                  Akun baru akan aktif setelah disetujui Administrator BK.
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-[#C9862E] via-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-[#142D26] font-bold rounded-lg transition-all shadow-md hover:shadow-lg text-xs mt-1 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar Akun Guru</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
