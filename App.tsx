
import React, { useState, useCallback } from 'react';
import { searchCompanyInfo } from './services/geminiService';
import { CompanyInfo, GroundingChunk } from './types';
import Loader from './components/Loader';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a search query.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setCompanyInfo(null);
    setSources([]);

    try {
      const result = await searchCompanyInfo(query);
      setCompanyInfo(result.companyInfo);
      setSources(result.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
            <div className="inline-block bg-cyan-400/10 p-3 rounded-full mb-4 border border-cyan-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10.5a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5h-2.25a.75.75 0 01-.75-.75zM10 10.5a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21v-4.5a3.75 3.75 0 013.75-3.75h1.5a3.75 3.75 0 013.75 3.75v4.5" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400">
                Company Intel Finder
            </h1>
            <p className="mt-4 text-lg text-slate-400">
                Instantly find verified company details using Gemini with Google Search.
            </p>
        </header>

        <main>
          <div className="relative mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., 'Microsoft corporation number' or 'Apple Inc location'"
              className="w-full pl-5 pr-32 py-4 text-lg bg-slate-800 border-2 border-slate-700 rounded-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all duration-300 text-slate-200 placeholder-slate-500"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-cyan-500 text-slate-900 font-semibold rounded-full hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          <div className="mt-8">
            {isLoading && <Loader />}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg animate-fade-in" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {!isLoading && !error && companyInfo && (
              <ResultCard companyInfo={companyInfo} sources={sources} />
            )}
            {!isLoading && !error && !companyInfo && (
              <div className="text-center text-slate-500 pt-10">
                  <p>Enter a query above to begin your search.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
