/**
 * Utility functions to extract YouTube Playlist ID or Video ID and manage YouTube IFrame API
 */

export function extractPlaylistId(urlOrId: string): { playlistId: string | null; videoId: string | null } {
  if (!urlOrId || typeof urlOrId !== 'string') {
    return { playlistId: null, videoId: null };
  }

  const trimmed = urlOrId.trim();

  // If it's already a playlist ID like PL... or RD... or OLAK...
  if (/^[A-Za-z0-9_-]{12,}$/.test(trimmed) && (trimmed.startsWith('PL') || trimmed.startsWith('RD') || trimmed.startsWith('OLAK') || trimmed.startsWith('UU') || trimmed.startsWith('FL'))) {
    return { playlistId: trimmed, videoId: null };
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const listParam = url.searchParams.get('list');
    if (listParam) {
      return { playlistId: listParam, videoId: url.searchParams.get('v') };
    }

    // Single video ID check
    const vParam = url.searchParams.get('v');
    if (vParam) {
      return { playlistId: null, videoId: vParam };
    }

    if (url.hostname === 'youtu.be') {
      const pathId = url.pathname.slice(1);
      return { playlistId: null, videoId: pathId || null };
    }
  } catch {
    // If not a full URL, fallback regex
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) {
      return { playlistId: listMatch[1], videoId: null };
    }
  }

  return { playlistId: null, videoId: null };
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Load the official YouTube IFrame Player API script tag once
let youtubeScriptLoadingPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  // Already loaded and ready
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve();
  }

  if (youtubeScriptLoadingPromise) {
    return youtubeScriptLoadingPromise;
  }

  youtubeScriptLoadingPromise = new Promise((resolve) => {
    // Check if already available on window
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }

    const previousCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') {
        try {
          previousCallback();
        } catch {
          // ignore
        }
      }
      resolve();
    };

    // Also poll in case script was already injected or cached
    const interval = window.setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    // Timeout safety
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 10000);

    // Check if script tag already exists in head/body
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });

  return youtubeScriptLoadingPromise;
}
