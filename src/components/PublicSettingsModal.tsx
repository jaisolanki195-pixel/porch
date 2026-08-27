import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Music,
  Gauge,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  CloudRain,
  Eye,
  Check,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Radio,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  VisitorPreferences,
  PerformanceMode,
  PlaylistLoopMode,
} from '../types';
import { DEFAULT_VISITOR_PREFERENCES } from '../utils/constants';
import {
  isFirebaseConfigured,
  AUTHORIZED_OWNER_EMAIL,
  signInOwnerWithGoogle,
  signOutOwner,
  subscribeToOwnerAuth,
} from '../services/firebaseAuth';
import { User } from 'firebase/auth';

interface PublicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: VisitorPreferences;
  onUpdatePreferences: (updated: Partial<VisitorPreferences>) => void;
  onOpenOwnerAdmin: () => void;
}

type VisitorTab = 'playback' | 'experience';

export const PublicSettingsModal: React.FC<PublicSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onOpenOwnerAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<VisitorTab>('playback');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Subscribe to real-time auth state
  useEffect(() => {
    const unsubscribe = subscribeToOwnerAuth((user, ownerFlag) => {
      setCurrentUser(user);
      setIsOwner(ownerFlag);
      if (ownerFlag) {
        setAuthError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleResetVisitorPrefs = () => {
    onUpdatePreferences(DEFAULT_VISITOR_PREFERENCES);
    showToast('Preferences restored to default');
  };

  const handleOwnerSignIn = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const result = await signInOwnerWithGoogle();
      if (result.success && result.isOwner) {
        showToast('Welcome back, Station Owner');
        // Automatically open the owner admin panel
        setTimeout(() => {
          onClose();
          onOpenOwnerAdmin();
        }, 500);
      } else {
        setAuthError(result.error || 'Owner authentication failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setAuthError(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleOwnerSignOut = async () => {
    await signOutOwner();
    showToast('Signed out of Owner Mode');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="public-settings-dialog"
        className="w-full max-w-lg glass-card-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-stone-100 border border-white/15"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                Settings & Preferences
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                Adjust your personal radio playback and device performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-black/30 border-b border-white/10">
          <button
            onClick={() => setActiveTab('playback')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'playback'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Playback Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'experience'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Device & Visuals</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-sm">
          {/* TAB 1: PLAYBACK CONTROLS */}
          {activeTab === 'playback' && (
            <div className="space-y-4">
              {/* AutoPlay Next Toggle */}
              <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-stone-200">Auto-Play Next Track</div>
                  <div className="text-[11px] text-stone-400">
                    Automatically advance to next melody when current song ends
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.autoPlayNext}
                    onChange={(e) =>
                      onUpdatePreferences({ autoPlayNext: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Loop Mode */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider">
                  Loop Behavior
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'repeat-playlist', label: 'Loop Playlist' },
                      { id: 'repeat-single', label: 'Repeat Song' },
                      { id: 'off', label: 'Off' },
                    ] as { id: PlaylistLoopMode; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onUpdatePreferences({ playlistLoop: item.id })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all text-center cursor-pointer ${
                        preferences.playlistLoop === item.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shuffle & Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-200">Shuffle Tracks</div>
                    <div className="text-[10px] text-stone-400">Randomize song sequence</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.shuffle}
                    onChange={(e) => onUpdatePreferences({ shuffle: e.target.checked })}
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-200">Audio Visualizer</div>
                    <div className="text-[10px] text-stone-400">Display frequency bars</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.showVisualizer}
                    onChange={(e) =>
                      onUpdatePreferences({ showVisualizer: e.target.checked })
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEVICE & VISUAL PERFORMANCE */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              {/* Performance Mode Selector */}
              <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2">
                <div>
                  <div className="text-xs font-semibold text-stone-200">Rendering Mode</div>
                  <div className="text-[11px] text-stone-400">
                    Adjust particle density and animations according to your device hardware
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(
                    [
                      { id: 'cinematic', label: 'Cinematic', desc: 'Full fidelity' },
                      { id: 'balanced', label: 'Balanced', desc: 'Smooth 60fps' },
                      { id: 'performance', label: 'Battery Saver', desc: 'Lightweight' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        onUpdatePreferences({ performanceMode: mode.id as PerformanceMode })
                      }
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        (preferences.performanceMode || 'cinematic') === mode.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="text-xs font-medium">{mode.label}</div>
                      <div className="text-[9px] opacity-75 font-mono">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rain Simulation Quick Switch */}
              <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CloudRain className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-medium text-stone-200">Monsoon Rainfall Effect</div>
                    <div className="text-[10px] text-stone-400">Toggle animated rain canvas</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.rainEnabled}
                  onChange={(e) => onUpdatePreferences({ rainEnabled: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Reduced Motion Toggle */}
              <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-medium text-stone-200">Reduced Motion</div>
                    <div className="text-[10px] text-stone-400">
                      Minimize camera sway and high-frequency atmospheric movement
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={(e) =>
                    onUpdatePreferences({ reducedMotion: e.target.checked })
                  }
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-stone-900/40 border border-white/5 rounded-xl text-[11px] text-stone-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                <span>
                  Preferences are stored privately in your browser and will be remembered on your next visit.
                </span>
              </div>
            </div>
          )}

          {/* =========================================================================
              DISCREET OWNER ACCESS SECTION (VISIBLE IN ALL TABS)
              ========================================================================= */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-serif font-bold tracking-wide uppercase text-amber-400">
                  🔐 Owner Access
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-300">
                Station Management
              </span>
            </div>

            {isOwner && currentUser ? (
              /* Authenticated Owner State */
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-amber-300">Signed in as Owner</div>
                      <div className="text-[11px] font-mono text-stone-300">{currentUser.email}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="open-owner-settings-btn"
                    onClick={() => {
                      onClose();
                      onOpenOwnerAdmin();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Open Owner Settings</span>
                  </button>

                  <button
                    id="sign-out-owner-btn"
                    onClick={handleOwnerSignOut}
                    title="Sign out of Owner Mode"
                    className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors border border-stone-800 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Logged Out / Public Visitor State */
              <div className="p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-xl space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-stone-200">Owner settings are restricted</div>
                    <p className="text-[11px] text-stone-300 leading-relaxed mt-0.5">
                      Global station branding, background artwork, rain physics, and canonical playlists require verified Google authentication.
                    </p>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 bg-red-950/50 border border-red-500/40 rounded-lg text-[11px] text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  id="sign-in-as-owner-btn"
                  onClick={handleOwnerSignIn}
                  disabled={isAuthenticating}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-amber-500/10 disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Authenticating with Google...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>Sign in as Owner</span>
                    </>
                  )}
                </button>

                {!isFirebaseConfigured && (
                  <div className="text-[10px] text-amber-400/80 font-mono flex items-center gap-1.5 pt-1">
                    <Radio className="w-3 h-3 text-amber-400" />
                    <span>Configured Owner: {AUTHORIZED_OWNER_EMAIL}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <button
            onClick={handleResetVisitorPrefs}
            title="Reset your personal preferences to default"
            className="px-3 py-1.5 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-300 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Preferences</span>
          </button>

          <div className="flex items-center gap-2">
            {toastMessage && (
              <span className="text-xs text-amber-400 flex items-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5" /> {toastMessage}
              </span>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
