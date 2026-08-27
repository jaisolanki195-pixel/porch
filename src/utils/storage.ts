import { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from './constants';

const STORAGE_KEY = 'fathers_radio_settings_v1';

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

export function loadSavedSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const heroImage = { ...DEFAULT_SETTINGS.heroImage, ...(parsed.heroImage || {}) };
    
    // If it was marked as stored in IndexedDB, reset customImageUrl in memory until loaded
    if (heroImage.customImageUrl === 'indexeddb://custom_hero_image') {
      heroImage.customImageUrl = null;
    }

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
      heroImage,
    };
  } catch (err) {
    console.warn('Failed to load saved settings, using default', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): boolean {
  try {
    const sanitized = sanitizeSettingsForStorage(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    console.warn('LocalStorage save failed, attempting quota cleanup', err);
    try {
      // Clear non-essential items and retry
      localStorage.removeItem(STORAGE_KEY);
      const minimalSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        rain: settings.rain,
        music: settings.music,
        appearance: settings.appearance,
        atmosphere: settings.atmosphere,
        content: settings.content,
        heroImage: {
          customImageUrl: null,
          isDefault: settings.heroImage.isDefault,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalSettings));
      return true;
    } catch (e2) {
      console.warn('Could not save settings to localStorage:', e2);
      return false;
    }
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
      heroImage: { ...DEFAULT_SETTINGS.heroImage, ...(parsed.heroImage || {}) },
    };
  } catch (err) {
    console.error('Invalid JSON file for settings import', err);
    return null;
  }
}

