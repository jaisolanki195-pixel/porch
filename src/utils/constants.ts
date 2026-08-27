import { AppSettings, VisitorPreferences } from '../types';

export const DEFAULT_HERO_IMAGE_PATH = '/default_hero.jpg';

export const CURATED_PLAYLISTS = [
  {
    id: 'PL9bw4s5Ag3rU0Lp4F6-6Pq0a_sK_8jG6U',
    title: '90s Monsoon Nostalgia & Golden Melodies',
    description: 'Timeless melodies of rain, memories, and peaceful afternoon radio',
    url: 'https://www.youtube.com/playlist?list=PL9bw4s5Ag3rU0Lp4F6-6Pq0a_sK_8jG6U',
  }
];

export const DEFAULT_VISITOR_PREFERENCES: VisitorPreferences = {
  volume: 75,
  shuffle: false,
  autoPlayNext: true,
  playlistLoop: 'repeat-playlist',
  performanceMode: 'cinematic',
  rainEnabled: true,
  showVisualizer: true,
  reducedMotion: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  rain: {
    enabled: true,
    intensity: 'medium',
    speed: 'natural',
    dropSize: 'fine',
    foregroundRain: true,
    roofDrips: true,
    puddleRipples: true,
    wind: 'very-light',
  },
  music: {
    playlistUrl: 'https://www.youtube.com/playlist?list=PL9bw4s5Ag3rU0Lp4F6-6Pq0a_sK_8jG6U',
    autoPlayNext: true,
    playlistLoop: 'repeat-playlist',
    shuffle: false,
    volume: 75,
    showVisualizer: true,
    showPlaylist: false,
    autoStart: false,
  },
  appearance: {
    theme: 'warm-nostalgia',
    accentColor: '#f59e0b', // warm amber
    brightness: 100,
    contrast: 105,
    saturation: 118,
    overlay: 15,
    glassBlur: 16,
    glassTransparency: 35,
  },
  atmosphere: {
    teaSteam: true,
    plantMovement: true,
    radioAnimation: true,
    atmosphericMist: true,
    mountainHaze: true,
    ambientMotion: true,
    performanceMode: 'cinematic',
  },
  content: {
    title: "Father's Radio",
    subtitle: "Some songs don't just play. They bring back a time.",
    playlistTitle: "Songs He Used To Listen To",
    storyText: "On humid monsoon afternoons in the 1990s, the village verandah turned into our entire world. While dark clouds gathered over distant green hills, Father sat in his weathered cane chair, sipping hot cutting chai from steel glasses. The heavy drops drumming on terracotta tiles blended with the crackle of the battery-powered radio tuning into Vividh Bharati. Some songs don't just play—they hold the rain, the petrichor, and the voice of a time that never truly left.",
  },
  heroImage: {
    customImageUrl: null,
    isDefault: true,
    previewUrl: null,
  }
};
