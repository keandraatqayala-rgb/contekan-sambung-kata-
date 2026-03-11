/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ChevronDown, Book, Info, Moon, Sun, Star, History, RefreshCw, Hash, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FilterType = 'start' | 'end' | 'middle';

export default function App() {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('start');
  const [wordLength, setWordLength] = useState<string>('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('kamus-theme');
    return saved ? saved === 'dark' : false;
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('kamus-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('kamus-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [totalWords, setTotalWords] = useState<number>(0);

  // Theme effect
  useEffect(() => {
    localStorage.setItem('kamus-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('kamus-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('kamus-history', JSON.stringify(history));
  }, [history]);

  // Initial stats
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setTotalWords(data.count))
      .catch(console.error);
  }, []);

  const fetchResults = useCallback(async (searchTerm: string, type: FilterType, length: string) => {
    if (!searchTerm.trim() && !length) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      params.append('type', type);
      if (length) params.append('length', length);

      const response = await fetch(`/api/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        
        // Add to history if it's a meaningful search
        if (searchTerm.trim().length > 1) {
          setHistory(prev => {
            const newHistory = [searchTerm, ...prev.filter(h => h !== searchTerm)].slice(0, 5);
            return newHistory;
          });
        }
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
      fetchResults(query, filterType, wordLength);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, filterType, wordLength, fetchResults]);

  const handleClear = () => {
    setQuery('');
    setWordLength('');
    setResults([]);
    setHasSearched(false);
  };

  const toggleFavorite = (word: string) => {
    setFavorites(prev => 
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const handleRandom = async () => {
    try {
      const res = await fetch('/api/random');
      const data = await res.json();
      setQuery(data.word);
      setFilterType('middle');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0a] text-gray-100' : 'bg-[#f8fafc] text-gray-900'} font-sans selection:bg-emerald-500/20`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 border-b transition-colors duration-300 ${isDarkMode ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Book size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Kamus Kata</h1>
                <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">
                  {totalWords.toLocaleString()} Kata Tersedia
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-yellow-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kata..."
                className={`w-full pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-lg border ${
                  isDarkMode ? 'bg-white/5 border-white/10 focus:border-emerald-500/50' : 'bg-gray-50 border-gray-200 focus:border-emerald-500'
                }`}
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className={`w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer text-sm font-medium border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                  }`}
                >
                  <option value="start">Huruf Awal</option>
                  <option value="middle">Huruf Tengah</option>
                  <option value="end">Huruf Akhir</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Type size={16} />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <input
                  type="number"
                  value={wordLength}
                  onChange={(e) => setWordLength(e.target.value)}
                  placeholder="Jumlah Huruf"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                  }`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Hash size={16} />
                </div>
              </div>

              <button
                onClick={handleRandom}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                  isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                <RefreshCw size={16} />
                Acak
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* History & Favorites Quick Access */}
        {!query && !wordLength && (
          <div className="space-y-8 mb-8">
            {history.length > 0 && (
              <section>
                <div className="flex items-center gap-2 text-gray-400 mb-4 px-2">
                  <History size={16} />
                  <h2 className="text-xs font-bold uppercase tracking-widest">Riwayat Pencarian</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button
                      key={h}
                      onClick={() => setQuery(h)}
                      className={`px-4 py-2 rounded-full text-sm transition-all border ${
                        isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {favorites.length > 0 && (
              <section>
                <div className="flex items-center gap-2 text-yellow-500/70 mb-4 px-2">
                  <Star size={16} fill="currentColor" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">Kata Favorit</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {favorites.map((f) => (
                    <div
                      key={f}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'
                      }`}
                    >
                      <span className="font-medium truncate mr-2">{f}</span>
                      <button onClick={() => toggleFavorite(f)} className="text-yellow-400">
                        <Star size={16} fill="currentColor" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Results List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {isLoading ? 'Mencari...' : hasSearched ? `Ditemukan ${results.length} Kata` : 'Saran Kata'}
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-gray-400"
              >
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-medium">Memuat data...</p>
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-2"
              >
                {results.map((word, index) => (
                  <motion.div
                    key={word}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.01, 0.3) }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${
                      isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-emerald-500/30' : 'bg-white border-black/5 hover:shadow-md hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {word[0].toUpperCase()}
                      </div>
                      <span className="text-lg font-medium tracking-tight">{word}</span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(word)}
                      className={`p-2 rounded-lg transition-all ${
                        favorites.includes(word) ? 'text-yellow-400' : 'text-gray-300 group-hover:text-gray-400'
                      }`}
                    >
                      <Star size={20} fill={favorites.includes(word) ? "currentColor" : "none"} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ) : hasSearched && (query || wordLength) ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                  <Search size={40} />
                </div>
                <h3 className="text-xl font-bold mb-2">Tidak ada hasil</h3>
                <p className="text-gray-500">Coba sesuaikan kata kunci atau filter Anda.</p>
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-3xl p-10 text-center border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'
                }`}
              >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Book size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-4">Kamus Cerdas Indonesia</h2>
                <p className="text-gray-500 leading-relaxed max-w-md mx-auto mb-8">
                  Cari kata dengan filter huruf awal, tengah, atau akhir. Anda juga bisa memfilter berdasarkan jumlah huruf.
                </p>
                <div className="flex justify-center gap-4">
                  <div className={`px-6 py-3 rounded-2xl text-sm font-medium ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    🚀 Fast Search
                  </div>
                  <div className={`px-6 py-3 rounded-2xl text-sm font-medium ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    🌙 Dark Mode
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500 text-xs tracking-widest uppercase font-bold">
        <p>© 2026 Kamus Kata Indonesia • {totalWords.toLocaleString()} Kata</p>
      </footer>
    </div>
  );
}

