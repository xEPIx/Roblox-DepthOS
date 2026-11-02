import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import CrazyGamesApp from './experiments/crazygames/CrazyGamesApp.tsx';
import './index.css';

function RootEntry() {
  const isProdParam =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'production';

  // Default target: CrazyGames Arcade Edition (clean, commercial presentation)
  // Preserves production App when '?mode=production' is explicitly passed in the URL
  return isProdParam ? <App /> : <CrazyGamesApp />;
}

createRoot(document.getElementById('root')!).render(<RootEntry />);
