import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import CrazyGamesApp from './experiments/crazygames/CrazyGamesApp.tsx';
import './index.css';

function RootEntry() {
  const [showProduction, setShowProduction] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('mode') === 'production';
    } catch {
      return false;
    }
  });

  return (
    <>
      {showProduction ? <App /> : <CrazyGamesApp />}

      {/* Development & Review Comparison Switcher */}
      <div className="fixed top-2 right-2 z-[9999] pointer-events-auto">
        <button
          onClick={() => setShowProduction((prev) => !prev)}
          title="Toggle between CrazyGames Edition and Original Production Game"
          className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded border backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 bg-black/80 hover:bg-black text-gray-300 border-gray-700 hover:border-cyan-400"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              !showProduction ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span>{!showProduction ? 'CRAZYGAMES BUILD (DEFAULT)' : 'PRODUCTION BUILD'}</span>
          <span className="text-[9px] text-gray-400 opacity-70">[COMPARE]</span>
        </button>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<RootEntry />);
