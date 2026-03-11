/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown, Book, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FilterType = 'start' | 'end';

export default function App() {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('start');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchResults = useCallback(async (searchTerm: string, type: FilterType) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query, filterType);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [query, filterType, fetchResults]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Book size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kamus Kata</h1>
              <p className="text-sm text-gray-500 font-medium">Cari 80.000+ kata Bahasa Indonesia</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input Container */}
            <div className="relative flex-1 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={filterType === 'start' ? "Ketik huruf awal (contoh: U)..." : "Ketik huruf akhir (contoh: A)..."}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative min-w-[160px]">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full appearance-none pl-4 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-medium text-gray-700"
              >
                <option value="start">Huruf Awal</option>
                <option value="end">Huruf Akhir</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Mencari kata...</p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {results.map((word, index) => (
                <motion.div
                  key={word}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-default"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-800 group-hover:text-emerald-700 transition-colors">
                      {word}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300 group-hover:text-emerald-300 transition-colors">
                      ID
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : hasSearched && query.trim() ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Kata tidak ditemukan</h3>
              <p className="text-gray-500">Coba gunakan huruf atau filter yang berbeda.</p>
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Info size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mulai Mencari</h2>
              <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                Gunakan kotak pencarian di atas untuk menemukan kata berdasarkan huruf awal atau akhir. 
                Hasil akan muncul secara otomatis saat Anda mengetik.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Contoh Awal</span>
                  <span className="text-gray-800 font-medium italic">"U" → ular, unta...</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Contoh Akhir</span>
                  <span className="text-gray-800 font-medium italic">"A" → dunia, meja...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">
        <p>© 2026 Kamus Kata Indonesia • Ringan & Cepat</p>
      </footer>
    </div>
  );
}

