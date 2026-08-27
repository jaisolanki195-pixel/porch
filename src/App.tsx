import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppSettings,
  PlayerStatus,
  PlaylistItem,
  MusicSettings,
} from './types';
import { DEFAULT_SETTINGS, DEFAULT_HERO_IMAGE_PATH } from './utils/constants';
import {
  loadSavedSettings,
  saveSettings,
  saveOwnerSettings,
  loadHeroImageSettings,
  saveHeroImageSettings,
} from './utils/storage';
import { RainCanvas } from './components/RainCanvas';
import { AtmosphericEffects } from './components/AtmosphericEffects';
import { YouTubeEngine, YouTubeControls } from './components/YouTubeEngine';
import { RadioPlayer } from './components/RadioPlayer';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { SettingsModal } from './components/SettingsModal';
import { OwnerAdminModal } from './components/OwnerAdminModal';
import { StoryCard } from './components/StoryCard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import defaultHeroImage from './assets/images/fathers_radio_hero_1787766051238.jpg';
import { getCustomImageFromIDB } from './utils/imageStorage';
import {
  subscribeToOwnerAuth,
  subscribeToGlobalStationConfig,
} from './services/firebaseAuth';

export default function App() {
  // 1. App State & Settings loaded from LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => loadSavedSettings());
  // Hero Image state is maintained separately to guarantee absolute stability across unrelated setting changes
  const [heroImage, setHeroImage] = useState(() => loadHeroImageSettings());
  const [isPlaylistDrawerOpen, setIsPlaylistDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(false);

  // Subscribe to real-time owner authentication
  useEffect(() => {
    const unsubscribe = subscribeToOwnerAuth((user, isOwner) => {
      setIsOwnerAuthenticated(isOwner);
      if (!isOwner) {
        setIsOwnerModalOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to global cloud configuration (real-time broadcast across all visitors)
  useEffect(() => {
    const unsubscribe = subscribeToGlobalStationConfig((cloudConfig) => {
      if (cloudConfig) {
        setSettings((prev) => {
          const merged: AppSettings = {
            ...prev,
            appearance: cloudConfig.appearance ? { ...prev.appearance, ...cloudConfig.appearance } : prev.appearance,
            atmosphere: cloudConfig.atmosphere ? { ...prev.atmosphere, ...cloudConfig.atmosphere } : prev.atmosphere,
            content: cloudConfig.content ? { ...prev.content, ...cloudConfig.content } : prev.content,
          };
          if (cloudConfig.heroImage) {
            merged.heroImage = {
              ...prev.heroImage,
              ...cloudConfig.heroImage,
            };
            setHeroImage(merged.heroImage);
          }
          return merged;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Load custom image from IndexedDB on startup if custom was selected
  useEffect(() => {
    let isMounted = true;
    async function loadCustomImage() {
      if (!heroImage.isDefault) {
        if (!heroImage.customImageUrl || heroImage.customImageUrl === 'indexeddb://custom_hero_image') {
          const idbImage = await getCustomImageFromIDB();
          if (isMounted && idbImage) {
            setHeroImage({
              customImageUrl: idbImage,
              isDefault: false,
              previewUrl: idbImage,
            });
            setSettings((prev) => ({
              ...prev,
              heroImage: {
                customImageUrl: idbImage,
                isDefault: false,
                previewUrl: idbImage,
              },
            }));
          }
        }
      }
    }
    loadCustomImage();
    return () => {
      isMounted = false;
    };
  }, [heroImage.isDefault]);

  // 2. Playlist & Player state
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistItem[]>([]);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    isPlaying: false,
    playbackState: 'idle',
    currentTime: 0,
    duration: 0,
    currentIndex: 0,
    totalTracks: 0,
    trackTitle: 'Father’s Radio — Nostalgic 90s Melodies',
    author: 'Transistor Monsoons',
    isBuffering: false,
    isReady: false,
    tuningMessage: null,
    error: null,
    isEntirePlaylistUnplayable: false,
    needsUserGesture: false,
    playlist: [],
  });

  // 3. YouTube Player Controls Reference & State
  const [playerControls, setPlayerControls] = useState<YouTubeControls | null>(null);
  const playerControlsRef = useRef<YouTubeControls | null>(null);

  const handlePlayerRefCallback = useCallback((controls: YouTubeControls) => {
    playerControlsRef.current = controls;
    setPlayerControls(controls);
  }, []);

  // Save visitor settings whenever they change (strictly preserves hero image)
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings((prev) => ({
      ...newSettings,
      heroImage: prev.heroImage,
    }));
    saveSettings(newSettings);
  };

  // Save owner configuration
  const handleSaveOwnerSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (newSettings.heroImage) {
      setHeroImage(newSettings.heroImage);
      saveHeroImageSettings(newSettings.heroImage);
    }
    saveOwnerSettings(newSettings);
    setImageLoadError(false);
  };

  // Helper to partially update music settings
  const handleUpdateMusicSettings = useCallback((partial: Partial<MusicSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        music: { ...prev.music, ...partial },
      };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Quick toggle rain
  const handleToggleRain = useCallback(() => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        rain: { ...prev.rain, enabled: !prev.rain.enabled },
      };
      saveSettings(updated);
      return updated;
    });
  }, []);

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

  // Calculate Active Hero Image URL
  const activeHeroImageUrl =
    !heroImage.isDefault && heroImage.customImageUrl && !imageLoadError
      ? heroImage.customImageUrl
      : defaultHeroImage;

  return (
    <ErrorBoundary>
      <main className="relative w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 select-none font-sans">
        {/* Loading Screen Overlay */}
        <LoadingScreen />

        {/* -------------------------------------------------------------
            LAYER 1: IMMERSIVE BACKGROUND & HERO ARTWORK
        -------------------------------------------------------------- */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            id="hero-background-artwork"
            src={activeHeroImageUrl}
            alt="Father's Radio Monsoon Hero Painting"
            onError={() => {
              console.warn("Custom hero image failed to load, falling back to original painting");
              setImageLoadError(true);
            }}
            className={`w-full h-full object-cover object-center transform scale-105 transition-all duration-700 ${
              settings.atmosphere.ambientMotion && !settings.visitorPreferences?.reducedMotion
                ? 'animate-camera-drift'
                : ''
            }`}
            style={{
              filter: `brightness(${settings.appearance.brightness}%) contrast(${settings.appearance.contrast}%) saturate(${settings.appearance.saturation}%)`,
            }}
          />

          {/* Color Tint / Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-colors duration-500"
            style={{
              backgroundColor: settings.appearance.theme === 'monsoon'
                ? 'rgba(12, 74, 110, 0.25)'
                : settings.appearance.theme === 'vintage-radio'
                ? 'rgba(120, 53, 15, 0.15)'
                : settings.appearance.theme === 'evening'
                ? 'rgba(67, 20, 7, 0.35)'
                : 'rgba(115, 65, 0, 0.25)',
              opacity: settings.appearance.overlay / 100,
            }}
          />

          {/* Vignette Gradient */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80 pointer-events-none" />

          {/* Film Grain Texture */}
          {!settings.visitorPreferences?.reducedMotion && (
            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-repeat bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          )}
        </div>

        {/* -------------------------------------------------------------
            LAYER 2: MONSOON RAIN CANVAS ENGINE
        -------------------------------------------------------------- */}
        <RainCanvas
          settings={settings.rain}
          performanceMode={settings.atmosphere.performanceMode}
        />

        {/* -------------------------------------------------------------
            LAYER 3: ATMOSPHERIC PARTICLES & LIGHTING PULSE
        -------------------------------------------------------------- */}
        <AtmosphericEffects
          atmosphere={settings.atmosphere}
          playerStatus={playerStatus}
          windLevel={settings.rain.wind}
        />

        {/* -------------------------------------------------------------
            LAYER 4: AUDIO / YOUTUBE ENGINE (HIDDEN IFRAME)
        -------------------------------------------------------------- */}
        <YouTubeEngine
          musicSettings={settings.music}
          onStatusChange={setPlayerStatus}
          onPlaylistLoaded={setPlaylistTracks}
          playerRefCallback={handlePlayerRefCallback}
        />

        {/* -------------------------------------------------------------
            LAYER 5: VINTAGE NOSTALGIC CARD & DIAL OVERLAY
        -------------------------------------------------------------- */}
        <header className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-auto">
          <StoryCard
            content={settings.content}
            isPlaying={playerStatus.isPlaying}
            errorMessage={playerStatus.error}
            tuningMessage={playerStatus.tuningMessage}
            isEntirePlaylistUnplayable={playerStatus.isEntirePlaylistUnplayable}
            accentColor={settings.appearance.accentColor}
          />
        </header>

        {/* Right Corner: Aesthetic Rain Barometer Indicator */}
        <div className="hidden md:flex absolute top-6 right-6 z-20 flex-col items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              {settings.rain.enabled ? settings.rain.intensity.replace('-', ' ') : 'Rain Off'}
            </span>
            <div className="w-1.5 h-16 bg-white/10 rounded-full overflow-hidden relative">
              <div
                className="w-full bg-sky-400 rounded-full absolute bottom-0 transition-all duration-500 shadow-[0_0_8px_#38bdf8]"
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

        {/* Bottom-Left Atmospheric Status Badge */}
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
            LAYER 8: PUBLIC VISITOR SETTINGS MODAL
        -------------------------------------------------------------- */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onOpenOwnerAdmin={() => setIsOwnerModalOpen(true)}
        />

        {/* -------------------------------------------------------------
            LAYER 9: OWNER ADMINISTRATION MODAL (RESTRICTED TO AUTHENTICATED OWNER)
        -------------------------------------------------------------- */}
        {isOwnerAuthenticated && isOwnerModalOpen && (
          <OwnerAdminModal
            isOpen={isOwnerModalOpen}
            onClose={() => setIsOwnerModalOpen(false)}
            settings={settings}
            onSaveOwnerSettings={handleSaveOwnerSettings}
          />
        )}
      </main>
    </ErrorBoundary>
  );
}
