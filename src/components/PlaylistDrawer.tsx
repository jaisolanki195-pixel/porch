import React, { useState } from 'react';
import { X, Play, Pause, Music, Search, Disc, Sparkles, Check } from 'lucide-react';
import { PlaylistItem, PlayerStatus } from '../types';
import { CURATED_PLAYLISTS } from '../utils/constants';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlistTracks: PlaylistItem[];
  playerStatus: PlayerStatus;
  currentPlaylistUrl: string;
  onSelectTrack: (index: number) => void;
  onSelectCuratedPlaylist: (url: string) => void;
  playlistTitle: string;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  playlistTracks,
  playerStatus,
  currentPlaylistUrl,
  onSelectTrack,
  onSelectCuratedPlaylist,
  playlistTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTracks = playlistTracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.author && track.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md transition-all duration-300">
      {/* Click outside backdrop */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        id="playlist-drawer-panel"
        className="w-full max-w-md h-full glass-card-dark border-l border-white/10 shadow-2xl flex flex-col text-stone-100 animate-slide-in-right overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Disc className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white leading-tight">
                {playlistTitle || 'Songs He Used To Listen To'}
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                {playlistTracks.length > 0
                  ? `${playlistTracks.length} Melodies Loaded`
                  : 'Curated 1990s Transistor Radio Tracklist'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close playlist drawer"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Curated Nostalgic Playlists Selector */}
        <div className="p-3 bg-black/30 border-b border-white/10">
          <div className="text-[11px] font-mono font-semibold text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Nostalgic Radio Presets
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {CURATED_PLAYLISTS.map((preset) => {
              const isSelected = currentPlaylistUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectCuratedPlaylist(preset.url)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate text-white">{preset.title}</div>
                    <div className="text-[10px] text-stone-400 truncate">{preset.description}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search filter input */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search playlist tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track, idx) => {
              const isCurrent =
                playerStatus.currentIndex === track.index ||
                playerStatus.trackTitle === track.title;
              const isPlayingCurrent = isCurrent && playerStatus.isPlaying;

              return (
                <button
                  key={`${track.id}-${track.index}-${idx}`}
                  onClick={() => onSelectTrack(track.index)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 border ${
                    isCurrent
                      ? 'bg-yellow-500/15 border-yellow-400/40 shadow-sm text-white'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-stone-300 hover:text-white'
                  }`}
                >
                  {/* Track Index or Playing Indicator */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-medium ${
                      isCurrent
                        ? 'bg-yellow-500 text-black font-bold shadow-md shadow-yellow-500/30'
                        : 'bg-white/10 text-stone-300'
                    }`}
                  >
                    {isPlayingCurrent ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : isCurrent ? (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    ) : (
                      (track.index + 1).toString().padStart(2, '0')
                    )}
                  </div>

                  {/* Title & Author */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold truncate ${isCurrent ? 'text-yellow-300 font-bold' : ''}`}>
                      {track.title}
                    </div>
                    {track.author && (
                      <div className="text-[10px] text-stone-400 truncate mt-0.5">
                        {track.author}
                      </div>
                    )}
                  </div>

                  {/* Equalizer animation when playing */}
                  {isPlayingCurrent && (
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-0.5 h-full bg-yellow-400 animate-bounce" />
                      <span className="w-0.5 h-3/4 bg-yellow-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-0.5 h-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-stone-400 space-y-2">
              <Music className="w-8 h-8 mx-auto text-stone-500 opacity-60" />
              <p className="text-xs">No matching tracks found.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-black/60 border-t border-white/10 text-[11px] text-stone-400 flex items-center justify-between font-mono">
          <span>YouTube Playlist Synchronized</span>
          <span className="text-yellow-400/90 font-bold">1990s Vividh Bharati</span>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
        .animate-spin-slow {
          animation: spin 16s linear infinite;
        }
      `}</style>
    </div>
  );
};

