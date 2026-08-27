import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MusicSettings, PlayerStatus, PlaylistItem } from '../types';
import { extractPlaylistId, loadYouTubeIframeApi } from '../utils/youtube';
import { CURATED_PLAYLISTS } from '../utils/constants';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeEngineProps {
  musicSettings: MusicSettings;
  onStatusChange: (status: PlayerStatus) => void;
  onPlaylistLoaded: (tracks: PlaylistItem[]) => void;
  playerRefCallback: (controls: YouTubeControls) => void;
}

export interface YouTubeControls {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (seconds: number) => void;
  playIndex: (index: number) => void;
  setVolume: (volume: number) => void;
  reloadPlaylist: (newUrl: string) => void;
}

export const YouTubeEngine: React.FC<YouTubeEngineProps> = ({
  musicSettings,
  onStatusChange,
  onPlaylistLoaded,
  playerRefCallback,
}) => {
  const containerParentRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const skipAttemptRef = useRef<number>(0);
  const isDestroyedRef = useRef<boolean>(false);

  const [status, setStatus] = useState<PlayerStatus>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentIndex: 0,
    totalTracks: 0,
    trackTitle: 'Father’s Radio — Vividh Bharati 90s Melodies',
    author: 'Transistor Monsoons',
    isBuffering: false,
    isReady: false,
    error: null,
    playlist: [],
  });

  // Keep a ref to latest musicSettings to avoid stale closures in YouTube events
  const settingsRef = useRef<MusicSettings>(musicSettings);
  useEffect(() => {
    settingsRef.current = musicSettings;
  }, [musicSettings]);

  // Keep ref to status for event logic
  const statusRef = useRef<PlayerStatus>(status);
  useEffect(() => {
    statusRef.current = status;
    onStatusChange(status);
  }, [status, onStatusChange]);

  // Helper to verify YouTube Player instance has an active, mounted iframe
  const isPlayerUsable = useCallback((player: any): boolean => {
    try {
      if (!player) return false;
      if (typeof player.getIframe !== 'function') return false;
      const iframe = player.getIframe();
      if (!iframe || !iframe.parentNode) return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  // Sync volume when musicSettings.volume changes
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (isPlayerUsable(player) && typeof player.setVolume === 'function') {
      try {
        player.setVolume(musicSettings.volume);
      } catch (err) {
        console.warn('Could not set volume', err);
      }
    }
  }, [musicSettings.volume, isPlayerUsable]);

  // Sync shuffle setting
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (isPlayerUsable(player) && typeof player.setShuffle === 'function') {
      try {
        player.setShuffle(musicSettings.shuffle);
      } catch (err) {
        console.warn('Could not set shuffle', err);
      }
    }
  }, [musicSettings.shuffle, isPlayerUsable]);

  // Auto-fetch playlist tracks metadata & titles
  const refreshPlaylistTracks = useCallback(
    (player: any) => {
      try {
        if (!isPlayerUsable(player)) return;
        const playlistIds: string[] = typeof player.getPlaylist === 'function' ? player.getPlaylist() || [] : [];
        const currentIdx = typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : 0;
        const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : {};

        const tracks: PlaylistItem[] = playlistIds.map((id, index) => {
          const isCurrent = index === currentIdx;
          const currentTitle = isCurrent && videoData?.title ? videoData.title : `Track ${index + 1}`;
          const currentAuthor = isCurrent && videoData?.author ? videoData.author : 'Classic Nostalgia';
          return {
            id,
            title: currentTitle,
            author: currentAuthor,
            index,
          };
        });

        // If playlist is empty, fallback to curated tracklist for this playlist
        if (tracks.length === 0) {
          const foundCurated = CURATED_PLAYLISTS.find((p) => p.url === settingsRef.current.playlistUrl);
          if (foundCurated && foundCurated.fallbackTracks) {
            const fallbackItems: PlaylistItem[] = foundCurated.fallbackTracks.map((t, idx) => ({
              id: t.id,
              title: t.title,
              author: t.author,
              index: idx,
            }));
            onPlaylistLoaded(fallbackItems);
            return;
          }
        }

        if (tracks.length > 0) {
          onPlaylistLoaded(tracks);
        }
      } catch (err) {
        console.warn('Error refreshing playlist tracks', err);
      }
    },
    [onPlaylistLoaded, isPlayerUsable]
  );

  // Poll video time and playback progress
  const startProgressPolling = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = window.setInterval(() => {
      const player = ytPlayerRef.current;
      if (!isPlayerUsable(player)) return;

      try {
        const isPlaying =
          typeof player.getPlayerState === 'function' &&
          player.getPlayerState() === (window.YT?.PlayerState?.PLAYING ?? 1);
        const currentTime = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
        const duration = typeof player.getDuration === 'function' ? player.getDuration() : 0;
        const currentIndex = typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : 0;
        const playlist = typeof player.getPlaylist === 'function' ? player.getPlaylist() || [] : [];
        const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : {};

        setStatus((prev) => {
          const newTitle = videoData?.title || prev.trackTitle;
          const newAuthor = videoData?.author || prev.author;
          return {
            ...prev,
            isPlaying,
            currentTime: currentTime || 0,
            duration: duration || 0,
            currentIndex: currentIndex >= 0 ? currentIndex : prev.currentIndex,
            totalTracks: playlist.length || prev.totalTracks,
            trackTitle: newTitle,
            author: newAuthor,
            playlist: playlist.length ? playlist : prev.playlist,
          };
        });
      } catch {
        // Player might be switching states
      }
    }, 300);
  }, [isPlayerUsable]);

  const stopProgressPolling = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Initialize YouTube Iframe Player with a brand new clean container DOM node
  const initializePlayer = useCallback(async () => {
    if (!containerParentRef.current) return;
    isDestroyedRef.current = false;

    try {
      await loadYouTubeIframeApi();

      if (isDestroyedRef.current || !containerParentRef.current) return;

      if (!window.YT || !window.YT.Player) {
        setTimeout(() => {
          if (!isDestroyedRef.current) initializePlayer();
        }, 300);
        return;
      }

      // Safely destroy previous player instance if any
      if (ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.destroy === 'function') {
            ytPlayerRef.current.destroy();
          }
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }

      // Always create a fresh target DOM node inside parent container to avoid null reference errors
      containerParentRef.current.innerHTML = '';
      const targetDiv = document.createElement('div');
      targetDiv.id = 'yt-target-' + Math.random().toString(36).substring(2, 9);
      containerParentRef.current.appendChild(targetDiv);

      const { playlistId, videoId } = extractPlaylistId(settingsRef.current.playlistUrl);

      const playerVars: any = {
        autoplay: settingsRef.current.autoStart ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        enablejsapi: 1,
      };

      if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
        playerVars.origin = window.location.origin;
      }

      const playerConfig: any = {
        height: '100%',
        width: '100%',
        playerVars,
        events: {
          onReady: (event: any) => {
            if (isDestroyedRef.current) {
              try {
                event.target.destroy();
              } catch {}
              return;
            }

            ytPlayerRef.current = event.target;
            skipAttemptRef.current = 0;

            try {
              event.target.setVolume(settingsRef.current.volume);
              event.target.setShuffle(settingsRef.current.shuffle);
            } catch (e) {
              console.warn('Initial volume/shuffle error', e);
            }

            setStatus((prev) => ({
              ...prev,
              isReady: true,
              error: null,
            }));

            refreshPlaylistTracks(event.target);
          },

          onStateChange: (event: any) => {
            const player = event.target;
            const state = event.data;

            // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
            if (state === window.YT?.PlayerState?.PLAYING) {
              skipAttemptRef.current = 0;
              startProgressPolling();
              refreshPlaylistTracks(player);

              const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : {};
              const curIdx = typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : 0;
              const dur = typeof player.getDuration === 'function' ? player.getDuration() : 0;

              setStatus((prev) => ({
                ...prev,
                isPlaying: true,
                isBuffering: false,
                trackTitle: videoData?.title || prev.trackTitle,
                author: videoData?.author || prev.author,
                currentIndex: curIdx >= 0 ? curIdx : prev.currentIndex,
                duration: dur || prev.duration,
                error: null,
              }));
            } else if (state === window.YT?.PlayerState?.PAUSED) {
              stopProgressPolling();
              setStatus((prev) => ({
                ...prev,
                isPlaying: false,
                isBuffering: false,
              }));
            } else if (state === window.YT?.PlayerState?.BUFFERING) {
              setStatus((prev) => ({
                ...prev,
                isBuffering: true,
              }));
            } else if (state === window.YT?.PlayerState?.ENDED) {
              const currentSettings = settingsRef.current;
              const loopMode = currentSettings.playlistLoop;
              const autoNext = currentSettings.autoPlayNext;

              if (loopMode === 'repeat-single') {
                try {
                  player.seekTo(0, true);
                  player.playVideo();
                } catch (e) {
                  console.error('Repeat single error', e);
                }
              } else if (autoNext) {
                const playlist = typeof player.getPlaylist === 'function' ? player.getPlaylist() || [] : [];
                const currentIdx = typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : 0;
                const isLastSong = playlist.length > 0 && currentIdx >= playlist.length - 1;

                if (isLastSong) {
                  if (loopMode === 'repeat-playlist') {
                    try {
                      player.playVideoAt(0);
                    } catch {
                      player.nextVideo();
                    }
                  } else {
                    setStatus((prev) => ({ ...prev, isPlaying: false }));
                  }
                } else {
                  try {
                    player.nextVideo();
                  } catch (e) {
                    console.error('Next video auto play error', e);
                  }
                }
              } else {
                setStatus((prev) => ({ ...prev, isPlaying: false }));
              }
            }
          },

          onError: (event: any) => {
            const errorCode = event.data;
            console.warn('YouTube Player Error Code:', errorCode);

            if (errorCode === 101 || errorCode === 150 || errorCode === 100) {
              skipAttemptRef.current += 1;

              if (skipAttemptRef.current <= 4) {
                setStatus((prev) => ({
                  ...prev,
                  error: 'Song restricted by owner for embedded playback. Auto-advancing to next melody...',
                  isBuffering: true,
                }));

                setTimeout(() => {
                  try {
                    ytPlayerRef.current?.nextVideo();
                  } catch (e) {
                    console.warn('Auto skip error', e);
                  }
                }, 600);
              } else {
                const fallbackList = CURATED_PLAYLISTS[0]?.fallbackTracks || [];
                const fallbackId = fallbackList[0]?.id || '1k8craCGpgs';

                setStatus((prev) => ({
                  ...prev,
                  error: 'External playlist tracks restricted. Tuned to 90s Monsoon Radio archive.',
                  isBuffering: false,
                }));

                try {
                  ytPlayerRef.current?.loadVideoById(fallbackId);
                  skipAttemptRef.current = 0;
                } catch {
                  // ignore
                }
              }
            } else if (errorCode === 2) {
              setStatus((prev) => ({
                ...prev,
                error: 'The YouTube Playlist URL or ID format is invalid.',
                isBuffering: false,
              }));
            } else if (errorCode === 5) {
              setStatus((prev) => ({
                ...prev,
                error: 'HTML5 playback error. Retrying stream...',
                isBuffering: false,
              }));
              setTimeout(() => {
                try {
                  ytPlayerRef.current?.playVideo();
                } catch {}
              }, 1000);
            } else {
              setStatus((prev) => ({
                ...prev,
                error: 'Could not stream track. Trying next available song...',
                isBuffering: false,
              }));
              setTimeout(() => {
                try {
                  ytPlayerRef.current?.nextVideo();
                } catch {}
              }, 800);
            }
          },
        },
      };

      if (playlistId) {
        playerConfig.playerVars.listType = 'playlist';
        playerConfig.playerVars.list = playlistId;
      } else if (videoId) {
        playerConfig.videoId = videoId;
      } else {
        playerConfig.playerVars.listType = 'playlist';
        playerConfig.playerVars.list = 'PL9bw4s5Ag3rU0Lp4F6-6Pq0a_sK_8jG6U';
      }

      new window.YT.Player(targetDiv, playerConfig);
    } catch (err) {
      console.error('Failed to initialize YouTube Player', err);
      setStatus((prev) => ({
        ...prev,
        error: 'YouTube API failed to load. Please check your network connection.',
      }));
    }
  }, [refreshPlaylistTracks, startProgressPolling, stopProgressPolling]);

  // Expose stable, guarded controls to parent
  useEffect(() => {
    playerRefCallback({
      play: () => {
        skipAttemptRef.current = 0;
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            player.playVideo();
          } else {
            initializePlayer();
          }
        } catch (e) {
          console.warn('Play caught:', e);
        }
      },
      pause: () => {
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            player.pauseVideo();
          }
        } catch (e) {
          console.warn('Pause caught:', e);
        }
      },
      togglePlay: () => {
        try {
          const player = ytPlayerRef.current;
          if (!isPlayerUsable(player)) {
            initializePlayer();
            return;
          }
          const state = typeof player.getPlayerState === 'function' ? player.getPlayerState() : -1;
          const playingState = window.YT?.PlayerState?.PLAYING ?? 1;
          if (state === playingState) {
            player.pauseVideo();
          } else {
            skipAttemptRef.current = 0;
            player.playVideo();
          }
        } catch (e) {
          console.warn('Toggle caught:', e);
          try {
            ytPlayerRef.current?.playVideo();
          } catch {}
        }
      },
      next: () => {
        skipAttemptRef.current = 0;
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            player.nextVideo();
          }
        } catch (e) {
          console.warn('Next caught:', e);
        }
      },
      previous: () => {
        skipAttemptRef.current = 0;
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            player.previousVideo();
          }
        } catch (e) {
          console.warn('Previous caught:', e);
        }
      },
      seekTo: (seconds: number) => {
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            player.seekTo(seconds, true);
          }
        } catch (e) {
          console.warn('Seek caught:', e);
        }
      },
      playIndex: (index: number) => {
        skipAttemptRef.current = 0;
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player) && typeof player.playVideoAt === 'function') {
            player.playVideoAt(index);
          }
        } catch (e) {
          console.warn('PlayIndex caught:', e);
        }
      },
      setVolume: (vol: number) => {
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player) && typeof player.setVolume === 'function') {
            player.setVolume(vol);
          }
        } catch (e) {
          console.warn('SetVolume caught:', e);
        }
      },
      reloadPlaylist: (newUrl: string) => {
        skipAttemptRef.current = 0;
        try {
          const player = ytPlayerRef.current;
          const parsed = extractPlaylistId(newUrl);
          if (isPlayerUsable(player)) {
            if (parsed.playlistId && typeof player.loadPlaylist === 'function') {
              player.loadPlaylist({
                list: parsed.playlistId,
                listType: 'playlist',
                index: 0,
              });
              return;
            } else if (parsed.videoId && typeof player.loadVideoById === 'function') {
              player.loadVideoById(parsed.videoId);
              return;
            }
          }
          initializePlayer();
        } catch (e) {
          console.warn('Reload caught:', e);
          initializePlayer();
        }
      },
    });
  }, [playerRefCallback, initializePlayer, isPlayerUsable]);

  // Load player on mount or when playlist URL changes
  useEffect(() => {
    initializePlayer();

    return () => {
      isDestroyedRef.current = true;
      stopProgressPolling();
      if (ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.destroy === 'function') {
            ytPlayerRef.current.destroy();
          }
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [musicSettings.playlistUrl, initializePlayer, stopProgressPolling]);

  return (
    <div
      ref={containerParentRef}
      className="absolute -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
};
