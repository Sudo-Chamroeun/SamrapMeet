import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Key,
  Cpu,
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { AIProviderConfig, AIProviderType } from '../types/index.ts';
import { PROVIDER_OPTIONS, saveAIConfig } from '../services/ai/providerRegistry.ts';

interface AIProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIProviderConfig;
  onSaveConfig: (newConfig: AIProviderConfig) => void;
}

export const AIProviderModal: React.FC<AIProviderModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>(config.providerId);
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [modelName, setModelName] = useState(config.modelName);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || '');
  const [languageOutput, setLanguageOutput] = useState(config.languageOutput);
  const [summaryFormat, setSummaryFormat] = useState(config.summaryFormat);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentProviderMeta = PROVIDER_OPTIONS.find((p) => p.id === selectedProvider);

  const handleProviderChange = (id: AIProviderType) => {
    setSelectedProvider(id);
    const meta = PROVIDER_OPTIONS.find((p) => p.id === id);
    if (meta) {
      setModelName(meta.defaultModel);
      if (meta.defaultBaseUrl) {
        setBaseUrl(meta.defaultBaseUrl);
      }
    }
  };

  const handleSave = () => {
    const newConfig: AIProviderConfig = {
      providerId: selectedProvider,
      modelName: modelName.trim() || currentProviderMeta?.defaultModel || 'Bilingual-NLP-v2',
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      languageOutput,
      summaryFormat,
    };
    saveAIConfig(newConfig);
    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Modular AI Architecture Settings</h2>
              <p className="text-xs text-slate-400">
                Plug in any AI provider or use the built-in zero-key engine
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Notice for Zero-Key user */}
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">
                No AI API key? You're completely covered!
              </span>
              The default <strong>Built-in Bilingual NLP Engine</strong> requires 0 API keys, operates with zero latency, and extracts actions, decisions, and bilingual summaries directly. When you acquire an API key, switch anytime below.
            </div>
          </div>

          {/* Provider Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select AI Engine / Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROVIDER_OPTIONS.map((opt) => {
                const isSelected = selectedProvider === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleProviderChange(opt.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-slate-100 ring-1 ring-blue-500/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">{opt.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                          opt.requiresKey
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config Parameters */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {currentProviderMeta?.name} Configuration
            </h4>

            {currentProviderMeta?.requiresKey && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>API Key</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Stored locally in your browser
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      selectedProvider === 'gemini'
                        ? 'Enter Gemini API Key (or leave blank to fallback to Rule-Engine)'
                        : 'sk-...'
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. gemini-2.5-flash, gpt-4o-mini"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(selectedProvider === 'custom' || selectedProvider === 'openai') && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    API Base URL / Endpoint
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1/chat/completions"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Language Output
                </label>
                <select
                  value={languageOutput}
                  onChange={(e) => setLanguageOutput(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dual">🌐 Dual / Bilingual (English + ខ្មែរ)</option>
                  <option value="en">🇺🇸 English Only</option>
                  <option value="km">🇰🇭 Khmer Only (ជាភាសាខ្មែរ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Summary Depth
                </label>
                <select
                  value={summaryFormat}
                  onChange={(e) => setSummaryFormat(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="detailed">Comprehensive Minutes & Topics</option>
                  <option value="bullet">Bullet Points & Action Checklist</option>
                  <option value="executive">Executive Briefing Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {savedSuccess && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configuration Saved!</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
