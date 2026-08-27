import React, { useEffect, useState } from 'react';
import { Radio, CloudRain } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [fadeState, setFadeState] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFadeState('fading');
    }, 700);

    const timer2 = setTimeout(() => {
      setFadeState('gone');
      if (onComplete) onComplete();
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (fadeState === 'gone') return null;

  return (
    <div
      id="nostalgic-loading-screen"
      className={`fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500 ${
        fadeState === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.7) 0%, rgba(12, 10, 9, 1) 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {/* Radio Tuning Visual */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
            <Radio className="w-9 h-9 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        </div>

        {/* Nostalgic Greeting */}
        <div className="space-y-1 mt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-400/30 text-amber-300 text-[10px] font-mono uppercase tracking-widest">
            <CloudRain className="w-3 h-3 text-sky-400" />
            <span>Monsoon 1990s Vividh Bharati</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Father&apos;s Radio
          </h1>
          <p className="text-xs text-stone-400 font-serif italic">
            Tuning frequency... Raindrops on the tin roof...
          </p>
        </div>

        {/* Vintage Tuning Dial Progress */}
        <div className="w-48 h-1 bg-stone-800 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
};
