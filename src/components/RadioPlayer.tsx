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
  Music,
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
  const progressPercent =
    playerStatus.duration > 0
      ? ((isSeeking ? seekValue : playerStatus.currentTime) / playerStatus.duration) * 100
      : 0;

  // Next Track Preview
  const nextTrack =
    playerStatus.playlist && playerStatus.playlist.length > playerStatus.currentIndex + 1
      ? playerStatus.playlist[playerStatus.currentIndex + 1]
      : playerStatus.playlist && playerStatus.playlist.length > 0 && musicSettings.playlistLoop !== 'off'
      ? playerStatus.playlist[0]
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Immersive Glassmorphic Bottom Control Dock */}
      <div
        id="vintage-radio-player-panel"
        className="w-full glass-card border-t border-white/15 px-4 sm:px-8 py-3.5 sm:py-4 shadow-2xl backdrop-blur-2xl transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* LEFT: Station & Active Track Info */}
          <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
            {/* Vintage Transistor Tuning Badge / Mini Chassis */}
            <div
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border transition-all duration-500 relative overflow-hidden ${
                isPlaying
                  ? 'bg-amber-950/60 border-amber-500/50 radio-glow'
                  : 'bg-slate-900/80 border-slate-700'
              }`}
            >
              {/* Dual LED indicator dots from design */}
              <div className="flex gap-1.5 absolute top-1.5 left-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-red-900'}`} />
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-yellow-400 shadow-[0_0_6px_#eab308]' : 'bg-yellow-900'}`} />
              </div>
              <Radio className={`w-4 h-4 mt-2 ${isPlaying ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-500/90 font-bold">
                  Tuning: 98.4 Monsoon FM
                </span>
                {playerStatus.totalTracks > 0 && (
                  <span className="text-[10px] font-mono text-stone-400">
                    [{playerStatus.currentIndex + 1}/{playerStatus.totalTracks}]
                  </span>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                {playerStatus.trackTitle || 'Father’s Radio — Nostalgic 90s Melodies'}
              </h2>

              <p className="text-[11px] text-stone-400 truncate italic">
                {playerStatus.author || 'Vividh Bharati Transistor Broadcast'}
              </p>
            </div>
          </div>

          {/* CENTER: Playback Controls & Scrubber Progress Bar */}
          <div className="flex flex-col items-center gap-2 w-full md:w-5/12 max-w-xl">
            {/* Buttons Row */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Shuffle Button */}
              <button
                id="toggle-shuffle-btn"
                onClick={() => onUpdateMusicSettings({ shuffle: !musicSettings.shuffle })}
                title={musicSettings.shuffle ? 'Shuffle ON' : 'Shuffle OFF'}
                className={`p-1.5 rounded-lg transition-colors ${
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
                className="text-stone-300 hover:text-yellow-400 active:scale-95 transition-colors p-1"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Main Circular Play/Pause (Immersive UI Style) */}
              <button
                id="main-play-pause-btn"
                onClick={() => controls?.togglePlay()}
                title={isPlaying ? 'Pause' : 'Play'}
                className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center hover:bg-white hover:text-black active:scale-95 transition-all text-white shadow-lg bg-black/40 backdrop-blur-xs"
              >
                {isPlaying ? (
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
                className="text-stone-300 hover:text-yellow-400 active:scale-95 transition-colors p-1"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Loop Button */}
              <button
                id="cycle-loop-mode-btn"
                onClick={cycleLoopMode}
                title={`Loop Mode: ${musicSettings.playlistLoop}`}
                className={`p-1.5 rounded-lg transition-colors ${
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

              <div className="relative flex-1 flex items-center group cursor-pointer">
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
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer focus:outline-none accent-yellow-400 group-hover:h-1.5 transition-all"
                />
                {/* Custom filled yellow progress track */}
                <div
                  className="absolute left-0 top-0 h-1 group-hover:h-1.5 rounded-full pointer-events-none bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>

              <span className="text-[10px] font-mono text-stone-400 min-w-[34px]">
                {formatTime(playerStatus.duration)}
              </span>
            </div>
          </div>

          {/* RIGHT: Next Up Info, Volume & Quick Actions */}
          <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
            {/* Next Up preview from design */}
            {nextTrack && (
              <div className="hidden lg:flex flex-col items-end min-w-0 max-w-[170px]">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-mono">
                  Next Up
                </span>
                <span className="text-xs font-semibold text-stone-200 truncate w-full text-right">
                  {nextTrack.title}
                </span>
              </div>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-1.5">
              <button
                id="mute-volume-toggle-btn"
                onClick={handleToggleMute}
                title={musicSettings.volume === 0 ? 'Unmute' : 'Mute'}
                className="text-stone-400 hover:text-white p-1"
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
                className="w-16 sm:w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-yellow-400"
              />
            </div>

            {/* Quick Rain Toggle */}
            <button
              id="quick-rain-toggle-btn"
              onClick={onToggleRain}
              title={isRainEnabled ? 'Disable Rain Simulation' : 'Enable Rain Simulation'}
              className={`p-2 rounded-lg border transition-all ${
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
              className="p-2 glass-card rounded-lg hover:bg-white/20 text-stone-200 hover:text-yellow-400 transition-colors"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              id="open-settings-modal-btn"
              onClick={onToggleSettings}
              title="Open Settings"
              className="p-2 glass-card rounded-lg hover:bg-white/20 text-stone-200 hover:text-yellow-400 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

