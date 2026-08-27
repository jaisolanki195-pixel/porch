import { AppSettings, VisitorPreferences, HeroImageSettings } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_VISITOR_PREFERENCES } from './constants';

const VISITOR_PREFS_KEY = 'fathers_radio_visitor_prefs_v1';
const OWNER_CONFIG_KEY = 'fathers_radio_owner_config_v1';
const HERO_IMAGE_KEY = 'fathers_radio_hero_image_config_v2';

// Strip huge base64 strings before writing to localStorage
function sanitizeSettingsForStorage(settings: AppSettings): AppSettings {
  const sanitized = JSON.parse(JSON.stringify(settings));
  // If customImageUrl is a large base64 string, don't store it in localStorage
  if (
    sanitized.heroImage?.customImageUrl &&
    sanitized.heroImage.customImageUrl.startsWith('data:')
  ) {
    sanitized.heroImage.customImageUrl = 'indexeddb://custom_hero_image';
    sanitized.heroImage.previewUrl = undefined;
  }
  return sanitized;
}

function clampNumber(val: any, min: number, max: number, fallback: number): number {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

/**
 * Load dedicated Hero Image configuration.
 */
export function loadHeroImageSettings(): HeroImageSettings {
  try {
    const raw = localStorage.getItem(HERO_IMAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          customImageUrl: parsed.customImageUrl || null,
          isDefault: typeof parsed.isDefault === 'boolean' ? parsed.isDefault : true,
          previewUrl: parsed.previewUrl || null,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load hero image settings:', err);
  }
  return DEFAULT_SETTINGS.heroImage;
}

/**
 * Save dedicated Hero Image configuration.
 */
export function saveHeroImageSettings(heroImage: HeroImageSettings): void {
  try {
    const sanitized = {
      isDefault: heroImage.isDefault,
      customImageUrl: heroImage.customImageUrl?.startsWith('data:')
        ? 'indexeddb://custom_hero_image'
        : heroImage.customImageUrl,
      previewUrl: undefined,
    };
    localStorage.setItem(HERO_IMAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.warn('Failed to save hero image settings:', err);
  }
}

/**
 * Load visitor-local playback and performance preferences.
 * These are specific to this visitor's browser and do not modify canonical site configuration.
 */
export function loadVisitorPreferences(): VisitorPreferences {
  try {
    const raw = localStorage.getItem(VISITOR_PREFS_KEY);
    if (!raw) return DEFAULT_VISITOR_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      volume: clampNumber(parsed.volume, 0, 100, DEFAULT_VISITOR_PREFERENCES.volume),
      shuffle: typeof parsed.shuffle === 'boolean' ? parsed.shuffle : DEFAULT_VISITOR_PREFERENCES.shuffle,
      autoPlayNext: typeof parsed.autoPlayNext === 'boolean' ? parsed.autoPlayNext : DEFAULT_VISITOR_PREFERENCES.autoPlayNext,
      playlistLoop: ['off', 'repeat-playlist', 'repeat-single'].includes(parsed.playlistLoop)
        ? parsed.playlistLoop
        : DEFAULT_VISITOR_PREFERENCES.playlistLoop,
      performanceMode: ['cinematic', 'balanced', 'performance'].includes(parsed.performanceMode)
        ? parsed.performanceMode
        : DEFAULT_VISITOR_PREFERENCES.performanceMode,
      rainEnabled: typeof parsed.rainEnabled === 'boolean' ? parsed.rainEnabled : DEFAULT_VISITOR_PREFERENCES.rainEnabled,
      showVisualizer: typeof parsed.showVisualizer === 'boolean' ? parsed.showVisualizer : DEFAULT_VISITOR_PREFERENCES.showVisualizer,
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_VISITOR_PREFERENCES.reducedMotion,
    };
  } catch (err) {
    console.warn('Failed to load visitor preferences, using defaults', err);
    return DEFAULT_VISITOR_PREFERENCES;
  }
}

/**
 * Save visitor-local preferences to localStorage.
 */
export function saveVisitorPreferences(prefs: Partial<VisitorPreferences>): void {
  try {
    const existing = loadVisitorPreferences();
    const merged: VisitorPreferences = { ...existing, ...prefs };
    localStorage.setItem(VISITOR_PREFS_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('Could not save visitor preferences to localStorage:', err);
  }
}

/**
 * Load canonical settings combined with visitor preferences.
 */
export function loadSavedSettings(): AppSettings {
  try {
    const visitorPrefs = loadVisitorPreferences();
    const heroImage = loadHeroImageSettings();
    let baseSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      heroImage,
    };

    const rawOwner = localStorage.getItem(OWNER_CONFIG_KEY);
    if (rawOwner) {
      try {
        const parsed = JSON.parse(rawOwner);
        baseSettings = {
          rain: { ...DEFAULT_SETTINGS.rain, ...(parsed.rain || {}) },
          music: { ...DEFAULT_SETTINGS.music, ...(parsed.music || {}) },
          appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed.appearance || {}) },
          atmosphere: { ...DEFAULT_SETTINGS.atmosphere, ...(parsed.atmosphere || {}) },
          content: { ...DEFAULT_SETTINGS.content, ...(parsed.content || {}) },
          heroImage,
        };
      } catch (e) {
        console.warn('Could not parse owner configuration, using defaults', e);
      }
    }

    // Apply visitor preferences over base settings for dynamic session playback
    return {
      ...baseSettings,
      rain: {
        ...baseSettings.rain,
        enabled: visitorPrefs.rainEnabled,
      },
      music: {
        ...baseSettings.music,
        volume: visitorPrefs.volume,
        shuffle: visitorPrefs.shuffle,
        autoPlayNext: visitorPrefs.autoPlayNext,
        playlistLoop: visitorPrefs.playlistLoop,
        showVisualizer: visitorPrefs.showVisualizer,
      },
      atmosphere: {
        ...baseSettings.atmosphere,
        performanceMode: visitorPrefs.performanceMode,
      },
      heroImage,
      visitorPreferences: visitorPrefs,
    };
  } catch (err) {
    console.warn('Failed to load saved settings, using default', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings. If called from visitor controls, only visitor preferences are stored.
 */
export function saveSettings(settings: AppSettings): boolean {
  try {
    // Persist visitor preferences separately
    saveVisitorPreferences({
      volume: settings.music.volume,
      shuffle: settings.music.shuffle,
      autoPlayNext: settings.music.autoPlayNext,
      playlistLoop: settings.music.playlistLoop,
      showVisualizer: settings.music.showVisualizer,
      rainEnabled: settings.rain.enabled,
      performanceMode: settings.atmosphere.performanceMode,
      reducedMotion: settings.visitorPreferences?.reducedMotion ?? false,
    });
    return true;
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
    return false;
  }
}

/**
 * Owner-only configuration persistence.
 */
export function saveOwnerSettings(settings: AppSettings): boolean {
  try {
    if (settings.heroImage) {
      saveHeroImageSettings(settings.heroImage);
    }
    const sanitized = sanitizeSettingsForStorage(settings);
    localStorage.setItem(OWNER_CONFIG_KEY, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    console.warn('Could not save owner settings:', err);
    return false;
  }
}

export function exportSettingsAsJson(settings: AppSettings) {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fathers_radio_settings_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export settings', err);
  }
}

export function parseImportedSettings(jsonString: string): AppSettings | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return null;

    const appearance = {
      ...DEFAULT_SETTINGS.appearance,
      ...(parsed.appearance || {}),
      brightness: clampNumber(parsed.appearance?.brightness, 50, 150, DEFAULT_SETTINGS.appearance.brightness),
      contrast: clampNumber(parsed.appearance?.contrast, 50, 150, DEFAULT_SETTINGS.appearance.contrast),
      saturation: clampNumber(parsed.appearance?.saturation, 50, 200, DEFAULT_SETTINGS.appearance.saturation),
      overlay: clampNumber(parsed.appearance?.overlay, 0, 80, DEFAULT_SETTINGS.appearance.overlay),
    };

    const music = {
      ...DEFAULT_SETTINGS.music,
      ...(parsed.music || {}),
      volume: clampNumber(parsed.music?.volume, 0, 100, DEFAULT_SETTINGS.music.volume),
    };

    const atmosphere = {
      ...DEFAULT_SETTINGS.atmosphere,
      ...(parsed.atmosphere || {}),
      performanceMode: ['cinematic', 'balanced', 'performance'].includes(parsed.atmosphere?.performanceMode)
        ? parsed.atmosphere.performanceMode
        : DEFAULT_SETTINGS.atmosphere.performanceMode,
    };

    return {
      rain: { ...DEFAULT_SETTINGS.rain, ...(parsed.rain || {}) },
      music,
      appearance,
      atmosphere,
      content: { ...DEFAULT_SETTINGS.content, ...(parsed.content || {}) },
      heroImage: parsed.heroImage
        ? { ...DEFAULT_SETTINGS.heroImage, ...parsed.heroImage }
        : loadHeroImageSettings(),
    };
  } catch (err) {
    console.error('Invalid JSON file for settings import', err);
    return null;
  }
}

