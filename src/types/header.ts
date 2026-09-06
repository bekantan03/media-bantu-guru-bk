export type HeaderPattern =
  | 'none'
  | 'dots'
  | 'grid'
  | 'diagonal'
  | 'waves'
  | 'batik'
  | 'sasirangan'
  | 'hexagons'
  | 'sparkles'
  | 'mesh';

export type HeaderThemeType = 'preset' | 'custom_color' | 'custom_gradient' | 'image';

export type HeaderLayoutMode = 'standard' | 'banner';

export interface HeaderPreset {
  id: string;
  name: string;
  category: 'Khas Sekolah' | 'Gradien Modern' | 'Elegan & Tenang' | 'Warna Berani';
  bgLight: string; // CSS background for light mode
  bgDark: string; // CSS background for dark mode
  textColor: 'light' | 'dark' | 'auto';
  accentColor: string;
  borderColor: string;
  description: string;
  pattern?: HeaderPattern;
}

export interface HeaderCustomConfig {
  type: HeaderThemeType;
  presetId: string;
  customColor1: string;
  customColor2: string;
  gradientDirection: 'to-r' | 'to-br' | 'to-b' | 'to-tr' | 'to-l';
  pattern: HeaderPattern;
  patternOpacity: number; // 0.02 - 0.5
  imageUrl: string;
  imageFit: 'cover' | 'contain' | 'tile';
  overlayOpacity: number; // 0.0 - 0.9
  overlayColor: string; // '#000000', '#1D4137', '#FFFFFF', etc.
  textColorMode: 'auto' | 'light' | 'dark';
  layoutMode: HeaderLayoutMode;
  schoolName: string;
  schoolMotto: string;
  showSchoolName: boolean;
  showLiveClock: boolean;
  showQuickStats: boolean;
  blurEffect: boolean;
  glassmorphism: boolean;
}
