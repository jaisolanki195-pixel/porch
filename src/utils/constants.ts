import { AppSettings } from '../types';

export const DEFAULT_HERO_IMAGE_PATH = '/default_hero.jpg';

export const CURATED_PLAYLISTS = [
  {
    id: 'PL9bw4s5Ag3rU0Lp4F6-6Pq0a_sK_8jG6U',
    title: '90s Monsoon Nostalgia & Golden Melodies',
    description: 'Timeless melodies of rain, memories, and peaceful afternoon radio',
    url: 'https://www.youtube.com/playlist?list=PL9bw4s5Ag3rU0Lp4F6-6Pq0a_sK_8jG6U',
    fallbackTracks: [
      { id: '1k8craCGpgs', title: 'Rim Jhim Gire Saawan (Classic Monsoon)', author: 'Kishore Kumar' },
      { id: 'rU_8PqQ8l_E', title: 'Ek Ladki Ko Dekha Toh Aisa Laga (1994)', author: 'Kumar Sanu' },
      { id: 't4mB6Gk_u6Y', title: 'Pehla Nasha (Vintage Memories)', author: 'Udit Narayan & Sadhana Sargam' },
      { id: 'K_9tX4O8Kvg', title: 'Roop Tera Mastana (Porch Radio Version)', author: 'Kishore Kumar' },
      { id: 'Jv_3T7g8GkY', title: 'Tujhe Dekha Toh Yeh Jaana Sanam (1995)', author: 'Kumar Sanu & Lata Mangeshkar' },
      { id: 'D7v9B0j0F4U', title: 'Tip Tip Barsa Paani (Rain Nostalgia)', author: 'Alka Yagnik & Udit Narayan' },
    ]
  },
  {
    id: 'PL15B6C341961448B9',
    title: 'Evergreen 90s Radio & Cassette Classics',
    description: 'Golden era songs that played on every transistor radio on Sunday mornings',
    url: 'https://www.youtube.com/playlist?list=PL15B6C341961448B9',
    fallbackTracks: [
      { id: 'h78gC0T3x_8', title: 'Chura Ke Dil Mera (90s Retro)', author: 'Kumar Sanu & Alka Yagnik' },
      { id: 'u0k9L3R8G4Y', title: 'Baazigar O Baazigar', author: 'Kumar Sanu & Alka Yagnik' },
      { id: 'o8T3Q9uK_4k', title: 'Dheere Dheere Se Meri Zindagi Mein Aana', author: 'Kumar Sanu & Anuradha Paudwal' },
      { id: 'p7K8U9r2G1M', title: 'Do Dil Mil Rahe Hain (Pardes)', author: 'Kumar Sanu' },
    ]
  },
  {
    id: 'PLRBp0Fe2Gpgn_hS9Gg8j1n4iY34cZ5W6V',
    title: 'Peaceful Indian Acoustic & Ragas for Rainy Days',
    description: 'Soothing instrumental sitar, bansuri flute and rain ambience',
    url: 'https://www.youtube.com/playlist?list=PLRBp0Fe2Gpgn_hS9Gg8j1n4iY34cZ5W6V',
    fallbackTracks: [
      { id: 'g3k7T9oQ1vE', title: 'Raag Megh — Monsoon Sitar Melodies', author: 'Classical Ensemble' },
      { id: 'v7T4oP9kL2R', title: 'Bansuri Meditation in the Rain', author: 'Indian Flute Heritage' },
      { id: 'b8K1uQ4G9zX', title: 'Raga Malhar — Showers of Serenity', author: 'Heritage Master' },
    ]
  }
];

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
