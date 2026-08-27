import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MusicSettings, PlayerStatus, PlaylistItem } from '../types';
import { extractPlaylistId, loadYouTubeIframeApi } from '../utils/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const MAX_TRACK_ATTEMPTS = 8;
const TRACK_LOAD_TIMEOUT_MS = 10000; // 10 seconds timeout to reach PLAYING

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
  const isDestroyedRef = useRef<boolean>(false);

  // Timers
  const progressIntervalRef = useRef<number | null>(null);
  const skipTimeoutRef = useRef<number | null>(null);
  const trackLoadTimeoutRef = useRef<number | null>(null);
  const transitionLockTimeoutRef = useRef<number | null>(null);

  // Transition & Request ID Management (prevents duplicate error handling & race conditions)
  const currentTransitionIdRef = useRef<number>(0);
  const handledTransitionIdRef = useRef<number>(-1);
  const isTransitioningRef = useRef<boolean>(false);
  const consecutiveSkipsRef = useRef<number>(0);

  // Session-level tracking of failed / unplayable tracks for current playlist
  const failedVideoIdsRef = useRef<Set<string>>(new Set());
  const failedIndicesRef = useRef<Set<number>>(new Set());
  const currentPlaylistUrlRef = useRef<string>(musicSettings.playlistUrl);

  const [status, setStatus] = useState<PlayerStatus>({
    isPlaying: false,
    playbackState: 'idle',
    currentTime: 0,
    duration: 0,
    currentIndex: 0,
    totalTracks: 0,
    trackTitle: 'Father’s Radio — Vividh Bharati 90s Melodies',
    author: 'Transistor Monsoons',
    isBuffering: false,
    isReady: false,
    tuningMessage: null,
    error: null,
    isEntirePlaylistUnplayable: false,
    needsUserGesture: false,
    playlist: [],
  });

  // Keep a ref to latest musicSettings to avoid stale closures in YouTube events
  const settingsRef = useRef<MusicSettings>(musicSettings);
  useEffect(() => {
    settingsRef.current = musicSettings;
  }, [musicSettings]);

  // Keep ref to status for callbacks
  const statusRef = useRef<PlayerStatus>(status);
  useEffect(() => {
    statusRef.current = status;
    onStatusChange(status);
  }, [status, onStatusChange]);

  // Clean up all pending timers
  const clearAllTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    if (trackLoadTimeoutRef.current) {
      clearTimeout(trackLoadTimeoutRef.current);
      trackLoadTimeoutRef.current = null;
    }
    if (transitionLockTimeoutRef.current) {
      clearTimeout(transitionLockTimeoutRef.current);
      transitionLockTimeoutRef.current = null;
    }
  }, []);

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

  // Transition Lock management
  const releaseTransitionLock = useCallback(() => {
    isTransitioningRef.current = false;
    if (transitionLockTimeoutRef.current) {
      clearTimeout(transitionLockTimeoutRef.current);
      transitionLockTimeoutRef.current = null;
    }
  }, []);

  const acquireTransitionLock = useCallback((timeoutMs = 1500): boolean => {
    if (isTransitioningRef.current) {
      return false;
    }
    isTransitioningRef.current = true;
    if (transitionLockTimeoutRef.current) {
      clearTimeout(transitionLockTimeoutRef.current);
    }
    transitionLockTimeoutRef.current = window.setTimeout(() => {
      isTransitioningRef.current = false;
      transitionLockTimeoutRef.current = null;
    }, timeoutMs);
    return true;
  }, []);

  // Start a new track transition ID
  const startNewTransition = useCallback(() => {
    currentTransitionIdRef.current += 1;
    return currentTransitionIdRef.current;
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

        if (playlistIds && playlistIds.length > 0) {
          const tracks: PlaylistItem[] = playlistIds.map((id, index) => {
            const isCurrent = index === currentIdx;
            const currentTitle = isCurrent && videoData?.title ? videoData.title : `Track ${index + 1}`;
            const currentAuthor = isCurrent && videoData?.author ? videoData.author : 'Vintage Transistor Radio';
            return {
              id,
              title: currentTitle,
              author: currentAuthor,
              index,
            };
          });

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
            playbackState: isPlaying ? 'playing' : prev.playbackState,
            currentTime: currentTime || 0,
            duration: duration || 0,
            currentIndex: currentIndex >= 0 ? currentIndex : prev.currentIndex,
            totalTracks: playlist.length || prev.totalTracks,
            trackTitle: newTitle,
            author: newAuthor,
            playlist: playlist.length ? playlist : prev.playlist,
            tuningMessage: isPlaying ? null : prev.tuningMessage,
          };
        });
      } catch {
        // Player might be transitioning
      }
    }, 400);
  }, [isPlayerUsable]);

  const stopProgressPolling = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Track load timeout helper
  const cancelTrackLoadTimeout = useCallback(() => {
    if (trackLoadTimeoutRef.current) {
      clearTimeout(trackLoadTimeoutRef.current);
      trackLoadTimeoutRef.current = null;
    }
  }, []);

  // Gracefully skip to next playable track when restricted or failed
  // Uses Transition ID deduplication so duplicate Error 150 calls are processed ONCE
  const handleTrackFailureAndSkip = useCallback(
    (reason: 'restricted' | 'unavailable' | 'html5' | 'timeout' | 'unknown', transitionId: number) => {
      cancelTrackLoadTimeout();

      // 1. Check if this transition has already been handled
      if (handledTransitionIdRef.current === transitionId) {
        return; // Already processed this failure for the current transition
      }
      handledTransitionIdRef.current = transitionId;

      const player = ytPlayerRef.current;
      if (!isPlayerUsable(player)) {
        releaseTransitionLock();
        return;
      }

      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
        skipTimeoutRef.current = null;
      }

      // Record current failed track in session memory
      try {
        const currentIdx = typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : -1;
        const playlist = typeof player.getPlaylist === 'function' ? player.getPlaylist() || [] : [];
        const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : {};
        const videoId = videoData?.video_id || (currentIdx >= 0 && playlist[currentIdx]) || null;

        if (videoId) {
          failedVideoIdsRef.current.add(videoId);
        }
        if (currentIdx >= 0) {
          failedIndicesRef.current.add(currentIdx);
        }

        consecutiveSkipsRef.current += 1;

        // Log one concise diagnostic message (avoid repeated Error 150 spam)
        if (reason === 'restricted') {
          console.log(`Track unavailable for embedded playback (Error 150/101); advancing to next track.${videoId ? ` (${videoId})` : ''}`);
        } else if (reason === 'timeout') {
          console.log(`Track loading timed out; advancing to next track.${videoId ? ` (${videoId})` : ''}`);
        } else {
          console.log(`Track unavailable (${reason}); advancing to next track.${videoId ? ` (${videoId})` : ''}`);
        }

        const totalTracks = playlist.length;
        const allKnownFailed = totalTracks > 0 && failedIndicesRef.current.size >= totalTracks;
        const maxAttemptsExceeded = consecutiveSkipsRef.current >= MAX_TRACK_ATTEMPTS;

        // If entire playlist is unplayable or reached max track attempts, stop searching
        if (allKnownFailed || maxAttemptsExceeded) {
          console.warn("Father's Radio: Radio signal unavailable. Could not find a playable song in this playlist.");
          releaseTransitionLock();
          stopProgressPolling();
          setStatus((prev) => ({
            ...prev,
            isPlaying: false,
            playbackState: 'no-playable-track',
            isBuffering: false,
            tuningMessage: null,
            error: 'Radio signal unavailable: Could not find a playable song in this playlist.',
            isEntirePlaylistUnplayable: true,
          }));
          return;
        }

        // Show subtle nostalgic radio tuning status
        setStatus((prev) => ({
          ...prev,
          isPlaying: false,
          playbackState: 'skipping',
          isBuffering: true,
          tuningMessage: 'Tuning to the next melody…',
          error: null,
          isEntirePlaylistUnplayable: false,
        }));

        // Advance to next video with safe delay
        skipTimeoutRef.current = window.setTimeout(() => {
          try {
            if (!isPlayerUsable(ytPlayerRef.current)) {
              releaseTransitionLock();
              return;
            }
            const nextTransition = startNewTransition();
            armTrackLoadTimeout(nextTransition);
            ytPlayerRef.current.nextVideo();
          } catch (err) {
            console.warn('Error executing nextVideo in handleTrackFailureAndSkip:', err);
            releaseTransitionLock();
          }
        }, 350);
      } catch (err) {
        console.warn('Error in handleTrackFailureAndSkip:', err);
        releaseTransitionLock();
      }
    },
    [isPlayerUsable, releaseTransitionLock, startNewTransition, cancelTrackLoadTimeout, stopProgressPolling]
  );

  // Arm track loading timeout
  const armTrackLoadTimeout = useCallback((transitionId: number) => {
    cancelTrackLoadTimeout();
    trackLoadTimeoutRef.current = window.setTimeout(() => {
      const player = ytPlayerRef.current;
      if (isPlayerUsable(player)) {
        const state = typeof player.getPlayerState === 'function' ? player.getPlayerState() : -1;
        const playingState = window.YT?.PlayerState?.PLAYING ?? 1;
        if (state !== playingState) {
          handleTrackFailureAndSkip('timeout', transitionId);
        }
      }
    }, TRACK_LOAD_TIMEOUT_MS);
  }, [cancelTrackLoadTimeout, isPlayerUsable, handleTrackFailureAndSkip]);

  // Initialize YouTube Iframe Player with clean DOM container and singleton instance
  const initializePlayer = useCallback(async () => {
    if (!containerParentRef.current) return;
    isDestroyedRef.current = false;
    clearAllTimers();

    try {
      setStatus((prev) => ({
        ...prev,
        playbackState: 'loading',
        tuningMessage: 'Tuning station frequency…',
        isBuffering: true,
        error: null,
        isEntirePlaylistUnplayable: false,
      }));

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

      // Always create a fresh target DOM node inside parent container
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
            consecutiveSkipsRef.current = 0;
            const initTransition = startNewTransition();
            releaseTransitionLock();

            try {
              event.target.setVolume(settingsRef.current.volume);
              event.target.setShuffle(settingsRef.current.shuffle);
            } catch (e) {
              console.warn('Initial volume/shuffle error', e);
            }

            setStatus((prev) => ({
              ...prev,
              playbackState: 'idle',
              isReady: true,
              isBuffering: false,
              error: null,
              tuningMessage: null,
              isEntirePlaylistUnplayable: false,
            }));

            refreshPlaylistTracks(event.target);

            if (settingsRef.current.autoStart) {
              armTrackLoadTimeout(initTransition);
            }
          },

          onStateChange: (event: any) => {
            const player = event.target;
            const state = event.data;

            // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
            if (state === window.YT?.PlayerState?.PLAYING) {
              // Successfully reached PLAYING: cancel track load timeout, reset failure counter
              cancelTrackLoadTimeout();
              consecutiveSkipsRef.current = 0;
              releaseTransitionLock();
              startProgressPolling();
              refreshPlaylistTracks(player);

              const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : {};
              const curIdx = typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : 0;
              const dur = typeof player.getDuration === 'function' ? player.getDuration() : 0;

              setStatus((prev) => ({
                ...prev,
                isPlaying: true,
                playbackState: 'playing',
                isBuffering: false,
                trackTitle: videoData?.title || prev.trackTitle,
                author: videoData?.author || prev.author,
                currentIndex: curIdx >= 0 ? curIdx : prev.currentIndex,
                duration: dur || prev.duration,
                error: null,
                tuningMessage: null,
                isEntirePlaylistUnplayable: false,
                needsUserGesture: false,
              }));
            } else if (state === window.YT?.PlayerState?.PAUSED) {
              cancelTrackLoadTimeout();
              stopProgressPolling();
              setStatus((prev) => ({
                ...prev,
                isPlaying: false,
                playbackState: 'paused',
                isBuffering: false,
              }));
            } else if (state === window.YT?.PlayerState?.BUFFERING) {
              setStatus((prev) => ({
                ...prev,
                playbackState: 'buffering',
                isBuffering: true,
                tuningMessage: prev.tuningMessage || 'Receiving the signal...',
              }));
            } else if (state === window.YT?.PlayerState?.ENDED) {
              cancelTrackLoadTimeout();
              stopProgressPolling();

              // Guard against double transition / race conditions
              if (!acquireTransitionLock(2000)) {
                return;
              }

              const currentSettings = settingsRef.current;
              const loopMode = currentSettings.playlistLoop;
              const autoNext = currentSettings.autoPlayNext;

              if (loopMode === 'repeat-single') {
                try {
                  const endTransition = startNewTransition();
                  armTrackLoadTimeout(endTransition);
                  player.seekTo(0, true);
                  player.playVideo();
                  releaseTransitionLock();
                } catch (e) {
                  console.error('Repeat single error', e);
                  releaseTransitionLock();
                }
              } else if (autoNext) {
                const playlist = typeof player.getPlaylist === 'function' ? player.getPlaylist() || [] : [];
                const currentIdx = typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : 0;
                const isLastSong = playlist.length > 0 && currentIdx >= playlist.length - 1;

                if (isLastSong) {
                  if (loopMode === 'repeat-playlist') {
                    try {
                      const loopTransition = startNewTransition();
                      armTrackLoadTimeout(loopTransition);
                      player.playVideoAt(0);
                    } catch {
                      const loopTransition = startNewTransition();
                      armTrackLoadTimeout(loopTransition);
                      player.nextVideo();
                    }
                  } else {
                    setStatus((prev) => ({
                      ...prev,
                      isPlaying: false,
                      playbackState: 'ended',
                      isBuffering: false,
                    }));
                    releaseTransitionLock();
                  }
                } else {
                  try {
                    const nextTransition = startNewTransition();
                    armTrackLoadTimeout(nextTransition);
                    player.nextVideo();
                  } catch (e) {
                    console.error('Next video auto play error', e);
                    releaseTransitionLock();
                  }
                }
              } else {
                setStatus((prev) => ({
                  ...prev,
                  isPlaying: false,
                  playbackState: 'ended',
                  isBuffering: false,
                }));
                releaseTransitionLock();
              }
            }
          },

          onError: (event: any) => {
            const errorCode = event.data;
            const activeTransition = currentTransitionIdRef.current;

            // YouTube Error Codes:
            // 150 / 101: Embedded playback disallowed by video owner (treat as normal unplayable track)
            // 100: Video unavailable / removed / marked as private
            // 2: Invalid video parameter / ID
            // 5: HTML5 player error
            if (errorCode === 101 || errorCode === 150) {
              handleTrackFailureAndSkip('restricted', activeTransition);
            } else if (errorCode === 100 || errorCode === 2) {
              handleTrackFailureAndSkip('unavailable', activeTransition);
            } else if (errorCode === 5) {
              handleTrackFailureAndSkip('html5', activeTransition);
            } else {
              handleTrackFailureAndSkip('unknown', activeTransition);
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
      console.warn('Failed to initialize YouTube Player', err);
      setStatus((prev) => ({
        ...prev,
        playbackState: 'error',
        isBuffering: false,
        error: 'YouTube API unavailable. Radio frequency drifting offline.',
      }));
    }
  }, [
    refreshPlaylistTracks,
    startProgressPolling,
    stopProgressPolling,
    handleTrackFailureAndSkip,
    startNewTransition,
    acquireTransitionLock,
    releaseTransitionLock,
    clearAllTimers,
    armTrackLoadTimeout,
    cancelTrackLoadTimeout,
  ]);

  // Expose stable, guarded controls to parent
  useEffect(() => {
    playerRefCallback({
      play: () => {
        consecutiveSkipsRef.current = 0;
        cancelTrackLoadTimeout();
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            const trans = startNewTransition();
            armTrackLoadTimeout(trans);
            const promise = player.playVideo();
            if (promise && typeof promise.catch === 'function') {
              promise.catch((err: any) => {
                console.warn('Playback gesture needed:', err);
                cancelTrackLoadTimeout();
                setStatus((prev) => ({
                  ...prev,
                  isPlaying: false,
                  playbackState: 'autoplay-blocked',
                  needsUserGesture: true,
                  tuningMessage: 'Tap to Start Radio',
                }));
              });
            }
          } else {
            initializePlayer();
          }
        } catch (e) {
          console.warn('Play caught:', e);
        }
      },
      pause: () => {
        cancelTrackLoadTimeout();
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
            cancelTrackLoadTimeout();
            player.pauseVideo();
          } else {
            consecutiveSkipsRef.current = 0;
            const trans = startNewTransition();
            armTrackLoadTimeout(trans);
            const promise = player.playVideo();
            if (promise && typeof promise.catch === 'function') {
              promise.catch((err: any) => {
                console.warn('Playback gesture needed on toggle:', err);
                cancelTrackLoadTimeout();
                setStatus((prev) => ({
                  ...prev,
                  isPlaying: false,
                  playbackState: 'autoplay-blocked',
                  needsUserGesture: true,
                  tuningMessage: 'Tap to Start Radio',
                }));
              });
            }
          }
        } catch (e) {
          console.warn('Toggle caught:', e);
          try {
            ytPlayerRef.current?.playVideo();
          } catch {}
        }
      },
      next: () => {
        if (!acquireTransitionLock(1200)) return;
        if (skipTimeoutRef.current) {
          clearTimeout(skipTimeoutRef.current);
          skipTimeoutRef.current = null;
        }
        consecutiveSkipsRef.current = 0;
        const trans = startNewTransition();
        armTrackLoadTimeout(trans);
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            player.nextVideo();
          }
        } catch (e) {
          console.warn('Next caught:', e);
          releaseTransitionLock();
        }
      },
      previous: () => {
        if (!acquireTransitionLock(1200)) return;
        if (skipTimeoutRef.current) {
          clearTimeout(skipTimeoutRef.current);
          skipTimeoutRef.current = null;
        }
        consecutiveSkipsRef.current = 0;
        const trans = startNewTransition();
        armTrackLoadTimeout(trans);
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player)) {
            player.previousVideo();
          }
        } catch (e) {
          console.warn('Previous caught:', e);
          releaseTransitionLock();
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
        if (!acquireTransitionLock(1200)) return;
        if (skipTimeoutRef.current) {
          clearTimeout(skipTimeoutRef.current);
          skipTimeoutRef.current = null;
        }
        consecutiveSkipsRef.current = 0;
        const trans = startNewTransition();
        armTrackLoadTimeout(trans);
        try {
          const player = ytPlayerRef.current;
          if (isPlayerUsable(player) && typeof player.playVideoAt === 'function') {
            player.playVideoAt(index);
          }
        } catch (e) {
          console.warn('PlayIndex caught:', e);
          releaseTransitionLock();
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
        // Clear failed tracks memory on playlist change
        failedVideoIdsRef.current.clear();
        failedIndicesRef.current.clear();
        consecutiveSkipsRef.current = 0;
        currentPlaylistUrlRef.current = newUrl;
        const trans = startNewTransition();
        armTrackLoadTimeout(trans);
        releaseTransitionLock();

        setStatus((prev) => ({
          ...prev,
          playbackState: 'loading',
          error: null,
          tuningMessage: 'Tuning station frequency…',
          isBuffering: true,
          isEntirePlaylistUnplayable: false,
        }));

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
  }, [
    playerRefCallback,
    initializePlayer,
    isPlayerUsable,
    startNewTransition,
    acquireTransitionLock,
    releaseTransitionLock,
    armTrackLoadTimeout,
    cancelTrackLoadTimeout,
  ]);

  // Load player on mount or when playlist URL changes
  useEffect(() => {
    // Clear session failed tracks for new playlist
    failedVideoIdsRef.current.clear();
    failedIndicesRef.current.clear();
    consecutiveSkipsRef.current = 0;
    currentPlaylistUrlRef.current = musicSettings.playlistUrl;
    startNewTransition();
    releaseTransitionLock();

    initializePlayer();

    return () => {
      isDestroyedRef.current = true;
      clearAllTimers();
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
  }, [musicSettings.playlistUrl]);

  return (
    <div
      ref={containerParentRef}
      className="absolute -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
};
