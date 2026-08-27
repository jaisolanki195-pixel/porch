import React, { useEffect, useRef } from 'react';
import { RainSettings, PerformanceMode } from '../types';

interface RainCanvasProps {
  settings: RainSettings;
  performanceMode?: PerformanceMode;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  thickness: number;
  layer: 'bg' | 'mid' | 'fg';
}

interface RoofDrip {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  radius: number;
  opacity: number;
  streamLength: number;
  isStream: boolean;
  formingProgress: number; // 0 to 1 before falling
  roofSourceX: number;
  roofSourceY: number;
}

interface GroundRipple {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  maxRadius: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

export const RainCanvas: React.FC<RainCanvasProps> = ({ settings, performanceMode = 'cinematic' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = !document.hidden;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initRain();
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Physics parameters based on settings
    const getDensity = () => {
      const isMobile = width < 768;
      const mobileFactor = isMobile ? 0.55 : 1.0;
      let perfFactor = 1.0;
      if (performanceMode === 'performance') perfFactor = 0.4;
      else if (performanceMode === 'balanced') perfFactor = 0.75;

      let base = 400;
      switch (settings.intensity) {
        case 'very-light':
          base = 100;
          break;
        case 'light':
          base = 220;
          break;
        case 'medium':
          base = 420;
          break;
        case 'heavy':
          base = 750;
          break;
        default:
          base = 400;
      }
      return Math.max(20, Math.floor(base * mobileFactor * perfFactor));
    };

    const getSpeedMultiplier = () => {
      switch (settings.speed) {
        case 'slow':
          return 0.65;
        case 'natural':
          return 1.0;
        case 'fast':
          return 1.45;
        default:
          return 1.0;
      }
    };

    const getSizeMultiplier = () => {
      switch (settings.dropSize) {
        case 'fine':
          return 0.75;
        case 'natural':
          return 1.0;
        case 'heavy':
          return 1.5;
        default:
          return 1.0;
      }
    };

    const getWindOffset = () => {
      switch (settings.wind) {
        case 'none':
          return 0;
        case 'very-light':
          return 0.08;
        case 'light':
          return 0.22;
        default:
          return 0.08;
      }
    };

    let drops: RainDrop[] = [];
    let roofDrips: RoofDrip[] = [];
    let ripples: GroundRipple[] = [];
    let splashes: SplashParticle[] = [];

    const initRain = () => {
      const count = getDensity();
      const speedMult = getSpeedMultiplier();
      const sizeMult = getSizeMultiplier();

      drops = [];
      for (let i = 0; i < count; i++) {
        // Layer distribution: 45% bg, 35% mid, 20% fg
        const rand = Math.random();
        let layer: 'bg' | 'mid' | 'fg' = 'mid';
        let baseSpeed = 16;
        let baseLength = 16;
        let baseOpacity = 0.45;
        let thickness = 1.0;

        if (rand < 0.45) {
          layer = 'bg';
          baseSpeed = 9 + Math.random() * 5;
          baseLength = 8 + Math.random() * 8;
          baseOpacity = 0.15 + Math.random() * 0.2;
          thickness = 0.75 * sizeMult;
        } else if (rand < 0.8) {
          layer = 'mid';
          baseSpeed = 16 + Math.random() * 8;
          baseLength = 18 + Math.random() * 14;
          baseOpacity = 0.35 + Math.random() * 0.25;
          thickness = 1.15 * sizeMult;
        } else {
          layer = 'fg';
          if (!settings.foregroundRain) {
            layer = 'mid';
            baseSpeed = 16 + Math.random() * 8;
            baseLength = 18 + Math.random() * 14;
            baseOpacity = 0.35 + Math.random() * 0.25;
            thickness = 1.15 * sizeMult;
          } else {
            baseSpeed = 26 + Math.random() * 12;
            baseLength = 32 + Math.random() * 26;
            baseOpacity = 0.6 + Math.random() * 0.3;
            thickness = 1.7 * sizeMult;
          }
        }

        drops.push({
          x: Math.random() * (width + 300) - 150,
          y: Math.random() * height,
          length: baseLength * sizeMult,
          speed: baseSpeed * speedMult,
          opacity: baseOpacity,
          thickness,
          layer,
        });
      }

      // Initialize roof drip points along the top porch overhang (top 8% to 16% height)
      roofDrips = [];
      const roofSpacing = (width < 768 ? 90 : 70) * (performanceMode === 'performance' ? 1.8 : 1.0);
      const roofPointsCount = Math.floor(width / roofSpacing);
      for (let i = 0; i < roofPointsCount; i++) {
        const sourceX = (i / roofPointsCount) * width + (Math.random() * 30 - 15);
        const sourceY = Math.min(height * 0.15, 60 + Math.random() * 40);
        roofDrips.push({
          x: sourceX,
          y: sourceY,
          roofSourceX: sourceX,
          roofSourceY: sourceY,
          targetY: height * (0.65 + Math.random() * 0.3),
          speed: (8 + Math.random() * 8) * speedMult,
          radius: 1.5 + Math.random() * 2,
          opacity: 0.6 + Math.random() * 0.3,
          streamLength: 0,
          isStream: Math.random() < 0.2,
          formingProgress: Math.random(),
        });
      }
    };

    initRain();

    // Animation Loop
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const delta = Math.min((currentTime - lastTime) / 16.67, 2.5); // Cap delta to prevent lag skips
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      if (!settings.enabled || prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const windSlope = getWindOffset();
      const speedMult = getSpeedMultiplier();

      // 1. Draw and Update Rain Drops (TOP -> BOTTOM)
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        if (d.layer === 'fg' && !settings.foregroundRain) {
          d.layer = 'mid';
        }

        // Draw drop line (TOP -> BOTTOM gravity)
        ctx.beginPath();
        const endX = d.x + d.length * windSlope;
        const endY = d.y + d.length;

        // Gradient for drop tail to head
        const grad = ctx.createLinearGradient(d.x, d.y, endX, endY);
        grad.addColorStop(0, `rgba(220, 235, 255, 0)`);
        grad.addColorStop(0.7, `rgba(220, 240, 255, ${d.opacity * 0.6})`);
        grad.addColorStop(1, `rgba(240, 250, 255, ${d.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = d.thickness;
        ctx.lineCap = 'round';
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Move drop downward
        d.x += d.speed * windSlope * delta;
        d.y += d.speed * delta;

        // Check if drop hits ground (lower 35% of the screen where courtyard/porch is)
        if (d.y > height * 0.7 && Math.random() < 0.08 * delta && settings.puddleRipples) {
          ripples.push({
            x: d.x,
            y: d.y + d.length,
            radiusX: 1,
            radiusY: 0.35,
            maxRadius: (8 + Math.random() * 14) * (d.layer === 'fg' ? 1.4 : 0.8),
            opacity: 0.45 * d.opacity,
            life: 0,
            maxLife: 22 + Math.random() * 12,
          });

          // Small splash particle in cinematic/balanced mode
          if (performanceMode !== 'performance' && (d.layer === 'fg' || d.layer === 'mid')) {
            splashes.push({
              x: d.x,
              y: d.y + d.length,
              vx: (Math.random() - 0.5) * 3,
              vy: -2 - Math.random() * 3,
              alpha: 0.6,
              size: 1 + Math.random() * 1.5,
            });
          }
        }

        // Reset drop to top once off screen
        if (d.y > height + 50) {
          d.y = -d.length - Math.random() * 40;
          d.x = Math.random() * (width + 300) - 150;
        }
        if (d.x > width + 100) {
          d.x = -50;
        }
      }

      // 2. Roof Drips Animation
      if (settings.roofDrips) {
        for (let i = 0; i < roofDrips.length; i++) {
          const drip = roofDrips[i];

          // Stage 1: Forming droplet at roof edge
          if (drip.formingProgress < 1) {
            drip.formingProgress += (0.008 + Math.random() * 0.012) * speedMult * delta;

            // Draw droplet hanging from roof edge
            const hangRadius = Math.max(0, drip.radius * Math.min(Math.max(0, drip.formingProgress), 1));
            if (hangRadius > 0.1) {
              ctx.beginPath();
              ctx.arc(drip.roofSourceX, drip.roofSourceY + hangRadius * 0.5, hangRadius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(230, 245, 255, ${Math.min(1, Math.max(0, 0.4 + drip.formingProgress * 0.4))})`;
              ctx.fill();

              // Glisten highlight
              const glistenRadius = Math.max(0.05, hangRadius * 0.35);
              ctx.beginPath();
              ctx.arc(drip.roofSourceX - hangRadius * 0.3, drip.roofSourceY + hangRadius * 0.3, glistenRadius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
              ctx.fill();
            }
          } else {
            // Stage 2: Falling droplet or stream
            if (drip.isStream) {
              // Draw stream
              ctx.beginPath();
              ctx.moveTo(drip.x, drip.y - 12);
              ctx.lineTo(drip.x + windSlope * 16, drip.y);
              ctx.strokeStyle = `rgba(235, 245, 255, ${Math.min(1, Math.max(0, drip.opacity * 0.7))})`;
              ctx.lineWidth = Math.max(0.5, drip.radius * 0.9);
              ctx.stroke();
            } else {
              // Draw tear drop
              const dropRadius = Math.max(0.1, drip.radius);
              ctx.beginPath();
              ctx.arc(drip.x, drip.y, dropRadius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(235, 248, 255, ${Math.min(1, Math.max(0, drip.opacity))})`;
              ctx.fill();
            }

            drip.x += drip.speed * windSlope * 0.7 * delta;
            drip.y += drip.speed * delta;
            drip.speed += 0.35 * delta; // Gravity acceleration

            // Splash on ground
            if (drip.y >= drip.targetY || drip.y >= height * 0.85) {
              if (settings.puddleRipples) {
                ripples.push({
                  x: drip.x,
                  y: drip.y,
                  radiusX: 2,
                  radiusY: 0.6,
                  maxRadius: 16 + Math.random() * 12,
                  opacity: 0.55,
                  life: 0,
                  maxLife: 30,
                });
              }

              // Reset droplet back to roof
              drip.y = drip.roofSourceY;
              drip.x = drip.roofSourceX;
              drip.formingProgress = 0;
              drip.speed = (6 + Math.random() * 6) * speedMult;
              drip.isStream = Math.random() < 0.18;
            }
          }
        }
      }

      // 3. Ground Puddle Ripples Animation
      if (settings.puddleRipples && ripples.length > 0) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.life += delta;
          const progress = r.life / r.maxLife;

          if (progress >= 1) {
            ripples.splice(i, 1);
            continue;
          }

          const currentRadiusX = Math.max(0.1, r.radiusX + (r.maxRadius - r.radiusX) * Math.sqrt(Math.max(0, Math.min(1, progress))));
          const currentRadiusY = Math.max(0.05, currentRadiusX * 0.36); // Perspective ellipse
          const currentAlpha = Math.max(0, r.opacity * (1 - progress));

          // Outer ripple ring
          if (currentRadiusX > 0.1 && currentRadiusY > 0.05) {
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, currentRadiusX, currentRadiusY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(220, 240, 255, ${currentAlpha * 0.75})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Inner echo ripple ring
            if (progress < 0.7 && currentRadiusX * 0.5 > 0.1 && currentRadiusY * 0.5 > 0.05) {
              ctx.beginPath();
              ctx.ellipse(r.x, r.y, currentRadiusX * 0.5, currentRadiusY * 0.5, 0, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(240, 250, 255, ${currentAlpha * 0.4})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }

      // 4. Splash Particles
      if (splashes.length > 0) {
        for (let i = splashes.length - 1; i >= 0; i--) {
          const p = splashes[i];
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.vy += 0.25 * delta; // gravity
          p.alpha -= 0.04 * delta;

          if (p.alpha <= 0) {
            splashes.splice(i, 1);
            continue;
          }

          const splashRadius = Math.max(0.1, p.size);
          ctx.beginPath();
          ctx.arc(p.x, p.y, splashRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(235, 248, 255, ${Math.min(1, Math.max(0, p.alpha))})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [settings, performanceMode]);

  return (
    <canvas
      ref={canvasRef}
      id="rain-simulation-canvas"
      className="absolute inset-0 pointer-events-none z-20 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
