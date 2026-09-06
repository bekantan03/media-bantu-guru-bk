import React, { useEffect, useState } from 'react';
import kalselBanuaPanorama from '../assets/images/kalsel_banua_panorama_1788537768915.jpg';
import sasiranganPattern from '../assets/images/sasirangan_pattern_1788531504140.jpg';

export type BackdropIntensity = 'subtle' | 'vibrant' | 'minimal';

interface KalselBodyBackdropProps {
  isDark?: boolean;
}

export const KalselBodyBackdrop: React.FC<KalselBodyBackdropProps> = ({ isDark = false }) => {
  const [intensity, setIntensity] = useState<BackdropIntensity>(() => {
    try {
      const saved = localStorage.getItem('kalsel_backdrop_intensity');
      if (saved === 'vibrant' || saved === 'minimal' || saved === 'subtle') return saved;
    } catch {}
    return 'subtle';
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kalsel_backdrop_intensity' && e.newValue) {
        if (e.newValue === 'vibrant' || e.newValue === 'minimal' || e.newValue === 'subtle') {
          setIntensity(e.newValue as BackdropIntensity);
        }
      }
    };
    const handleCustom = (e: CustomEvent<BackdropIntensity>) => {
      if (e.detail) setIntensity(e.detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('kalsel_intensity_change' as any, handleCustom as any);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kalsel_intensity_change' as any, handleCustom as any);
    };
  }, []);

  // Opacity and styling based on intensity and dark mode
  const getPanoramaOpacity = () => {
    if (intensity === 'minimal') return isDark ? 'opacity-10' : 'opacity-[0.07]';
    if (intensity === 'vibrant') return isDark ? 'opacity-35' : 'opacity-28';
    return isDark ? 'opacity-20' : 'opacity-[0.16]'; // default 'subtle'
  };

  return (
    <div
      id="kalsel-body-backdrop-container"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Main Scenic Panorama Image: Pasar Terapung Lok Baintan, Sungai Martapura & Rumah Banjar */}
      <div
        className={`absolute inset-0 bg-cover bg-top sm:bg-center transition-opacity duration-700 ease-in-out transform scale-[1.02] ${getPanoramaOpacity()}`}
        style={{
          backgroundImage: `url(${kalselBanuaPanorama})`,
          backgroundAttachment: 'fixed',
          filter: intensity === 'vibrant' ? 'saturate(1.15)' : 'saturate(0.95)',
        }}
      />

      {/* 2. Authentic Sasirangan Traditional Motif Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] mix-blend-overlay bg-repeat transition-opacity duration-500"
        style={{
          backgroundImage: `url(${sasiranganPattern})`,
          backgroundSize: '240px 240px',
        }}
      />

      {/* 3. Smooth Vignette & Gradient Mask to guarantee pristine card legibility & contrast */}
      {isDark ? (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1613]/90 via-[#0B1613]/80 to-[#08120F]/95 mix-blend-multiply" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-[#F8FAFC]/85 to-[#F1F5F9]/90 mix-blend-soft-light" />
      )}

      {/* 4. Subtle Ambient Light Glow in Kalimantan Gold (Intan Martapura warmth) */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-300/15 dark:bg-amber-500/5 blur-3xl" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-3xl" />

      {/* 5. Traditional Banjar Sasirangan Geometric Border Accents (Subtle top & bottom) */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#142E27] via-[#C9862E] via-[#2D5F52] via-[#F59E0B] to-[#142E27] opacity-85 shadow-sm" />
    </div>
  );
};
