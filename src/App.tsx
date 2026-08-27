import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppSettings,
  PlayerStatus,
  PlaylistItem,
  MusicSettings,
} from './types';
import { DEFAULT_SETTINGS, DEFAULT_HERO_IMAGE_PATH } from './utils/constants';
import { loadSavedSettings, saveSettings } from './utils/storage';
import { RainCanvas } from './components/RainCanvas';
import { AtmosphericEffects } from './components/AtmosphericEffects';
import { YouTubeEngine, YouTubeControls } from './components/YouTubeEngine';
import { RadioPlayer } from './components/RadioPlayer';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { SettingsModal } from './components/SettingsModal';
import { StoryCard } from './components/StoryCard';
import defaultHeroImage from './assets/images/fathers_radio_hero_1787766051238.jpg';
import { getCustomImageFromIDB } from './utils/imageStorage';

export default function App() {
  // 1. App State & Settings loaded from LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => loadSavedSettings());
  const [isPlaylistDrawerOpen, setIsPlaylistDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load custom image from IndexedDB on startup if custom was selected
  useEffect(() => {
    async function loadCustomImage() {
      if (!settings.heroImage.isDefault && !settings.heroImage.customImageUrl) {
        const idbImage = await getCustomImageFromIDB();
        if (idbImage) {
          setSettings((prev) => ({
            ...prev,
            heroImage: {
              ...prev.heroImage,
              customImageUrl: idbImage,
              previewUrl: idbImage,
            },
          }));
        }
      }
    }
    loadCustomImage();
  }, []);

  // 2. Playlist & Player state
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistItem[]>([]);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentIndex: 0,
    totalTracks: 0,
    trackTitle: 'Father’s Radio — Nostalgic 90s Melodies',
    author: 'Transistor Monsoons',
    isBuffering: false,
    isReady: false,
    error: null,
    playlist: [],
  });

  // 3. YouTube Player Controls Reference & State
  const [playerControls, setPlayerControls] = useState<YouTubeControls | null>(null);
  const playerControlsRef = useRef<YouTubeControls | null>(null);

  const handlePlayerRefCallback = useCallback((controls: YouTubeControls) => {
    playerControlsRef.current = controls;
    setPlayerControls(controls);
  }, []);

  // Save settings whenever they change
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Helper to partially update music settings
  const handleUpdateMusicSettings = (partial: Partial<MusicSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        music: { ...prev.music, ...partial },
      };
      saveSettings(updated);
      return updated;
    });
  };

  // Quick toggle rain
  const handleToggleRain = () => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        rain: { ...prev.rain, enabled: !prev.rain.enabled },
      };
      saveSettings(updated);
      return updated;
    });
  };

  // Select track from drawer
  const handleSelectTrack = (index: number) => {
    const controls = playerControls || playerControlsRef.current;
    if (controls) {
      controls.playIndex(index);
    }
  };

  // Select a curated 1990s playlist preset
  const handleSelectCuratedPlaylist = (url: string) => {
    handleUpdateMusicSettings({ playlistUrl: url });
    const controls = playerControls || playerControlsRef.current;
    if (controls) {
      controls.reloadPlaylist(url);
    }
  };

  // Reset to default curated playlist on error
  const handleResetToCuratedPlaylist = () => {
    const defaultUrl = DEFAULT_SETTINGS.music.playlistUrl;
    handleUpdateMusicSettings({ playlistUrl: defaultUrl });
    const controls = playerControls || playerControlsRef.current;
    if (controls) {
      controls.reloadPlaylist(defaultUrl);
    }
  };

  // Compute CSS filter string for hero image
  const imageFilterStyle = {
    filter: `brightness(${settings.appearance.brightness}%) contrast(${settings.appearance.contrast}%) saturate(${settings.appearance.saturation}%)`,
  };

  // Determine active background image source
  const activeImageSrc =
    settings.heroImage.customImageUrl || defaultHeroImage || DEFAULT_HERO_IMAGE_PATH;

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-stone-950 text-stone-100 font-sans">
      {/* -------------------------------------------------------------
          LAYER 1: HERO / BACKGROUND IMAGE (Static Base Layer)
          Preserving the vibrant 1990s Indian nostalgic color palette
      -------------------------------------------------------------- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          id="hero-background-image"
          src={activeImageSrc}
          alt="Father and son listening to transistor radio on monsoon porch"
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
          style={imageFilterStyle}
          referrerPolicy="no-referrer"
        />

        {/* Ambient Dark Overlay Tint (Configurable in Settings) */}
        <div
          className="absolute inset-0 bg-stone-950 pointer-events-none transition-opacity duration-300"
          style={{ opacity: settings.appearance.overlay / 100 }}
        />

        {/* Vignette Edge Shading for Cinematic Atmosphere */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(0,0,0,0.65)_100%] pointer-events-none" />
      </div>

      {/* -------------------------------------------------------------
          LAYER 2: ATMOSPHERIC MICRO-EFFECTS
          Tea Steam, Plant Breeze, Radio Glow, Mountain Mist
      -------------------------------------------------------------- */}
      <AtmosphericEffects
        atmosphere={settings.atmosphere}
        playerStatus={playerStatus}
        windLevel={settings.rain.wind}
      />

      {/* -------------------------------------------------------------
          LAYER 3: REAL ANIMATED RAIN ENGINE (TOP -> BOTTOM)
          Multi-depth layers (bg, mid, fg), roof drips & puddle ripples
      -------------------------------------------------------------- */}
      <RainCanvas settings={settings.rain} />

      {/* -------------------------------------------------------------
          LAYER 4: YOUTUBE ENGINE (Hidden IFrame Player API)
          Synchronized real playback, Auto-Next on ENDED, loop modes
      -------------------------------------------------------------- */}
      <YouTubeEngine
        musicSettings={settings.music}
        onStatusChange={setPlayerStatus}
        onPlaylistLoaded={setPlaylistTracks}
        playerRefCallback={handlePlayerRefCallback}
      />

      {/* -------------------------------------------------------------
          LAYER 5: UI & NOSTALGIC STORY HEADER CARD & FLOATING CONTROLS
      -------------------------------------------------------------- */}
      {/* Top Floating Glass Quick Controls */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 sm:gap-3 z-40">
        <button
          id="top-settings-pill-btn"
          onClick={() => setIsSettingsOpen(true)}
          className="px-3.5 sm:px-4 py-2 glass-card rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-widest text-stone-200 hover:text-yellow-400 hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Settings
        </button>

        <button
          id="top-atmosphere-pill-btn"
          onClick={() => {
            setIsSettingsOpen(true);
          }}
          className="px-3.5 sm:px-4 py-2 glass-card rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-widest text-stone-200 hover:text-yellow-400 hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          Atmosphere
        </button>
      </div>

      {/* Main Header & Story Card */}
      <header className="relative z-30 p-4 sm:p-6 md:p-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <StoryCard
          content={settings.content}
          isPlaying={playerStatus.isPlaying}
          errorMessage={playerStatus.error}
          onResetToCuratedPlaylist={handleResetToCuratedPlaylist}
          accentColor={settings.appearance.accentColor}
        />
      </header>

      {/* Left-Side Vertical HUD Rain Level Gauge (from Immersive UI) */}
      <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col items-center gap-4 z-30 pointer-events-none select-none animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-2">
          <div className="w-1.5 h-16 bg-white/20 rounded-full overflow-hidden p-0.5 backdrop-blur-xs flex flex-col justify-end">
            <div
              className="w-full bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)] transition-all duration-500"
              style={{
                height: !settings.rain.enabled
                  ? '0%'
                  : settings.rain.intensity === 'very-light'
                  ? '25%'
                  : settings.rain.intensity === 'light'
                  ? '50%'
                  : settings.rain.intensity === 'medium'
                  ? '75%'
                  : '100%',
              }}
            />
          </div>
          <span
            className="text-[9px] uppercase font-mono tracking-widest text-stone-300/70"
            style={{ writingMode: 'vertical-rl' }}
          >
            Rain Level
          </span>
        </div>
      </div>

      {/* Bottom-Left Atmospheric Status Badge (from Immersive UI) */}
      <div className="hidden lg:flex absolute bottom-24 left-8 z-20 flex-col gap-2 pointer-events-none select-none">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-200">
            Monsoon Playlist Active
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span
            className={`w-2 h-2 rounded-full ${
              settings.music.shuffle ? 'bg-yellow-400' : 'bg-white/30'
            }`}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-300">
            Shuffle: {settings.music.shuffle ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          LAYER 6: VINTAGE RADIO PLAYER & CONTROL BAR
      -------------------------------------------------------------- */}
      <RadioPlayer
        playerStatus={playerStatus}
        musicSettings={settings.music}
        controls={playerControls || playerControlsRef.current}
        accentColor={settings.appearance.accentColor}
        onUpdateMusicSettings={handleUpdateMusicSettings}
        onTogglePlaylist={() => setIsPlaylistDrawerOpen(!isPlaylistDrawerOpen)}
        onToggleSettings={() => setIsSettingsOpen(true)}
        onToggleRain={handleToggleRain}
        isRainEnabled={settings.rain.enabled}
      />

      {/* -------------------------------------------------------------
          LAYER 7: PLAYLIST DRAWER
      -------------------------------------------------------------- */}
      <PlaylistDrawer
        isOpen={isPlaylistDrawerOpen}
        onClose={() => setIsPlaylistDrawerOpen(false)}
        playlistTracks={playlistTracks}
        playerStatus={playerStatus}
        currentPlaylistUrl={settings.music.playlistUrl}
        onSelectTrack={handleSelectTrack}
        onSelectCuratedPlaylist={handleSelectCuratedPlaylist}
        playlistTitle={settings.content.playlistTitle}
      />

      {/* -------------------------------------------------------------
          LAYER 8: SETTINGS MODAL
      -------------------------------------------------------------- */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </main>
  );
}
