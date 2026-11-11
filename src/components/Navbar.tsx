import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Video,
  Download,
  Settings,
  Globe,
  LogOut,
  Calendar,
  Layers,
  BarChart3,
} from 'lucide-react';
import { AIProviderConfig } from '../types/index.ts';
import { googleSignIn, logout, initAuth } from '../services/meet/meetAuth.ts';
import { User } from 'firebase/auth';

interface NavbarProps {
  aiConfig: AIProviderConfig;
  onOpenAISettings: () => void;
  onOpenExtensionModal: () => void;
  onOpenMeetSpaces: () => void;
  activeTab: 'simulator' | 'transcript' | 'summary' | 'analytics';
  setActiveTab: (tab: 'simulator' | 'transcript' | 'summary' | 'analytics') => void;
  hasSummary: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  aiConfig,
  onOpenAISettings,
  onOpenExtensionModal,
  onOpenMeetSpaces,
  activeTab,
  setActiveTab,
  hasSummary,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(err.message || 'Google Sign-in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            🇰🇭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-lg tracking-tight">SamrapMeet</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium font-khmer border border-blue-500/30">
                សង្ខេប Meet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              English & Khmer Meet Notes &bull; <span className="text-blue-400 font-medium">Created by Footprints IT-Team (Footprints International School)</span>
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Meet Live Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'transcript'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Transcript Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Notes</span>
            {hasSummary && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Analytics (វិភាគ)</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* AI Provider Config Button */}
          <button
            onClick={onOpenAISettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            title="Configure AI Provider (Zero-Key NLP, Gemini, OpenAI, Claude)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline text-slate-300">Engine:</span>
            <span className="font-semibold text-white">
              {aiConfig.providerId === 'rule-engine'
                ? 'No-Key NLP'
                : aiConfig.providerId.toUpperCase()}
            </span>
            <Settings className="w-3 h-3 text-slate-400" />
          </button>

          {/* Chrome Extension Button */}
          <button
            onClick={onOpenExtensionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-colors"
            title="Get Chrome Extension Files for Google Meet"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chrome Extension</span>
          </button>

          {/* Google Workspace / Meet Sign In */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenMeetSpaces}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                title="Manage Google Meet Spaces"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Google Meet Linked</span>
              </button>
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Sign out of Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium shadow-sm transition-all disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-1 text-center text-xs text-rose-300">
          Google Meet connection notification: {authError}
        </div>
      )}
    </header>
  );
};
