import React, { useState, useRef } from 'react';
import {
  X,
  Sliders,
  CloudRain,
  Music,
  Palette,
  Wind,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Upload,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  AppSettings,
  RainIntensity,
  RainSpeed,
  DropSize,
  WindIntensity,
  PlaylistLoopMode,
  ColorTheme,
} from '../types';
import { DEFAULT_SETTINGS, CURATED_PLAYLISTS, DEFAULT_HERO_IMAGE_PATH } from '../utils/constants';
import { exportSettingsAsJson, parseImportedSettings } from '../utils/storage';
import { storeCustomImageInIDB, clearCustomImageFromIDB } from '../utils/imageStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

type TabType = 'hero' | 'rain' | 'music' | 'appearance' | 'atmosphere' | 'content';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('rain');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    setUploadedPreview(null);
  };

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomImage = async () => {
    if (uploadedPreview) {
      await storeCustomImageInIDB(uploadedPreview);
      setLocalSettings((prev) => ({
        ...prev,
        heroImage: {
          customImageUrl: uploadedPreview,
          isDefault: false,
          previewUrl: uploadedPreview,
        },
      }));
    }
  };

  const handleRestoreDefaultImage = async () => {
    await clearCustomImageFromIDB();
    setUploadedPreview(null);
    setLocalSettings((prev) => ({
      ...prev,
      heroImage: {
        customImageUrl: null,
        isDefault: true,
        previewUrl: null,
      },
    }));
  };

  // Import JSON Settings
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseImportedSettings(content);
      if (parsed) {
        setLocalSettings(parsed);
      }
    };
    reader.readAsText(file);
  };

  // Theme Presets
  const applyThemePreset = (theme: ColorTheme) => {
    let accent = '#f59e0b';
    let brightness = 100;
    let contrast = 105;
    let saturation = 118;
    let overlay = 15;

    if (theme === 'monsoon') {
      accent = '#38bdf8';
      brightness = 95;
      contrast = 110;
      saturation = 125;
      overlay = 25;
    } else if (theme === 'vintage-radio') {
      accent = '#eab308';
      brightness = 105;
      contrast = 115;
      saturation = 135;
      overlay = 12;
    } else if (theme === 'evening') {
      accent = '#f97316';
      brightness = 85;
      contrast = 120;
      saturation = 110;
      overlay = 35;
    }

    setLocalSettings((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme,
        accentColor: accent,
        brightness,
        contrast,
        saturation,
        overlay,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div
        id="settings-modal-dialog"
        className="w-full max-w-3xl glass-card-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-stone-100 animate-in fade-in zoom-in-95 duration-200 border border-white/15"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white">
                Atmosphere & Radio Settings
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                Customize rain dynamics, YouTube music, visuals, and nostalgic ambience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-black/30 border-b border-white/10 overflow-x-auto scrollbar-none">
          {[
            { id: 'hero', label: 'Hero Image', icon: ImageIcon },
            { id: 'rain', label: 'Rain Physics', icon: CloudRain },
            { id: 'music', label: 'YouTube Music', icon: Music },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'atmosphere', label: 'Atmosphere', icon: Wind },
            { id: 'content', label: 'Content', icon: Type },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-yellow-500 text-black font-bold shadow-md shadow-yellow-500/20'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm">
          {/* TAB 1: HERO IMAGE */}
          {activeTab === 'hero' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Default Hero Image
                </h3>
                <p className="text-xs text-stone-400">
                  The original Father&apos;s Radio monsoon painting is the default visual identity.
                  You can also upload a custom image.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Active Preview */}
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex flex-col items-center gap-2">
                  <div className="w-full aspect-[3/4] max-h-56 rounded-lg overflow-hidden border border-stone-700/60 bg-stone-900 relative">
                    <img
                      src={
                        localSettings.heroImage.customImageUrl ||
                        uploadedPreview ||
                        DEFAULT_HERO_IMAGE_PATH
                      }
                      alt="Hero background"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] bg-black/70 backdrop-blur-xs text-stone-200 border border-stone-700">
                      {localSettings.heroImage.customImageUrl ? 'Custom Image' : 'Default Father’s Radio'}
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">Active Background</span>
                </div>

                {/* Upload & Controls */}
                <div className="space-y-3 flex flex-col justify-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center justify-center gap-2 text-xs font-semibold transition-all"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    Select / Upload New Image
                  </button>

                  {uploadedPreview && (
                    <button
                      onClick={handleApplyCustomImage}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center gap-2 text-xs transition-all shadow-md shadow-amber-500/20"
                    >
                      <Check className="w-4 h-4" />
                      Apply Selected Image
                    </button>
                  )}

                  <button
                    onClick={handleRestoreDefaultImage}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-300 border border-stone-700/60 flex items-center justify-center gap-2 text-xs transition-all"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                    Restore Default Father&apos;s Radio Image
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RAIN PHYSICS */}
          {activeTab === 'rain' && (
            <div className="space-y-5">
              {/* Master Rain Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl">
                <div>
                  <div className="font-semibold text-stone-200">Rainfall Simulation</div>
                  <div className="text-xs text-stone-400">
                    Enable real gravity-driven vertical rainfall layer
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.rain.enabled}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        rain: { ...prev.rain, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Rain Intensity */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Rain Intensity (Particle Density)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['very-light', 'light', 'medium', 'heavy'] as RainIntensity[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          rain: { ...prev.rain, intensity: mode },
                        }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all ${
                        localSettings.rain.intensity === mode
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs'
                          : 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {mode.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rain Speed */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Rain Speed (Fall Velocity)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'natural', 'fast'] as RainSpeed[]).map((speed) => (
                    <button
                      key={speed}
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          rain: { ...prev.rain, speed },
                        }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all ${
                        localSettings.rain.speed === speed
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop Size */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Drop Size (Stroke Length & Thickness)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['fine', 'natural', 'heavy'] as DropSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          rain: { ...prev.rain, dropSize: size },
                        }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all ${
                        localSettings.rain.dropSize === size
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wind Trajectory */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Wind Trajectory
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'very-light', 'light'] as WindIntensity[]).map((wind) => (
                    <button
                      key={wind}
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          rain: { ...prev.rain, wind },
                        }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all ${
                        localSettings.rain.wind === wind
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {wind.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rain Layers Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-300">Foreground Rain</span>
                  <input
                    type="checkbox"
                    checked={localSettings.rain.foregroundRain}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        rain: { ...prev.rain, foregroundRain: e.target.checked },
                      }))
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-300">Roof Drips</span>
                  <input
                    type="checkbox"
                    checked={localSettings.rain.roofDrips}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        rain: { ...prev.rain, roofDrips: e.target.checked },
                      }))
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-300">Puddle Ripples</span>
                  <input
                    type="checkbox"
                    checked={localSettings.rain.puddleRipples}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        rain: { ...prev.rain, puddleRipples: e.target.checked },
                      }))
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: YOUTUBE MUSIC */}
          {activeTab === 'music' && (
            <div className="space-y-5">
              {/* Playlist URL Config */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  YouTube Playlist URL
                </label>
                <p className="text-xs text-stone-400 mb-2">
                  Replace with any public YouTube Playlist URL or Playlist ID.
                </p>
                <input
                  type="text"
                  value={localSettings.music.playlistUrl}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      music: { ...prev.music, playlistUrl: e.target.value },
                    }))
                  }
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Curated Presets Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Or Choose from Curated 1990s Playlists
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {CURATED_PLAYLISTS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          music: { ...prev.music, playlistUrl: preset.url },
                        }))
                      }
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                        localSettings.music.playlistUrl === preset.url
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      <div className="font-semibold text-stone-200">{preset.title}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Play Next Song Toggle (Section 13 & 14) */}
              <div className="flex items-center justify-between p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl">
                <div>
                  <div className="font-semibold text-stone-200">Auto Play Next Song</div>
                  <div className="text-xs text-stone-400">
                    When song reaches the end, automatically advance and play next song in YouTube playlist
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.music.autoPlayNext}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        music: { ...prev.music, autoPlayNext: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Playlist Loop Mode (Section 15) */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Playlist Loop Behavior
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'off', label: 'Off (Stop at End)' },
                      { id: 'repeat-playlist', label: 'Repeat Playlist' },
                      { id: 'repeat-single', label: 'Repeat Current Song' },
                    ] as { id: PlaylistLoopMode; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          music: { ...prev.music, playlistLoop: item.id },
                        }))
                      }
                      className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                        localSettings.music.playlistLoop === item.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shuffle & Visualizer toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-200">Shuffle Playlist</div>
                    <div className="text-[10px] text-stone-400">Randomize track playback order</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.music.shuffle}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        music: { ...prev.music, shuffle: e.target.checked },
                      }))
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-200">Audio Visualizer</div>
                    <div className="text-[10px] text-stone-400">Display frequency bars in player</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.music.showVisualizer}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        music: { ...prev.music, showVisualizer: e.target.checked },
                      }))
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Theme Presets */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Theme Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'warm-nostalgia', label: 'Warm Nostalgia' },
                      { id: 'monsoon', label: 'Monsoon Rain' },
                      { id: 'vintage-radio', label: 'Vintage Radio' },
                      { id: 'evening', label: 'Moody Evening' },
                    ] as { id: ColorTheme; label: string }[]
                  ).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => applyThemePreset(theme.id)}
                      className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                        localSettings.appearance.theme === theme.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="flex items-center justify-between p-3 bg-stone-950/40 border border-stone-800 rounded-xl">
                <div>
                  <div className="text-xs font-medium text-stone-200">Accent Color</div>
                  <div className="text-[10px] text-stone-400">Highlights and radio glow color</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localSettings.appearance.accentColor}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, accentColor: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-stone-400 uppercase">
                    {localSettings.appearance.accentColor}
                  </span>
                </div>
              </div>

              {/* Image Sliders: Brightness, Contrast, Saturation */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-stone-300 mb-1">
                    <span>Image Brightness</span>
                    <span className="font-mono">{localSettings.appearance.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={localSettings.appearance.brightness}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          brightness: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-300 mb-1">
                    <span>Image Contrast</span>
                    <span className="font-mono">{localSettings.appearance.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={localSettings.appearance.contrast}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          contrast: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-300 mb-1">
                    <span>Image Saturation (1990s Palette)</span>
                    <span className="font-mono">{localSettings.appearance.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={localSettings.appearance.saturation}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          saturation: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-300 mb-1">
                    <span>Dark Overlay Tint</span>
                    <span className="font-mono">{localSettings.appearance.overlay}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={localSettings.appearance.overlay}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          overlay: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATMOSPHERE */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Atmospheric Motion Elements
                </h3>
                <p className="text-xs text-stone-400">
                  Enable or disable natural ambient physics and micro-animations.
                </p>
              </div>

              {/* Performance Mode Selector */}
              <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Rendering Performance Mode</div>
                    <div className="text-[10px] text-stone-400">Adapts particle physics & layers to device hardware</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(
                    [
                      { id: 'cinematic', label: 'Cinematic', desc: 'Full fidelity' },
                      { id: 'balanced', label: 'Balanced', desc: 'Smooth 60fps' },
                      { id: 'performance', label: 'Performance', desc: 'Battery saver' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          atmosphere: {
                            ...prev.atmosphere,
                            performanceMode: mode.id,
                          },
                        }))
                      }
                      className={`p-2 rounded-xl text-left border transition-all ${
                        (localSettings.atmosphere.performanceMode || 'cinematic') === mode.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="text-xs font-medium">{mode.label}</div>
                      <div className="text-[9px] opacity-75 font-mono">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'teaSteam',
                    label: 'Father’s Chai Tea Steam',
                    desc: 'Organic steam rising gently from the steel glass',
                  },
                  {
                    key: 'plantMovement',
                    label: 'Plant & Bougainvillea Monsoon Breeze',
                    desc: 'Subtle swaying of hanging potted plant and corner flowers',
                  },
                  {
                    key: 'radioAnimation',
                    label: 'Vintage Radio Speaker Vibration',
                    desc: 'Acoustic speaker vibration feedback during music playback',
                  },
                  {
                    key: 'atmosphericMist',
                    label: 'Atmospheric Monsoon Mist',
                    desc: 'Gentle low-altitude mist drifting across the courtyard fields',
                  },
                  {
                    key: 'mountainHaze',
                    label: 'Distant Mountain Rain Haze',
                    desc: 'Atmospheric depth layering over the Himalayan ridge',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-200">{item.label}</div>
                      <div className="text-[10px] text-stone-400">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        (localSettings.atmosphere as any)[item.key] ?? true
                      }
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          atmosphere: {
                            ...prev.atmosphere,
                            [item.key]: e.target.checked,
                          },
                        }))
                      }
                      className="accent-amber-400 w-4 h-4 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Website Title
                </label>
                <input
                  type="text"
                  value={localSettings.content.title}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      content: { ...prev.content, title: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={localSettings.content.subtitle}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      content: { ...prev.content, subtitle: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Playlist Panel Title
                </label>
                <input
                  type="text"
                  value={localSettings.content.playlistTitle}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      content: { ...prev.content, playlistTitle: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Nostalgic Story Text
                </label>
                <textarea
                  rows={4}
                  value={localSettings.content.storyText}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      content: { ...prev.content, storyText: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex flex-wrap items-center justify-between gap-2">
          {/* Left Actions: Export, Import, Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              title="Reset all settings to defaults"
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <button
              onClick={() => exportSettingsAsJson(localSettings)}
              title="Export configuration as JSON file"
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <input
              type="file"
              ref={importFileRef}
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              onClick={() => importFileRef.current?.click()}
              title="Import configuration JSON file"
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>

          {/* Right Actions: Cancel & Save Changes */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
