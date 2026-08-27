import React from 'react';
import { AtmosphereSettings, PlayerStatus } from '../types';

interface AtmosphericEffectsProps {
  atmosphere: AtmosphereSettings;
  playerStatus: PlayerStatus;
  windLevel: 'none' | 'very-light' | 'light';
}

export const AtmosphericEffects: React.FC<AtmosphericEffectsProps> = ({
  atmosphere,
  playerStatus,
  windLevel,
}) => {
  const isPlaying = playerStatus.isPlaying;
  const isPerformance = atmosphere.performanceMode === 'performance';

  // Compute wind drift offset for steam and foliage
  const windOffsetClass =
    windLevel === 'none'
      ? 'animate-steam-rise-straight'
      : windLevel === 'light'
      ? 'animate-steam-rise-windy'
      : 'animate-steam-rise-gentle';

  const foliageSwayDuration =
    windLevel === 'none' ? '6s' : windLevel === 'light' ? '3.5s' : '4.8s';

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none">
      {/* 1. Cinematic Film Grain & Soft Vignette Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-radial-vignette opacity-50" />

      {/* 2. Atmospheric Mountain Haze & Monsoon Mist Layers */}
      {!isPerformance && atmosphere.atmosphericMist && (
        <div className="absolute top-[22%] left-0 right-0 h-[28%] pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-200/25 to-transparent blur-2xl animate-mist-drift"
            style={{ animationDuration: '32s' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-300/10 via-teal-100/20 to-transparent blur-3xl animate-mist-drift-reverse"
            style={{ animationDuration: '45s' }}
          />
        </div>
      )}

      {!isPerformance && atmosphere.mountainHaze && (
        <div className="absolute top-[32%] left-[18%] w-[65%] h-[18%] bg-indigo-900/15 blur-xl mix-blend-overlay pointer-events-none" />
      )}

      {/* 3. Hanging Plant & Potted Plant Subtle Monsoon Breeze Sway */}
      {atmosphere.plantMovement && (
        <>
          {/* Top Left Potted Plant (on yellow porch beam) */}
          <div
            className="absolute top-[16%] left-[14%] w-16 h-28 pointer-events-none origin-top"
            style={{
              animation: `plantSway ${foliageSwayDuration} ease-in-out infinite alternate`,
            }}
          >
            <div className="w-full h-full bg-emerald-400/5 rounded-full blur-[2px]" />
          </div>

          {/* Lower Left Bougainvillea / Hibiscus Flowers */}
          <div
            className="absolute bottom-[4%] left-[2%] w-44 h-44 pointer-events-none origin-bottom-left"
            style={{
              animation: `flowerGentleRustle ${
                windLevel === 'light' ? '2.8s' : '4.2s'
              } ease-in-out infinite alternate`,
            }}
          />

          {/* Lower Right Bright Flowers */}
          <div
            className="absolute bottom-[3%] right-[3%] w-40 h-40 pointer-events-none origin-bottom-right"
            style={{
              animation: `flowerGentleRustle ${
                windLevel === 'light' ? '3.2s' : '5s'
              } ease-in-out infinite alternate-reverse`,
            }}
          />
        </>
      )}

      {/* 4. Father's Chai / Tea Steam Particle System */}
      {atmosphere.teaSteam && (
        <div className="absolute bottom-[32%] left-[45%] md:left-[47%] w-16 h-36 pointer-events-none flex flex-col items-center">
          {/* Subtle cup warm thermal glow */}
          <div className="absolute bottom-2 w-8 h-8 rounded-full bg-amber-500/15 blur-md" />

          {/* Steam wisps */}
          <div
            className={`w-6 h-20 rounded-full bg-gradient-to-t from-white/30 via-stone-200/15 to-transparent blur-[3px] opacity-70 ${windOffsetClass}`}
            style={{ animationDuration: '4.2s' }}
          />
          <div
            className={`absolute bottom-6 w-8 h-24 rounded-full bg-gradient-to-t from-white/25 via-amber-100/10 to-transparent blur-[4px] opacity-60 ${windOffsetClass}`}
            style={{ animationDuration: '5.5s', animationDelay: '1.4s' }}
          />
          {!isPerformance && (
            <div
              className={`absolute bottom-12 w-5 h-16 rounded-full bg-gradient-to-t from-white/20 to-transparent blur-[3px] opacity-50 ${windOffsetClass}`}
              style={{ animationDuration: '3.8s', animationDelay: '2.8s' }}
            />
          )}
        </div>
      )}

      {/* 5. Vintage Radio Speaker Vibration Overlay */}
      {atmosphere.radioAnimation && (
        <div className="absolute bottom-[16%] right-[22%] md:right-[26%] w-44 h-32 pointer-events-none">
          {/* Speaker Acoustic Vibration / Pulse */}
          <div
            className={`absolute top-[48%] left-[18%] w-16 h-12 rounded-sm transition-transform duration-300 ${
              isPlaying ? 'animate-speaker-pulse' : 'opacity-0'
            }`}
          >
            <div className="w-full h-full bg-amber-500/10 rounded-full blur-[3px]" />
          </div>
        </div>
      )}

      {/* Global CSS keyframes for atmospheric physics */}
      <style>{`
        @keyframes plantSway {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(2.4deg); }
        }
        @keyframes flowerGentleRustle {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.015) rotate(1.2deg); }
        }
        @keyframes steamGentle {
          0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0; }
          25% { opacity: 0.7; }
          60% { transform: translateY(-40px) translateX(8px) scale(1.25); opacity: 0.45; }
          100% { transform: translateY(-85px) translateX(18px) scale(1.8); opacity: 0; }
        }
        @keyframes steamWindy {
          0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0; }
          25% { opacity: 0.75; }
          60% { transform: translateY(-38px) translateX(22px) scale(1.3); opacity: 0.4; }
          100% { transform: translateY(-75px) translateX(45px) scale(2); opacity: 0; }
        }
        @keyframes steamStraight {
          0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0; }
          25% { opacity: 0.7; }
          60% { transform: translateY(-45px) translateX(1px) scale(1.2); opacity: 0.4; }
          100% { transform: translateY(-90px) translateX(2px) scale(1.7); opacity: 0; }
        }
        @keyframes mistDrift {
          0% { transform: translateX(-25%); }
          50% { transform: translateX(25%); }
          100% { transform: translateX(-25%); }
        }
        @keyframes mistDriftReverse {
          0% { transform: translateX(20%); }
          50% { transform: translateX(-20%); }
          100% { transform: translateX(20%); }
        }
        @keyframes speakerPulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.08); opacity: 0.4; }
        }
        .animate-steam-rise-gentle {
          animation: steamGentle infinite ease-out;
        }
        .animate-steam-rise-windy {
          animation: steamWindy infinite ease-out;
        }
        .animate-steam-rise-straight {
          animation: steamStraight infinite ease-out;
        }
        .animate-mist-drift {
          animation: mistDrift infinite ease-in-out;
        }
        .animate-mist-drift-reverse {
          animation: mistDriftReverse infinite ease-in-out;
        }
        .animate-speaker-pulse {
          animation: speakerPulse 0.45s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
