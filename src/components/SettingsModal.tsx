import React from 'react';
import { PublicSettingsModal } from './PublicSettingsModal';
import { AppSettings, VisitorPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onUpdateVisitorPreferences?: (prefs: Partial<VisitorPreferences>) => void;
  onOpenOwnerAdmin: () => void;
}

/**
 * Public Settings Modal Wrapper:
 * Provides clean access to visitor playback/device preferences
 * and integrates the verified Google Owner Access authentication entry point.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onUpdateVisitorPreferences,
  onOpenOwnerAdmin,
}) => {
  const currentPreferences: VisitorPreferences = {
    volume: settings.music.volume,
    shuffle: settings.music.shuffle,
    autoPlayNext: settings.music.autoPlayNext,
    playlistLoop: settings.music.playlistLoop,
    performanceMode: settings.atmosphere.performanceMode,
    rainEnabled: settings.rain.enabled,
    showVisualizer: settings.music.showVisualizer,
    reducedMotion: settings.visitorPreferences?.reducedMotion ?? false,
  };

  const handleUpdate = (partial: Partial<VisitorPreferences>) => {
    if (onUpdateVisitorPreferences) {
      onUpdateVisitorPreferences(partial);
    } else {
      const updatedSettings: AppSettings = {
        ...settings,
        rain: {
          ...settings.rain,
          enabled: partial.rainEnabled ?? settings.rain.enabled,
        },
        music: {
          ...settings.music,
          volume: partial.volume ?? settings.music.volume,
          shuffle: partial.shuffle ?? settings.music.shuffle,
          autoPlayNext: partial.autoPlayNext ?? settings.music.autoPlayNext,
          playlistLoop: partial.playlistLoop ?? settings.music.playlistLoop,
          showVisualizer: partial.showVisualizer ?? settings.music.showVisualizer,
        },
        atmosphere: {
          ...settings.atmosphere,
          performanceMode: partial.performanceMode ?? settings.atmosphere.performanceMode,
        },
        visitorPreferences: {
          ...currentPreferences,
          ...partial,
        },
      };
      onSaveSettings(updatedSettings);
    }
  };

  return (
    <PublicSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      preferences={currentPreferences}
      onUpdatePreferences={handleUpdate}
      onOpenOwnerAdmin={onOpenOwnerAdmin}
    />
  );
};
