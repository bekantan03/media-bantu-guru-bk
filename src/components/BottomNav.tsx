import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  MessageSquare,
  Printer,
  Menu,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Siswa } from '../types';

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenSidebar: () => void;
  siswaList?: Siswa[];
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activePage,
  onNavigate,
  onOpenSidebar,
  siswaList = [],
}) => {
  const activeSiswaAsuhCount = siswaList.filter(
    (s) => (s.status || 'aktif') === 'aktif' && s.asuh
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: LayoutDashboard,
      isPrimary: true,
      activeColor: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-500/10 dark:bg-emerald-950/60 border-emerald-300/60 dark:border-emerald-700/60',
    },
    {
      id: 'siswa',
      label: 'Siswa',
      icon: Users,
      badge: activeSiswaAsuhCount > 0 ? activeSiswaAsuhCount : undefined,
      activeColor: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-500/10 dark:bg-blue-950/60 border-blue-300/60 dark:border-blue-700/60',
    },
    {
      id: 'absensi',
      label: 'Piket',
      icon: CalendarCheck,
      activeColor: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-500/10 dark:bg-amber-950/60 border-amber-300/60 dark:border-amber-700/60',
    },
    {
      id: 'konseling',
      label: 'Konseling',
      icon: MessageSquare,
      activeColor: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-500/10 dark:bg-purple-950/60 border-purple-300/60 dark:border-purple-700/60',
    },
    {
      id: 'print_piket',
      label: 'Cetak',
      icon: Printer,
      activeColor: 'text-sky-600 dark:text-sky-400',
      activeBg: 'bg-sky-500/10 dark:bg-sky-950/60 border-sky-300/60 dark:border-sky-700/60',
    },
  ];

  return (
    <nav
      id="mobile-tablet-bottom-nav"
      aria-label="Navigasi Bawah Mobile dan Tablet"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#12241F]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#203830] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] select-none print:hidden transition-all duration-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-2xl mx-auto px-1.5 sm:px-4 py-1.5 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id || (item.id === 'print_piket' && activePage === 'laporan');
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-xl transition-all duration-150 cursor-pointer group ${
                isActive
                  ? item.activeColor
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
              }`}
            >
              {/* Active Indicator Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className={`absolute inset-0 rounded-xl -z-10 border ${item.activeBg}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative">
                <IconComponent
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? `scale-110 ${item.activeColor}` : 'group-hover:scale-105'
                  }`}
                />

                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold font-mono flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight font-semibold leading-tight ${
                  isActive ? `font-bold ${item.activeColor}` : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu button to open the full drawer sidebar */}
        <button
          onClick={onOpenSidebar}
          className="relative flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-xl text-[#647169] dark:text-gray-400 hover:text-[#1D4137] dark:hover:text-gray-200 transition-all duration-150 cursor-pointer group"
          aria-label="Buka Menu Lengkap"
        >
          <div className="relative">
            <Menu className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight font-semibold leading-tight">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
