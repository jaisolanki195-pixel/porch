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
  const isSkipping = playerStatus.playbackState === 'skipping' || (playerStatus.isBuffering && !!playerStatus.tuningMessage);
  const isAutoplayBlocked = playerStatus.playbackState === 'autoplay-blocked' || playerStatus.needsUserGesture;
  const isNoPlayable = playerStatus.playbackState === 'no-playable-track' || playerStatus.isEntirePlaylistUnplayable;

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
  let displayTitle = playerStatus.trackTitle || "Father’s Radio — Nostalgic 90s Melodies";
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
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Immersive Glassmorphic Bottom Control Dock */}
      <div
        id="vintage-radio-player-panel"
        className="w-full glass-card border-t border-white/15 px-3 sm:px-8 py-3 sm:py-4 shadow-2xl backdrop-blur-2xl transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* LEFT: Station & Active Track Info */}
          <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
            {/* Vintage Transistor Tuning Badge / Mini Chassis */}
            <div
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border transition-all duration-500 relative overflow-hidden ${
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
                <Radio className={`w-4 h-4 mt-2 ${isPlaying ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isNoPlayable ? 'text-stone-400' : 'text-amber-400'
                }`}>
                  {badgeLabel}
                </span>
                {!isNoPlayable && playerStatus.totalTracks > 0 && (
                  <span className="text-[10px] font-mono text-stone-400">
                    [{playerStatus.currentIndex + 1}/{playerStatus.totalTracks}]
                  </span>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                {displayTitle}
              </h2>

              <p className="text-[11px] text-stone-400 truncate">
                {displaySubtitle}
              </p>
            </div>
          </div>

          {/* CENTER: Playback Controls & Scrubber Progress Bar */}
          <div className="flex flex-col items-center gap-2 w-full md:w-5/12 max-w-xl">
            {/* Buttons Row */}
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Shuffle Button */}
              <button
                id="toggle-shuffle-btn"
                onClick={() => onUpdateMusicSettings({ shuffle: !musicSettings.shuffle })}
                title={musicSettings.shuffle ? 'Shuffle ON' : 'Shuffle OFF'}
                aria-label="Toggle shuffle"
                className={`min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  musicSettings.shuffle
                    ? 'text-yellow-400 bg-yellow-500/20'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Previous Track */}
              <button
                id="prev-song-btn"
                onClick={() => controls?.previous()}
                title="Previous Track"
                aria-label="Previous track"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-300 hover:text-yellow-400 active:scale-95 transition-colors p-2 cursor-pointer"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Main Circular Play/Pause */}
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
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 flex items-center justify-center active:scale-95 transition-all shadow-lg cursor-pointer ${
                  isAutoplayBlocked
                    ? 'border-amber-400 bg-amber-500 text-stone-950 font-bold animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                    : isPlaying
                    ? 'border-amber-400/80 text-amber-300 bg-amber-950/40 hover:bg-amber-400 hover:text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'border-white text-white bg-black/50 hover:bg-white hover:text-black'
                }`}
              >
                {isSkipping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                id="next-song-btn"
                onClick={() => controls?.next()}
                title="Next Track"
                aria-label="Next track"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-300 hover:text-yellow-400 active:scale-95 transition-colors p-2 cursor-pointer"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Loop Button */}
              <button
                id="cycle-loop-mode-btn"
                onClick={cycleLoopMode}
                title={`Loop Mode: ${musicSettings.playlistLoop}`}
                aria-label="Cycle playlist loop mode"
                className={`min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  musicSettings.playlistLoop !== 'off'
                    ? 'text-yellow-400 bg-yellow-500/20'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {musicSettings.playlistLoop === 'repeat-single' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Time & Progress Bar */}
            <div className="w-full flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-stone-400 min-w-[34px] text-right">
                {formatTime(isSeeking ? seekValue : playerStatus.currentTime)}
              </span>

              <div className="relative flex-1 flex items-center group cursor-pointer py-1">
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

              <span className="text-[10px] font-mono text-stone-400 min-w-[34px]">
                {formatTime(playerStatus.duration)}
              </span>
            </div>
          </div>

          {/* RIGHT: Next Up Info, Volume & Quick Actions */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full md:w-1/3">
            {/* Next Up preview */}
            {nextTrackLabel && (
              <div className="hidden xl:flex flex-col items-end min-w-0 max-w-[150px]">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-mono">
                  Next Up
                </span>
                <span className="text-xs font-semibold text-stone-300 truncate w-full text-right font-mono">
                  {nextTrackLabel}
                </span>
              </div>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-1.5">
              <button
                id="mute-volume-toggle-btn"
                onClick={handleToggleMute}
                title={musicSettings.volume === 0 ? 'Unmute' : 'Mute'}
                aria-label="Toggle mute"
                className="text-stone-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
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
                className="w-16 sm:w-20 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Quick Rain Toggle */}
            <button
              id="quick-rain-toggle-btn"
              onClick={onToggleRain}
              title={isRainEnabled ? 'Disable Rain Simulation' : 'Enable Rain Simulation'}
              aria-label="Toggle rain simulation"
              className={`min-w-[40px] min-h-[40px] p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isRainEnabled
                  ? 'bg-sky-950/80 border-sky-400/40 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-800/80 border-slate-700 text-stone-400 hover:text-white'
              }`}
            >
              {isRainEnabled ? <CloudRain className="w-4 h-4 text-sky-400" /> : <CloudOff className="w-4 h-4" />}
            </button>

            {/* Playlist Drawer Button */}
            <button
              id="open-playlist-drawer-btn"
              onClick={onTogglePlaylist}
              title="Open Playlist Drawer"
              aria-label="Open playlist drawer"
              className="min-w-[40px] min-h-[40px] p-2 glass-card rounded-xl hover:bg-white/20 text-stone-200 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              id="open-settings-modal-btn"
              onClick={onToggleSettings}
              title="Open Settings"
              aria-label="Open settings modal"
              className="min-w-[40px] min-h-[40px] p-2 glass-card rounded-xl hover:bg-white/20 text-stone-200 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
