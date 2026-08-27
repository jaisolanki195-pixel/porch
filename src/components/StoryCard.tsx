import React, { useState } from 'react';
import { Radio, ChevronDown, ChevronUp, AlertCircle, Sparkles, RefreshCw, X, Eye } from 'lucide-react';
import { ContentSettings } from '../types';

interface StoryCardProps {
  content: ContentSettings;
  isPlaying: boolean;
  errorMessage: string | null;
  onResetToCuratedPlaylist: () => void;
  accentColor: string;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  content,
  isPlaying,
  errorMessage,
  onResetToCuratedPlaylist,
  accentColor,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Split title if it contains "Father's Radio" or display cleanly
  const rawTitle = content.title || "Father's Radio";
  const isDefaultTitle = rawTitle.toLowerCase().includes("father's") && rawTitle.toLowerCase().includes("radio");

  return (
    <div className="relative z-30 max-w-xl mx-auto md:mx-0 select-none animate-in fade-in duration-500">
      {/* Error Alert Banner if YouTube fails */}
      {errorMessage && (
        <div
          id="youtube-error-banner"
          className="mb-3 p-3.5 rounded-2xl bg-red-950/90 border border-red-500/60 backdrop-blur-xl text-red-200 shadow-2xl flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-semibold text-red-100 mb-0.5">Playlist Notice</div>
            <p className="text-red-200/90 leading-relaxed mb-2">{errorMessage}</p>
            <button
              onClick={onResetToCuratedPlaylist}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-800/80 hover:bg-red-700 text-white font-medium transition-colors text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              Switch to 90s Monsoon Curated Playlist
            </button>
          </div>
        </div>
      )}

      {/* When Hidden: Minimal Floating Restore Pill */}
      {!isVisible ? (
        <button
          id="show-story-card-pill-btn"
          onClick={() => setIsVisible(true)}
          title="Show Father's Radio Story"
          className="px-3.5 py-2 glass-card rounded-full text-xs font-serif font-medium text-stone-200 hover:text-yellow-400 hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"
        >
          <Radio className="w-3.5 h-3.5 text-yellow-400" />
          <span>Father&apos;s Radio</span>
          <Eye className="w-3.5 h-3.5 text-stone-400 ml-1" />
        </button>
      ) : (
        /* Main Glassmorphic Header Story Card - Immersive UI */
        <div
          id="nostalgic-story-header-card"
          className="glass-card rounded-2xl p-5 sm:p-6 shadow-2xl transition-all duration-300 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300"
          style={{
            borderLeftColor: isPlaying ? accentColor : '#dc2626',
            borderLeftWidth: '4px',
          }}
        >
          {/* Ambient atmospheric highlight inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="min-w-0">
              {/* 1990s Nostalgia Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-400/30 text-amber-300 text-[11px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>1990s Transistor Radio • MW 102.4</span>
              </div>

              {/* Title with Immersive UI styling */}
              {isDefaultTitle ? (
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight leading-none drop-shadow-md text-stone-100">
                  <span className="text-red-500 drop-shadow-[0_2px_10px_rgba(220,38,38,0.4)]">FATHER&apos;S</span>{' '}
                  <span className="text-white/95">RADIO</span>
                </h1>
              ) : (
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-stone-100 tracking-tight leading-tight">
                  {rawTitle}
                </h1>
              )}

              {/* Subtitle */}
              <p className="mt-3 text-sm sm:text-base italic font-serif text-stone-200/90 max-w-md leading-snug">
                &ldquo;{content.subtitle || "Some songs don't just play. They bring back a time."}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse story' : 'Read memory story'}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-stone-300 hover:text-amber-300 border border-white/10 transition-all shadow-sm"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                id="hide-story-card-btn"
                onClick={() => setIsVisible(false)}
                title="Hide this card"
                aria-label="Hide story card"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/80 text-stone-400 hover:text-red-300 border border-white/10 hover:border-red-500/40 transition-all shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Story Text */}
          {isExpanded && (
            <div className="mt-4 pt-3.5 border-t border-white/10 text-xs sm:text-sm text-stone-300/95 leading-relaxed animate-in fade-in duration-300 relative z-10">
              <p className="whitespace-pre-line font-normal">{content.storyText}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-amber-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Rain on Tin Roof • Chai in Steel Cup
                </span>
                <span className="text-stone-400 uppercase tracking-widest text-[10px]">Verandah Memories</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

