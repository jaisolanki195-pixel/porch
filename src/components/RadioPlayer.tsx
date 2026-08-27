import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Sliders,
  CloudRain,
  CloudOff,
  Radio,
  Loader2,
  RadioTower,
} from 'lucide-react';
import { PlayerStatus, MusicSettings, PlaylistLoopMode } from '../types';
import { YouTubeControls } from './YouTubeEngine';
import { formatTime } from '../utils/youtube';

interface RadioPlayerProps {
  playerStatus: PlayerStatus;
  musicSettings: MusicSettings;
  controls: YouTubeControls | null;
  accentColor: string;
  onUpdateMusicSettings: (partial: Partial<MusicSettings>) => void;
  onTogglePlaylist: () => void;
  onToggleSettings: () => void;
  onToggleRain: () => void;
  isRainEnabled: boolean;
}

export const RadioPlayer: React.FC<RadioPlayerProps> = ({
  playerStatus,
  musicSettings,
  controls,
  accentColor,
  onUpdateMusicSettings,
  onTogglePlaylist,
  onToggleSettings,
  onToggleRain,
  isRainEnabled,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [previousVolume, setPreviousVolume] = useState(75);

  const isPlaying = playerStatus.isPlaying;
  const isSkipping =
    playerStatus.playbackState === 'skipping' ||
    (playerStatus.isBuffering && !!playerStatus.tuningMessage);
  const isAutoplayBlocked =
    playerStatus.playbackState === 'autoplay-blocked' || playerStatus.needsUserGesture;
  const isNoPlayable =
    playerStatus.playbackState === 'no-playable-track' ||
    playerStatus.isEntirePlaylistUnplayable;

  const progressPercent =
    playerStatus.duration > 0
      ? ((isSeeking ? seekValue : playerStatus.currentTime) / playerStatus.duration) * 100
      : 0;

  // Next Track Preview
  const nextTrackIndex =
    playerStatus.playlist && playerStatus.playlist.length > playerStatus.currentIndex + 1
      ? playerStatus.currentIndex + 1
      : playerStatus.playlist && playerStatus.playlist.length > 0 && musicSettings.playlistLoop !== 'off'
      ? 0
      : -1;

  const nextTrackLabel =
    nextTrackIndex >= 0
      ? `Track ${nextTrackIndex + 1} of ${playerStatus.totalTracks || playerStatus.playlist.length}`
      : null;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekValue(playerStatus.currentTime);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    if (controls) {
      controls.seekTo(seekValue);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    onUpdateMusicSettings({ volume: newVol });
    if (controls) {
      controls.setVolume(newVol);
    }
  };

  const handleToggleMute = () => {
    if (musicSettings.volume > 0) {
      setPreviousVolume(musicSettings.volume);
      onUpdateMusicSettings({ volume: 0 });
      controls?.setVolume(0);
    } else {
      const restored = previousVolume > 0 ? previousVolume : 75;
      onUpdateMusicSettings({ volume: restored });
      controls?.setVolume(restored);
    }
  };

  const cycleLoopMode = () => {
    const modes: PlaylistLoopMode[] = ['repeat-playlist', 'repeat-single', 'off'];
    const nextIdx = (modes.indexOf(musicSettings.playlistLoop) + 1) % modes.length;
    onUpdateMusicSettings({ playlistLoop: modes[nextIdx] });
  };

  // Determine user friendly title & subtitle
  let displayTitle = playerStatus.trackTitle || 'Father’s Radio — Nostalgic 90s Melodies';
  let displaySubtitle = playerStatus.author || 'Vividh Bharati Transistor Broadcast';
  let badgeLabel = 'Tuning: 98.4 Monsoon FM';

  if (isNoPlayable) {
    displayTitle = 'Radio signal unavailable';
    displaySubtitle = 'Could not find a playable song in this playlist.';
    badgeLabel = 'Signal Lost • 98.4 FM';
  } else if (isAutoplayBlocked) {
    displayTitle = 'Tap to Start Radio';
    displaySubtitle = 'Click play to start audio broadcast';
    badgeLabel = 'Broadcast Ready • 98.4 FM';
  } else if (isSkipping) {
    displayTitle = playerStatus.tuningMessage || 'Tuning to the next melody…';
    displaySubtitle = 'Advancing to the next track';
    badgeLabel = 'Tuning… 98.4 FM';
  } else if (playerStatus.playbackState === 'buffering') {
    displayTitle = playerStatus.trackTitle || 'Receiving the signal...';
    displaySubtitle = 'Buffering transistor melody';
    badgeLabel = 'Receiving • 98.4 FM';
  } else if (playerStatus.playbackState === 'loading') {
    displayTitle = 'Tuning station frequency…';
    displaySubtitle = 'Connecting to radio stream';
    badgeLabel = 'Loading • 98.4 FM';
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 select-none">
      {/* Immersive Glassmorphic Bottom Control Dock */}
      <div
        id="vintage-radio-player-panel"
        className="w-full glass-card border-t border-white/15 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 shadow-2xl backdrop-blur-2xl transition-all duration-200 overflow-hidden"
      >
        {/* =========================================================================
            1. DESKTOP & TABLET LAYOUT (>= 768px): Mathematically Centered 3-Column Grid
            Guarantees the Play/Pause button NEVER shifts horizontally or vertically.
           ========================================================================= */}
        <div className="max-w-7xl mx-auto hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4 lg:gap-6">
          {/* COLUMN 1 (LEFT): Station & Active Track Info (Flexible & Shrinkable, Single-Line Truncated) */}
          <div className="min-w-0 flex items-center gap-3 justify-self-start w-full overflow-hidden">
            {/* Vintage Transistor Tuning Badge / Mini Chassis */}
            <div
              className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border transition-colors relative overflow-hidden ${
                isPlaying
                  ? 'bg-amber-950/70 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : isSkipping || isAutoplayBlocked
                  ? 'bg-yellow-950/70 border-yellow-500/60 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
                  : isNoPlayable
                  ? 'bg-red-950/50 border-red-500/40'
                  : 'bg-slate-900/80 border-slate-700'
              }`}
            >
              {/* Dual LED indicator dots */}
              <div className="flex gap-1.5 absolute top-1.5 left-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPlaying
                      ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                      : isSkipping
                      ? 'bg-yellow-400 animate-ping'
                      : isNoPlayable
                      ? 'bg-red-800'
                      : 'bg-red-900'
                  }`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPlaying
                      ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                      : isSkipping
                      ? 'bg-amber-400 animate-pulse'
                      : isNoPlayable
                      ? 'bg-red-900'
                      : 'bg-yellow-900'
                  }`}
                />
              </div>
              {isSkipping ? (
                <Loader2 className="w-4 h-4 mt-2 text-yellow-400 animate-spin" />
              ) : isNoPlayable ? (
                <RadioTower className="w-4 h-4 mt-2 text-stone-500" />
              ) : (
                <Radio
                  className={`w-4 h-4 mt-2 ${
                    isPlaying ? 'text-amber-400 animate-pulse' : 'text-stone-400'
                  }`}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2 h-4 overflow-hidden">
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold truncate ${
                    isNoPlayable ? 'text-stone-400' : 'text-amber-400'
                  }`}
                >
                  {badgeLabel}
                </span>
                {!isNoPlayable && playerStatus.totalTracks > 0 && (
                  <span className="text-[10px] font-mono text-stone-400 flex-shrink-0">
                    [{playerStatus.currentIndex + 1}/{playerStatus.totalTracks}]
                  </span>
                )}
              </div>

              <h2 className="text-sm lg:text-base font-bold text-white truncate tracking-tight leading-snug block">
                {displayTitle}
              </h2>

              <p className="text-[11px] text-stone-400 truncate leading-tight block mt-0.5">
                {displaySubtitle}
              </p>
            </div>
          </div>

          {/* COLUMN 2 (CENTER): Fixed-Center Playback Controls & Progress Scrubber */}
          <div className="flex flex-col items-center justify-self-center w-full max-w-sm sm:max-w-md lg:max-w-xl flex-shrink-0 gap-1.5">
            {/* Buttons Row (Stable fixed dimensions) */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-5 h-12 flex-shrink-0">
              {/* Shuffle Button */}
              <button
                id="toggle-shuffle-btn"
                onClick={() => onUpdateMusicSettings({ shuffle: !musicSettings.shuffle })}
                title={musicSettings.shuffle ? 'Shuffle ON' : 'Shuffle OFF'}
                aria-label="Toggle shuffle"
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                  musicSettings.shuffle
                    ? 'text-yellow-400 bg-yellow-500/20'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4 pointer-events-none" />
              </button>

              {/* Previous Track */}
              <button
                id="prev-song-btn"
                onClick={() => controls?.previous()}
                title="Previous Track"
                aria-label="Previous track"
                className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-yellow-400 transition-colors cursor-pointer flex-shrink-0"
              >
                <SkipBack className="w-5 h-5 fill-current pointer-events-none" />
              </button>

              {/* Main Circular Play/Pause (Anchored, Fixed Size, Symmetrically Centered Icon) */}
              <button
                id="main-play-pause-btn"
                onClick={() => {
                  if (controls) {
                    controls.togglePlay();
                  }
                }}
                title={
                  isAutoplayBlocked
                    ? 'Tap to Start Radio'
                    : isPlaying
                    ? 'Pause'
                    : 'Play'
                }
                aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center transition-colors shadow-lg cursor-pointer flex-shrink-0 relative ${
                  isAutoplayBlocked
                    ? 'border-amber-400 bg-amber-500 text-stone-950 font-bold animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                    : isPlaying
                    ? 'border-amber-400/80 text-amber-300 bg-amber-950/40 hover:bg-amber-400 hover:text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'border-white text-white bg-black/50 hover:bg-white hover:text-black'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center pointer-events-none relative">
                  {isSkipping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  )}
                </div>
              </button>

              {/* Next Track */}
              <button
                id="next-song-btn"
                onClick={() => controls?.next()}
                title="Next Track"
                aria-label="Next track"
                className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-yellow-400 transition-colors cursor-pointer flex-shrink-0"
              >
                <SkipForward className="w-5 h-5 fill-current pointer-events-none" />
              </button>

              {/* Loop Button */}
              <button
                id="cycle-loop-mode-btn"
                onClick={cycleLoopMode}
                title={`Loop Mode: ${musicSettings.playlistLoop}`}
                aria-label="Cycle playlist loop mode"
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                  musicSettings.playlistLoop !== 'off'
                    ? 'text-yellow-400 bg-yellow-500/20'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {musicSettings.playlistLoop === 'repeat-single' ? (
                  <Repeat1 className="w-4 h-4 pointer-events-none" />
                ) : (
                  <Repeat className="w-4 h-4 pointer-events-none" />
                )}
              </button>
            </div>

            {/* Time & Progress Scrubber Bar */}
            <div className="w-full flex items-center gap-2 sm:gap-3 h-5 flex-shrink-0">
              <span className="w-11 text-right font-mono text-[10px] sm:text-xs text-stone-400 select-none flex-shrink-0 tabular-nums">
                {formatTime(isSeeking ? seekValue : playerStatus.currentTime)}
              </span>

              <div className="relative flex-1 flex items-center group cursor-pointer py-1 min-w-0">
                <input
                  id="playback-progress-slider"
                  type="range"
                  min="0"
                  max={playerStatus.duration || 100}
                  step="0.5"
                  value={isSeeking ? seekValue : playerStatus.currentTime}
                  onChange={handleSeekChange}
                  onMouseDown={handleSeekStart}
                  onTouchStart={handleSeekStart}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  aria-label="Audio playback position"
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer focus:outline-none accent-amber-400 group-hover:h-2 transition-all"
                />
                {/* Custom filled yellow progress track */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 group-hover:h-2 rounded-full pointer-events-none bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>

              <span className="w-11 text-left font-mono text-[10px] sm:text-xs text-stone-400 select-none flex-shrink-0 tabular-nums">
                {formatTime(playerStatus.duration)}
              </span>
            </div>
          </div>

          {/* COLUMN 3 (RIGHT): Volume & Quick Visitor Actions */}
          <div className="flex items-center justify-end justify-self-end gap-2 lg:gap-3 w-full flex-shrink-0">
            {/* Next Up preview (fixed width on xl, hidden below) */}
            {nextTrackLabel && (
              <div className="hidden xl:flex flex-col items-end min-w-0 max-w-[130px] flex-shrink-0">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-mono">
                  Next Up
                </span>
                <span className="text-xs font-semibold text-stone-300 truncate w-full text-right font-mono">
                  {nextTrackLabel}
                </span>
              </div>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                id="mute-volume-toggle-btn"
                onClick={handleToggleMute}
                title={musicSettings.volume === 0 ? 'Unmute' : 'Mute'}
                aria-label="Toggle mute"
                className="text-stone-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer flex-shrink-0"
              >
                {musicSettings.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                id="player-volume-slider"
                type="range"
                min="0"
                max="100"
                value={musicSettings.volume}
                onChange={handleVolumeChange}
                aria-label="Volume level"
                className="w-16 lg:w-20 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-400 flex-shrink-0"
              />
            </div>

            {/* Quick Rain Toggle */}
            <button
              id="quick-rain-toggle-btn"
              onClick={onToggleRain}
              title={isRainEnabled ? 'Disable Rain Simulation' : 'Enable Rain Simulation'}
              aria-label="Toggle rain simulation"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                isRainEnabled
                  ? 'bg-sky-950/80 border-sky-400/40 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-800/80 border-slate-700 text-stone-400 hover:text-white'
              }`}
            >
              {isRainEnabled ? (
                <CloudRain className="w-4 h-4 text-sky-400" />
              ) : (
                <CloudOff className="w-4 h-4" />
              )}
            </button>

            {/* Playlist Drawer Button */}
            <button
              id="open-playlist-drawer-btn"
              onClick={onTogglePlaylist}
              title="Open Playlist Drawer"
              aria-label="Open playlist drawer"
              className="w-9 h-9 sm:w-10 sm:h-10 glass-card rounded-xl hover:bg-white/20 text-stone-200 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              id="open-settings-modal-btn"
              onClick={onToggleSettings}
              title="Open Settings"
              aria-label="Open settings modal"
              className="w-9 h-9 sm:w-10 sm:h-10 glass-card rounded-xl hover:bg-white/20 text-stone-200 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. MOBILE VIEWPORT LAYOUT (< 768px - 320px, 375px, 390px, 430px)
            Streamlined 2-Row Architecture: Anchored, Non-wrapping, Zero Layout Jumps.
           ========================================================================= */}
        <div className="max-w-full mx-auto md:hidden flex flex-col gap-2">
          {/* ROW 1: Station Status & Compact Action Buttons */}
          <div className="flex items-center justify-between gap-2 w-full h-10 flex-shrink-0 overflow-hidden">
            {/* Left: Tuning badge + Track Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  isPlaying
                    ? 'bg-amber-950/80 border-amber-500/50'
                    : 'bg-slate-900/80 border-slate-700'
                }`}
              >
                {isSkipping ? (
                  <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                ) : (
                  <Radio
                    className={`w-3.5 h-3.5 ${
                      isPlaying ? 'text-amber-400 animate-pulse' : 'text-stone-400'
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h2 className="text-xs font-bold text-white truncate leading-tight">
                  {displayTitle}
                </h2>
                <p className="text-[10px] font-mono text-amber-400/90 truncate leading-tight mt-0.5">
                  {badgeLabel}
                </p>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                id="mobile-rain-toggle-btn"
                onClick={onToggleRain}
                title="Toggle Rain"
                aria-label="Toggle rain simulation"
                className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer ${
                  isRainEnabled
                    ? 'bg-sky-950/80 border-sky-400/40 text-sky-300'
                    : 'bg-slate-800/80 border-slate-700 text-stone-400'
                }`}
              >
                {isRainEnabled ? (
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <CloudOff className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                id="mobile-playlist-drawer-btn"
                onClick={onTogglePlaylist}
                title="Playlists"
                aria-label="Open playlist drawer"
                className="w-8 h-8 glass-card rounded-lg text-stone-200 flex items-center justify-center cursor-pointer"
              >
                <ListMusic className="w-3.5 h-3.5" />
              </button>

              <button
                id="mobile-settings-modal-btn"
                onClick={onToggleSettings}
                title="Settings"
                aria-label="Open settings modal"
                className="w-8 h-8 glass-card rounded-lg text-stone-200 flex items-center justify-center cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ROW 2: Playback Action Controls (Stable, Anchored Center) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 h-12 w-full flex-shrink-0">
            {/* Shuffle */}
            <button
              id="mobile-shuffle-btn"
              onClick={() => onUpdateMusicSettings({ shuffle: !musicSettings.shuffle })}
              title="Toggle Shuffle"
              aria-label="Toggle shuffle"
              className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0 ${
                musicSettings.shuffle
                  ? 'text-yellow-400 bg-yellow-500/20'
                  : 'text-stone-400'
              }`}
            >
              <Shuffle className="w-4 h-4 pointer-events-none" />
            </button>

            {/* Previous */}
            <button
              id="mobile-prev-song-btn"
              onClick={() => controls?.previous()}
              title="Previous Track"
              aria-label="Previous track"
              className="w-9 h-9 flex items-center justify-center text-stone-300 cursor-pointer flex-shrink-0"
            >
              <SkipBack className="w-5 h-5 fill-current pointer-events-none" />
            </button>

            {/* Play/Pause Button (Strictly Anchored, Fixed Size) */}
            <button
              id="mobile-main-play-pause-btn"
              onClick={() => {
                if (controls) {
                  controls.togglePlay();
                }
              }}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg cursor-pointer flex-shrink-0 relative ${
                isAutoplayBlocked
                  ? 'border-amber-400 bg-amber-500 text-stone-950 font-bold animate-pulse'
                  : isPlaying
                  ? 'border-amber-400/80 text-amber-300 bg-amber-950/40'
                  : 'border-white text-white bg-black/50'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center pointer-events-none">
                {isSkipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </div>
            </button>

            {/* Next */}
            <button
              id="mobile-next-song-btn"
              onClick={() => controls?.next()}
              title="Next Track"
              aria-label="Next track"
              className="w-9 h-9 flex items-center justify-center text-stone-300 cursor-pointer flex-shrink-0"
            >
              <SkipForward className="w-5 h-5 fill-current pointer-events-none" />
            </button>

            {/* Loop */}
            <button
              id="mobile-loop-btn"
              onClick={cycleLoopMode}
              title="Loop Mode"
              aria-label="Cycle playlist loop mode"
              className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0 ${
                musicSettings.playlistLoop !== 'off'
                  ? 'text-yellow-400 bg-yellow-500/20'
                  : 'text-stone-400'
              }`}
            >
              {musicSettings.playlistLoop === 'repeat-single' ? (
                <Repeat1 className="w-4 h-4 pointer-events-none" />
              ) : (
                <Repeat className="w-4 h-4 pointer-events-none" />
              )}
            </button>
          </div>

          {/* ROW 3: Progress Bar & Scrubber */}
          <div className="w-full flex items-center gap-2 h-4 flex-shrink-0">
            <span className="w-9 text-right font-mono text-[10px] text-stone-400 tabular-nums flex-shrink-0 select-none">
              {formatTime(isSeeking ? seekValue : playerStatus.currentTime)}
            </span>

            <div className="relative flex-1 flex items-center cursor-pointer py-1 min-w-0">
              <input
                id="mobile-progress-slider"
                type="range"
                min="0"
                max={playerStatus.duration || 100}
                step="0.5"
                value={isSeeking ? seekValue : playerStatus.currentTime}
                onChange={handleSeekChange}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                aria-label="Audio playback position"
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer focus:outline-none accent-amber-400"
              />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none bg-amber-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>

            <span className="w-9 text-left font-mono text-[10px] text-stone-400 tabular-nums flex-shrink-0 select-none">
              {formatTime(playerStatus.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
