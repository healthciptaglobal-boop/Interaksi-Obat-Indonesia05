/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Loader2, 
  Pill,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { checkDrugInteractions, searchDrugs, type InteractionResult, type DrugInteraction } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length > 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        const results = await searchDrugs(query);
        setSuggestions(results);
        setIsSearching(false);
      }, 500);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const addDrug = (drug: string) => {
    if (!selectedDrugs.includes(drug)) {
      setSelectedDrugs([...selectedDrugs, drug]);
    }
    setQuery('');
    setSuggestions([]);
  };

  const removeDrug = (drug: string) => {
    setSelectedDrugs(selectedDrugs.filter(d => d !== drug));
    if (selectedDrugs.length <= 2) {
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (selectedDrugs.length < 2) {
      setError('Silakan pilih setidaknya dua obat untuk dianalisis.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await checkDrugInteractions(selectedDrugs);
      setResult(data);
    } catch (err) {
      setError('Gagal menganalisis interaksi. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'major': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'moderate': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'minor': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'major': return <AlertTriangle className="w-5 h-5" />;
      case 'moderate': return <AlertCircle className="w-5 h-5" />;
      case 'minor': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Pill className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Interaksi<span className="text-primary">Obat</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5" />
            AI Powered Analysis
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Search Section */}
        <section className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-slate-400 w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama obat (misal: Paracetamol, Ibuprofen...)"
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
              >
                {suggestions.map((drug, index) => (
                  <button
                    key={index}
                    onClick={() => addDrug(drug)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <span className="font-medium text-slate-700">{drug}</span>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Selected Drugs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Obat yang Dipilih</h2>
            <span className="text-xs font-medium text-slate-400">{selectedDrugs.length} obat</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedDrugs.map((drug) => (
                <motion.div
                  key={drug}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
                >
                  <span className="font-medium text-slate-700">{drug}</span>
                  <button
                    onClick={() => removeDrug(drug)}
                    className="p-1 hover:bg-rose-50 hover:text-rose-500 rounded-md transition-colors text-slate-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {selectedDrugs.length === 0 && (
              <div className="w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Pill className="w-8 h-8 opacity-20" />
                <p className="text-sm">Belum ada obat yang dipilih</p>
              </div>
            )}
          </div>

          {selectedDrugs.length >= 2 && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  Analisis Interaksi
                  <ChevronRight className="w-6 h-6" />
                </>
              )}
            </button>
          )}
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-rose-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="text-primary w-6 h-6" />
                  Hasil Analisis
                </h2>
                <div className="prose prose-slate max-w-none">
                  <Markdown>{result.summary}</Markdown>
                </div>
              </div>

              <div className="space-y-4">
                {result.interactions.map((interaction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-5 rounded-2xl border-l-4 shadow-sm space-y-3",
                      getSeverityColor(interaction.severity)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                        {getSeverityIcon(interaction.severity)}
                        {interaction.severity} Interaction
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-800">{interaction.description}</p>
                      <div className="bg-white/50 p-3 rounded-xl text-sm text-slate-700 border border-black/5">
                        <span className="font-bold block mb-1">Rekomendasi:</span>
                        {interaction.recommendation}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <footer className="pt-8 border-t border-slate-200">
          <div className="bg-slate-100 p-4 rounded-xl flex items-start gap-3 text-slate-500">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-700 uppercase">Peringatan Medis:</p>
              <p>
                Aplikasi ini menggunakan kecerdasan buatan (AI) untuk memberikan informasi interaksi obat. 
                Hasil analisis ini bersifat informatif dan <strong>bukan pengganti saran medis profesional</strong>, 
                diagnosis, atau perawatan. Selalu konsultasikan dengan dokter atau apoteker Anda sebelum 
                memulai atau menghentikan pengobatan apa pun.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

