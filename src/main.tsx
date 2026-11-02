import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import CrazyGamesApp from './experiments/crazygames/CrazyGamesApp.tsx';
import './index.css';

function RootEntry() {
  const [mode, setMode] = useState<'crazygames' | 'production'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'production') return 'production';
      return (localStorage.getItem('depthos_active_mode') as 'production') || 'crazygames';
    } catch {
      return 'crazygames';
    }
  });

  const toggleMode = () => {
    const next = mode === 'crazygames' ? 'production' : 'crazygames';
    setMode(next);
    try {
      localStorage.setItem('depthos_active_mode', next);
    } catch {}
  };

  return (
    <>
      {mode === 'crazygames' ? <CrazyGamesApp /> : <App />}

      {/* Non-intrusive Mode Switcher Badge for Preview Testing */}
      <div className="fixed top-2 right-2 z-[9999] pointer-events-auto">
        <button
          onClick={toggleMode}
          title="Toggle between CrazyGames Edition and Original Production Game"
          className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded border backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 bg-black/80 hover:bg-black text-gray-300 border-gray-700 hover:border-cyan-400"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              mode === 'crazygames' ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span>{mode === 'crazygames' ? 'CRAZYGAMES BUILD' : 'PRODUCTION BUILD'}</span>
          <span className="text-[9px] text-gray-400 opacity-70">[SWITCH]</span>
        </button>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<RootEntry />);
