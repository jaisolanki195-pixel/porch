import React, { useState, useRef, useEffect } from 'react';
import {
  X,
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
  ShieldCheck,
  LogOut,
  Globe,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  AppSettings,
  RainIntensity,
  RainSpeed,
  DropSize,
  WindIntensity,
  ColorTheme,
} from '../types';
import { DEFAULT_SETTINGS, CURATED_PLAYLISTS, DEFAULT_HERO_IMAGE_PATH } from '../utils/constants';
import { exportSettingsAsJson, parseImportedSettings } from '../utils/storage';
import { storeCustomImageInIDB, clearCustomImageFromIDB } from '../utils/imageStorage';
import {
  signOutOwner,
  saveGlobalStationConfig,
  subscribeToOwnerAuth,
  isFirebaseConfigured,
} from '../services/firebaseAuth';
import { User } from 'firebase/auth';

interface OwnerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveOwnerSettings: (newSettings: AppSettings) => void;
}

type OwnerTabType = 'hero' | 'rain' | 'music' | 'appearance' | 'atmosphere' | 'content';

export const OwnerAdminModal: React.FC<OwnerAdminModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveOwnerSettings,
}) => {
  const [activeTab, setActiveTab] = useState<OwnerTabType>('hero');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(null);
  const [cloudErrorMessage, setCloudErrorMessage] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  // Synchronize local settings when modal opens or settings update
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  // Real-time security verification: lock out if user logs out
  useEffect(() => {
    const unsubscribe = subscribeToOwnerAuth((user, ownerFlag) => {
      setCurrentUser(user);
      if (!ownerFlag && isOpen) {
        onClose();
      }
    });
    return () => unsubscribe();
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setCloudErrorMessage(null);
    setCloudStatusMessage(null);
    setIsSavingCloud(true);

    try {
      // 1. Update local state & storage immediately
      onSaveOwnerSettings(localSettings);

      // 2. If Firebase cloud database is connected, persist globally
      if (isFirebaseConfigured && currentUser) {
        const cloudResult = await saveGlobalStationConfig(localSettings, currentUser);
        if (cloudResult.success) {
          setCloudStatusMessage('Global station configuration updated worldwide!');
        } else {
          setCloudErrorMessage(cloudResult.error || 'Failed to sync to cloud database');
        }
      } else {
        setCloudStatusMessage('Settings saved to browser session.');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setCloudStatusMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setCloudErrorMessage(msg);
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleLogout = async () => {
    await signOutOwner();
    onClose();
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    setUploadedPreview(null);
  };

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

  const applyThemePreset = (theme: ColorTheme) => {
    let accent = '#f59e0b';
    let brightness = 100;
    let contrast = 100;
    let saturation = 120;
    let overlay = 15;

    if (theme === 'monsoon') {
      accent = '#38bdf8';
      brightness = 95;
      contrast = 105;
      saturation = 125;
      overlay = 25;
    } else if (theme === 'vintage-radio') {
      accent = '#eab308';
      brightness = 105;
      contrast = 100;
      saturation = 110;
      overlay = 15;
    } else if (theme === 'evening') {
      accent = '#fbbf24';
      brightness = 90;
      contrast = 110;
      saturation = 130;
      overlay = 30;
    } else if (theme === 'warm-nostalgia') {
      accent = '#d97706';
      brightness = 100;
      contrast = 100;
      saturation = 120;
      overlay = 15;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="owner-admin-modal-dialog"
        className="w-full max-w-3xl glass-card-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-stone-100 border border-amber-500/40"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-stone-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                  🔐 Owner Settings
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Authorized Owner
                </span>
              </div>
              <p className="text-xs text-stone-400 font-sans">
                {currentUser?.email
                  ? `Signed in as ${currentUser.email}`
                  : 'Manage global station identity and official presets'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              title="Sign out of Owner Mode"
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close owner administration"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-black/40 border-b border-white/10 overflow-x-auto scrollbar-none">
          {[
            { id: 'hero', label: 'Hero Artwork', icon: ImageIcon },
            { id: 'rain', label: 'Rain Physics', icon: CloudRain },
            { id: 'music', label: 'Official Radio', icon: Music },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'atmosphere', label: 'Atmosphere', icon: Wind },
            { id: 'content', label: 'Branding & Copy', icon: Type },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as OwnerTabType)}
                className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Notification Banner */}
        {cloudStatusMessage && (
          <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{cloudStatusMessage}</span>
          </div>
        )}
        {cloudErrorMessage && (
          <div className="px-4 py-2 bg-red-950/60 border-b border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span>{cloudErrorMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm">
          {/* TAB 1: HERO IMAGE */}
          {activeTab === 'hero' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Station Hero Artwork
                </h3>
                <p className="text-xs text-stone-400">
                  The original Father&apos;s Radio monsoon painting is the default visual identity. You can upload custom artwork to replace it globally.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Default Painting Box */}
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex flex-col items-center gap-2">
                  <div className="w-full aspect-[3/4] max-h-56 rounded-lg overflow-hidden border border-stone-700/60 bg-stone-900 relative">
                    <img
                      src={DEFAULT_HERO_IMAGE_PATH}
                      alt="Father's Radio Default Hero Artwork"
                      className="w-full h-full object-cover"
                    />
                    {localSettings.heroImage.isDefault && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-stone-950 text-[10px] font-bold">
                        ACTIVE
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleRestoreDefaultImage}
                    disabled={localSettings.heroImage.isDefault}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Restore Default Artwork
                  </button>
                </div>

                {/* Custom Upload Box */}
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-stone-200 mb-1">Upload New Hero Painting</h4>
                    <p className="text-[11px] text-stone-400 mb-3">
                      Select a high-resolution painting or illustration (.jpg, .png, .webp).
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose Artwork File...</span>
                    </button>
                  </div>

                  {uploadedPreview && (
                    <div className="space-y-2">
                      <div className="w-full aspect-[3/4] max-h-36 rounded-lg overflow-hidden border border-amber-500/40 relative">
                        <img
                          src={uploadedPreview}
                          alt="Custom Upload Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={handleApplyCustomImage}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                      >
                        Apply Uploaded Artwork
                      </button>
                    </div>
                  )}

                  {!localSettings.heroImage.isDefault && localSettings.heroImage.customImageUrl && (
                    <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-[11px] text-amber-300">
                      Custom hero artwork is currently set.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RAIN PHYSICS */}
          {activeTab === 'rain' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Global Rain Physics
                </h3>
                <p className="text-xs text-stone-400">
                  Control default rainfall particle density, drop velocity, wind angle, and roof drips.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rain Intensity */}
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
                  <label className="text-xs font-semibold text-stone-300">Rain Intensity (Drop Density)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['very-light', 'light', 'medium', 'heavy'] as RainIntensity[]).map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          setLocalSettings((p) => ({ ...p, rain: { ...p.rain, intensity: val } }))
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border capitalize cursor-pointer ${
                          localSettings.rain.intensity === val
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {val.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rain Speed */}
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
                  <label className="text-xs font-semibold text-stone-300">Drop Fall Velocity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['slow', 'natural', 'fast'] as RainSpeed[]).map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          setLocalSettings((p) => ({ ...p, rain: { ...p.rain, speed: val } }))
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border capitalize cursor-pointer ${
                          localSettings.rain.speed === val
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wind Intensity */}
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
                  <label className="text-xs font-semibold text-stone-300">Wind Slant & Drift</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['none', 'very-light', 'light'] as WindIntensity[]).map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          setLocalSettings((p) => ({ ...p, rain: { ...p.rain, wind: val } }))
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border capitalize cursor-pointer ${
                          localSettings.rain.wind === val
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {val.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drop Size */}
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
                  <label className="text-xs font-semibold text-stone-300">Droplet Thickness</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fine', 'natural', 'heavy'] as DropSize[]).map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          setLocalSettings((p) => ({ ...p, rain: { ...p.rain, dropSize: val } }))
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border capitalize cursor-pointer ${
                          localSettings.rain.dropSize === val
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roof Drip & Ripple toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-200">Roofline Dripping Particles</div>
                    <div className="text-[10px] text-stone-400">Spawn vertical eaves dripping drops</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.rain.roofDrips}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        rain: { ...p.rain, roofDrips: e.target.checked },
                      }))
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-200">Puddle Ripples</div>
                    <div className="text-[10px] text-stone-400">Simulate rain impact water ripples</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.rain.puddleRipples}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        rain: { ...p.rain, puddleRipples: e.target.checked },
                      }))
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL RADIO & PLAYLISTS */}
          {activeTab === 'music' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Official Radio & Broadcast Source
                </h3>
                <p className="text-xs text-stone-400">
                  Configure default YouTube playlist IDs, shuffle defaults, and curated station catalogs.
                </p>
              </div>

              <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl space-y-3">
                <label className="text-xs font-semibold text-stone-300">Default YouTube Playlist URL or ID</label>
                <input
                  type="text"
                  value={localSettings.music.playlistUrl}
                  onChange={(e) =>
                    setLocalSettings((p) => ({
                      ...p,
                      music: { ...p.music, playlistUrl: e.target.value },
                    }))
                  }
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="w-full py-2 px-3 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* Curated Official Playlists Catalog */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300">Quick Select Official Preset</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CURATED_PLAYLISTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        setLocalSettings((p) => ({
                          ...p,
                          music: { ...p.music, playlistUrl: item.id },
                          content: { ...p.content, playlistTitle: item.title },
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        localSettings.music.playlistUrl.includes(item.id)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Music className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                      <div>
                        <div className="text-xs font-semibold text-stone-200">{item.title}</div>
                        <div className="text-[10px] text-stone-400">{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE & THEMES */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Color Themes & Visual Filters
                </h3>
                <p className="text-xs text-stone-400">
                  Select color palette presets or fine-tune image brightness, saturation, and contrast.
                </p>
              </div>

              {/* Theme presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(
                  [
                    { id: 'monsoon', label: 'Monsoon Blue', color: '#38bdf8' },
                    { id: 'vintage-radio', label: 'Vintage Gold', color: '#eab308' },
                    { id: 'evening', label: 'Rainy Evening', color: '#fbbf24' },
                    { id: 'warm-nostalgia', label: 'Warm Nostalgia', color: '#d97706' },
                  ] as const
                ).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => applyThemePreset(theme.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      localSettings.appearance.theme === theme.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-xs">{theme.label}</span>
                  </button>
                ))}
              </div>

              {/* Accent Color Input */}
              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-200">Custom Accent Color</div>
                  <div className="text-[10px] text-stone-400">HEX color applied to glowing dials and icons</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localSettings.appearance.accentColor}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        appearance: { ...p.appearance, accentColor: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-stone-300">
                    {localSettings.appearance.accentColor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATMOSPHERE */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Atmospheric Simulation Layers
                </h3>
                <p className="text-xs text-stone-400">
                  Toggle fine environmental details like tea steam, foliage movement, mist, and ambient motion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'teaSteam', label: 'Chai Tea Steam', desc: 'Rising steam wisps from cutting glass' },
                  { key: 'plantMovement', label: 'Plant Movement', desc: 'Wind swaying balcony plants' },
                  { key: 'radioAnimation', label: 'Radio Glow & Indicator', desc: 'Ambient dial luminescence' },
                  { key: 'atmosphericMist', label: 'Atmospheric Mist', desc: 'Floating misty rain vapor particles' },
                  { key: 'mountainHaze', label: 'Mountain Haze', desc: 'Distant monsoon mountain depth blur' },
                  { key: 'ambientMotion', label: 'Ambient Camera Motion', desc: 'Gentle handheld camera drift' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-medium text-stone-200">{item.label}</div>
                      <div className="text-[10px] text-stone-400">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        Boolean(
                          localSettings.atmosphere[
                            item.key as keyof typeof localSettings.atmosphere
                          ]
                        )
                      }
                      onChange={(e) =>
                        setLocalSettings((p) => ({
                          ...p,
                          atmosphere: {
                            ...p.atmosphere,
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

          {/* TAB 6: BRANDING & COPY */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Station Branding & Nostalgic Story
                </h3>
                <p className="text-xs text-stone-400">
                  Customize the title, broadcast subtitle, and narrative text.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300">Station Title</label>
                  <input
                    type="text"
                    value={localSettings.content.title}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        content: { ...p.content, title: e.target.value },
                      }))
                    }
                    className="w-full py-2 px-3 mt-1 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300">Station Subtitle</label>
                  <input
                    type="text"
                    value={localSettings.content.subtitle}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        content: { ...p.content, subtitle: e.target.value },
                      }))
                    }
                    className="w-full py-2 px-3 mt-1 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300">Nostalgic Story / Narrative</label>
                  <textarea
                    rows={4}
                    value={localSettings.content.storyText}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        content: { ...p.content, storyText: e.target.value },
                      }))
                    }
                    className="w-full py-2 px-3 mt-1 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetDefaults}
              title="Reset all settings to defaults"
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <button
              onClick={() => exportSettingsAsJson(localSettings)}
              title="Export configuration as JSON file"
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSavingCloud}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSavingCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Owner Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
