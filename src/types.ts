export type RainIntensity = 'very-light' | 'light' | 'medium' | 'heavy';
export type RainSpeed = 'slow' | 'natural' | 'fast';
export type DropSize = 'fine' | 'natural' | 'heavy';
export type WindIntensity = 'none' | 'very-light' | 'light';

export type PlaylistLoopMode = 'off' | 'repeat-playlist' | 'repeat-single';
export type ColorTheme = 'warm-nostalgia' | 'monsoon' | 'vintage-radio' | 'evening';

export interface RainSettings {
  enabled: boolean;
  intensity: RainIntensity;
  speed: RainSpeed;
  dropSize: DropSize;
  foregroundRain: boolean;
  roofDrips: boolean;
  puddleRipples: boolean;
  wind: WindIntensity;
}

export interface MusicSettings {
  playlistUrl: string;
  autoPlayNext: boolean;
  playlistLoop: PlaylistLoopMode;
  shuffle: boolean;
  volume: number;
  showVisualizer: boolean;
  showPlaylist: boolean;
  autoStart: boolean;
}

export interface AppearanceSettings {
  theme: ColorTheme;
  accentColor: string;
  brightness: number; // 50 - 150 (100 is default)
  contrast: number;   // 50 - 150 (100 is default)
  saturation: number; // 50 - 200 (120 is default for vibrant 90s look)
  overlay: number;    // 0 - 80 (% opacity)
  glassBlur: number;  // 0 - 30 (px)
  glassTransparency: number; // 10 - 90 (%)
}

export interface AtmosphereSettings {
  teaSteam: boolean;
  plantMovement: boolean;
  radioAnimation: boolean;
  atmosphericMist: boolean;
  mountainHaze: boolean;
  ambientMotion: boolean;
}

export interface ContentSettings {
  title: string;
  subtitle: string;
  playlistTitle: string;
  storyText: string;
}

export interface HeroImageSettings {
  customImageUrl: string | null;
  isDefault: boolean;
  previewUrl?: string | null;
}

export interface AppSettings {
  rain: RainSettings;
  music: MusicSettings;
  appearance: AppearanceSettings;
  atmosphere: AtmosphereSettings;
  content: ContentSettings;
  heroImage: HeroImageSettings;
}

export interface PlaylistItem {
  id: string;
  title: string;
  author?: string;
  duration?: number;
  index: number;
}

export interface PlayerStatus {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentIndex: number;
  totalTracks: number;
  trackTitle: string;
  author: string;
  isBuffering: boolean;
  isReady: boolean;
  error: string | null;
  playlist: string[];
}
