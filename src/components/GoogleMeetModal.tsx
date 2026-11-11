import React, { useState } from 'react';
import {
  X,
  Video,
  Plus,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Lock,
} from 'lucide-react';
import { createGoogleMeetSpace } from '../services/meet/meetApi.ts';
import { googleSignIn, getAccessToken } from '../services/meet/meetAuth.ts';
import { MeetSpace, MeetingMetadata } from '../types/index.ts';

interface GoogleMeetModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: MeetingMetadata;
  onUpdateMetadata: (meta: Partial<MeetingMetadata>) => void;
}

export const GoogleMeetModal: React.FC<GoogleMeetModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onUpdateMetadata,
}) => {
  const [createdSpace, setCreatedSpace] = useState<MeetSpace | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleRequestCreateSpace = () => {
    // Open explicit confirmation dialog as required by Workspace integration guidelines
    setShowConfirmDialog(true);
  };

  const handleConfirmedCreateSpace = async () => {
    setShowConfirmDialog(false);
    setIsCreating(true);
    setErrorMsg(null);
    try {
      const space = await createGoogleMeetSpace();
      setCreatedSpace(space);
      onUpdateMetadata({
        meetCode: space.meetingCode,
        meetUrl: space.meetingUri,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create Google Meet space');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUri = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Google Meet Integration</h2>
              <p className="text-xs text-slate-400">
                Connected with Google Workspace Meet API v2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Active Meeting Space Status */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Linked Google Meet Space</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Meeting Title:</span>
                <span className="text-slate-200 font-medium">{metadata.title}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Meet Code:</span>
                <span className="font-mono text-sky-400">{metadata.meetCode || 'fps-cur-2026'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Direct Link:</span>
                <a
                  href={metadata.meetUrl || `https://meet.google.com/${metadata.meetCode || 'fps-cur-2026'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>{metadata.meetUrl || `meet.google.com/${metadata.meetCode || 'fps-cur-2026'}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Create New Space Action */}
          <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-200 mb-1">
              Create New Google Meet Space
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Generates an official Google Meet conference link and associates all captured English & Khmer meeting notes with the room.
            </p>

            <button
              onClick={handleRequestCreateSpace}
              disabled={isCreating}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Provisioning Google Meet...' : 'Create New Google Meet Space'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-800/80 p-3 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {createdSpace && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>New Space Created Successfully!</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {createdSpace.meetingUri}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleCopyUri(createdSpace.meetingUri)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                </button>
                <a
                  href={createdSpace.meetingUri}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>Join Call</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Dialog (Mandatory for mutating Google API actions) */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400 mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-100">Create Google Meet Space?</h4>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This will create a new Google Meet conference room in your Google account and link it to this note summarizer session. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedCreateSpace}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
